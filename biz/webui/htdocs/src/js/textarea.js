require('../css/textarea.css');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var dataCenter = require('./data-center');
var MAX_LENGTH =1024 * 16;
/* eslint-disable no-unused-vars */
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
  componentDidMount: function() {
    this.updateValue();
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
  componentDidUpdate: function() {
    this.updateValue();
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
      ReactDOM.findDOMNode(self.refs.nameInput).focus();
    });
  },
  download: function() {
    var target = ReactDOM.findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    target.value = '';
    ReactDOM.findDOMNode(this.refs.filename).value = name;
    ReactDOM.findDOMNode(this.refs.content).value = this.props.value || '';
    ReactDOM.findDOMNode(this.refs.downloadForm).submit();
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
      alert('Value name can not be empty.');
      return;
    }

    if (/\s/.test(name)) {
      alert('Name can not have spaces.');
      return;
    }

    if (modal.exists(name)) {
      alert('Value name \'' + name + '\' already exists.');
      return;
    }

    var value = (this.props.value || '').replace(/\r\n|\r/g, '\n');
    dataCenter.values.add({name: name, value: value}, function(data) {
      if (data && data.ec === 0) {
        modal.add(name, value);
        target.value = '';
        target.blur();
      } else {
        util.showSystemError();
      }
    });
  },
  hideNameInput: function() {
    this.state.showNameInput = false;
    this.forceUpdate();
  },
  updateValue: function() {
    var self = this;
    var value = self.state.value || '';
    var textarea = ReactDOM.findDOMNode(self.refs.textarea);
    if (self.props.hide) {
      textarea.value = '';
      self.curValue = '';
      clearTimeout(self._timeout);
      return;
    }
    if (value === self.curValue) {
      return;
    }
    clearTimeout(self._timeout);
    if (textarea.value === value) {
      return;
    }
    if (value.length < 10240) {
      textarea.value = value;
      self.curValue = value;
      return;
    }
    self.curValue = value;
    textarea.value = '';
    self._timeout = setTimeout(function() {
      textarea.value = value;
    }, 120);
  },
  render: function() {
    var value = this.props.value || '';
    var exceed = value.length - MAX_LENGTH;
    var showAddToValuesBtn = /[^\s]/.test(value);
    if (exceed > 512) {
      showAddToValuesBtn = false;
      value = value.substring(0, MAX_LENGTH) + '...\r\n\r\n(' + exceed + ' characters left, you can click on the Edit button in the upper right corner to view all)\r\n';
    }

    this.state.value = value;
    return (
        <div className={'fill orient-vertical-box w-textarea' + (this.props.hide ? ' hide' : '')}>
          <Tips data={this.props.tips} />
          <div className={'w-textarea-bar' + (value ? '' : ' hide')}>
            <a className="w-download" onDoubleClick={this.download}
              onClick={this.showNameInput} href="javascript:;" draggable="false">Download</a>
            {showAddToValuesBtn ? <a className="w-add" onClick={this.showNameInput} href="javascript:;" draggable="false">AddToValues</a> : ''}
            <a className="w-edit" onClick={this.edit} href="javascript:;" draggable="false">ViewAll</a>
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
          <textarea ref="textarea" onKeyDown={util.preventDefault} readOnly="readonly" className={this.props.className || ''}></textarea>
          <form ref="downloadForm" action="cgi-bin/download" style={{display: 'none'}}
            method="post" target="downloadTargetFrame">
            <input ref="filename" name="filename" type="hidden" />
            <input ref="content" name="content" type="hidden" />
          </form>
        </div>
    );
  }
});

module.exports = Textarea;
