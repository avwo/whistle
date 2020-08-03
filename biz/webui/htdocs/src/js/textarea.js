require('../css/textarea.css');
var React = require('react');
var ReactDOM = require('react-dom');
var TextView = require('./textview');
var CopyBtn = require('./copy-btn');
var util = require('./util');
var dataCenter = require('./data-center');
var message = require('./message');

var MAX_LENGTH = 1024 * 6;

var Tips = React.createClass({
  render: function() {
    var data = this.props.data || { hide: true };
    if (data.isHttps) {
      return (
        <div className={'w-textview-tips' + (data.hide ? ' hide' : '')}>
          <p>Tunnel</p>
          <a href="https://avwo.github.io/whistle/webui/https.html" target="_blank">
            Click here for more information
          </a>
        </div>
      );
    }
    return (
      <div className={'w-textview-tips' + (data.hide ? ' hide' : '')}>
        <p>{data.message}</p>
        {data.url ? <a href={data.url} target="_blank">Open the URL in a new window</a> : undefined}
      </div>
    );
  }
});

var Textarea = React.createClass({
  getInitialState: function() {
    return {};
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    var nextHide = util.getBoolean(nextProps.hide);
    if (hide !== nextHide || !this.props.value) {
      return true;
    }
    if (hide) {
      return false;
    }
    return this.props.value !== nextProps.value;
  },
  preventBlur: function(e) {
    e.target.nodeName != 'INPUT' && e.preventDefault();
  },
  edit: function() {
    util.openEditor(this.props.value);
  },
  showNameInput: function(e) {
    var self = this;
    self.state.showDownloadInput = /w-download/.test(e.target.className);
    self.state.showNameInput = true;
    self.forceUpdate(function() {
      var nameInput = ReactDOM.findDOMNode(self.refs.nameInput);
      var defaultName = !nameInput.value && self.props.defaultName;
      if (defaultName) {
        nameInput.value = defaultName;
      }
      nameInput.select();
      nameInput.focus();
    });
  },
  download: function() {
    var target = ReactDOM.findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    target.value = '';
    var base64 = this.props.base64;
    ReactDOM.findDOMNode(this.refs.filename).value = name;
    ReactDOM.findDOMNode(this.refs.type).value = base64 ? 'base64' : '';
    ReactDOM.findDOMNode(this.refs.headers).value = this.props.headers || '';
    ReactDOM.findDOMNode(this.refs.content).value = base64 != null ? base64 : (this.props.value || '');
    ReactDOM.findDOMNode(this.refs.downloadForm).submit();
    this.hideNameInput();
  },
  submit: function(e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var modal = dataCenter.valuesModal;
    if (!modal) {
      return;
    }
    var target = ReactDOM.findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    if (this.state.showDownloadInput) {
      this.download();
      return;
    }
    if (!name) {
      message.error('Value name cannot be empty.');
      return;
    }

    if (/\s/.test(name)) {
      message.error('Name cannot have spaces.');
      return;
    }

    if (modal.exists(name) &&
      !confirm('The name \'' + name + '\' already exists.\nDo you want to override it.')) {
      return;
    }

    var value = (this.props.value || '').replace(/\r\n|\r/g, '\n');
    dataCenter.values.add({name: name, value: value}, function(data, xhr) {
      if (data && data.ec === 0) {
        modal.add(name, value);
        target.value = '';
        target.blur();
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  hideNameInput: function() {
    this.state.showNameInput = false;
    this.forceUpdate(function() {
      var nameInput = ReactDOM.findDOMNode(this.refs.nameInput);
      var defaultName = this.props.defaultName;
      if (defaultName === nameInput.value) {
        nameInput.value = '';
      }
    });
  },
  render: function() {
    var value = this.props.value || '';
    var exceed = value.length - MAX_LENGTH;
    var showAddToValuesBtn = /\S/.test(value);
    if (exceed > 512) {
      showAddToValuesBtn = false;
      value = value.substring(0, MAX_LENGTH) + '...\r\n\r\n(' + exceed + ' characters left, you can click on the ViewAll button in the upper right corner to view all)\r\n';
    }
    var isHexView = this.props.isHexView;
    this.state.value = value;
    return (
        <div className={'fill orient-vertical-box w-textarea' + (this.props.hide ? ' hide' : '')}>
          <Tips data={this.props.tips} />
          <div className={'w-textarea-bar' + (value ? '' : ' hide')}>
            <CopyBtn value={this.props.value} />
            {isHexView ? <CopyBtn name="AsHex" value={util.getHexText(this.props.value)} /> : undefined}
            <a className="w-download" onDoubleClick={this.download}
              onClick={this.showNameInput} draggable="false">Download</a>
            {showAddToValuesBtn ? <a className="w-add" onClick={this.showNameInput} draggable="false">+Value</a> : ''}
            <a className="w-edit" onClick={this.edit} draggable="false">ViewAll</a>
            <div onMouseDown={this.preventBlur}
              style={{display: this.state.showNameInput ? 'block' : 'none'}}
              className="shadow w-textarea-input"><input ref="nameInput"
              onKeyDown={this.submit}
              onBlur={this.hideNameInput}
              type="text"
              maxLength="64"
              placeholder={this.state.showDownloadInput ? 'Input the filename' : 'Input the key'}
            /><button type="button" onClick={this.submit} className="btn btn-primary">OK</button></div>
          </div>
          <TextView className={this.props.className || ''} value={value} />
          <form ref="downloadForm" action="cgi-bin/download" style={{display: 'none'}}
            method="post" target="downloadTargetFrame">
            <input ref="filename" name="filename" type="hidden" />
            <input ref="type" name="type" type="hidden" />
            <input ref="headers" name="headers" type="hidden" />
            <input ref="content" name="content" type="hidden" />
          </form>
        </div>
    );
  }
});

module.exports = Textarea;
