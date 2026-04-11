require('../css/textarea.css');
var React = require('react');
var ReactDOM = require('react-dom');
var TextView = require('./textview');
var CopyBtn = require('./copy-btn');
var util = require('./util');
var storage = require('./storage');
var dataCenter = require('./data-center');
var message = require('./message');
var win = require('./win');
var events = require('./events');
var Tips = require('./panel-tips');
var Icon = require('./icon');

var MAX_LENGTH = 1024 * 6;
var OPEN_WITH_KEY = 'openWithTemplate';
var findDOMNode = ReactDOM.findDOMNode;

var Textarea = React.createClass({
  getInitialState: function () {
    return {};
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBool(this.props.hide);
    var nextHide = util.getBool(nextProps.hide);
    if (this._isCaptured !== dataCenter.isCapture) {
      this._isCaptured = dataCenter.isCapture;
      return true;
    }
    if (hide !== nextHide || !this.props.value) {
      return true;
    }
    if (hide) {
      return false;
    }
    return this.props.value !== nextProps.value;
  },
  preventBlur: function (e) {
    e.target.nodeName != 'INPUT' && e.preventDefault();
  },
  edit: function () {
    util.openEditor(this.props.value);
  },
  getOpenWithTemplate: function () {
    return (storage.get(OPEN_WITH_KEY) || '').trim();
  },
  hasOpenWithTemplate: function () {
    return !!this.getOpenWithTemplate();
  },
  getOpenWithUrl: function () {
    var text = this.props.value || '';
    var template = this.getOpenWithTemplate();
    var encoded = encodeURIComponent(text);
    var url = template.indexOf('${data}') === -1
      ? template + encoded
      : template.split('${data}').join(encoded);
    return url;
  },
  openWith: function () {
    if (!this.hasOpenWithTemplate()) {
      this.editOpenWithTemplate(true);
      return;
    }
    var url = this.getOpenWithUrl();
    window.open(url, '_blank');
  },
  editOpenWithTemplate: function (fromOpenWith) {
    var current = this.getOpenWithTemplate();
    var input = window.prompt(
      'Set Open With URL.\nExample: https://xx.com/?data=${data}\nIf ${data} is not included, encoded body will be appended to URL.\nLeave blank to clear this setting.',
      current
    );
    if (input == null) {
      return;
    }
    input = input.trim();
    if (!input) {
      storage.set(OPEN_WITH_KEY, '');
      message.success('Open With template cleared');
      this.forceUpdate();
      return;
    }
    storage.set(OPEN_WITH_KEY, input);
    message.success(
      fromOpenWith
        ? 'Open With template saved, click Open With again to open'
        : 'Open With template updated'
    );
    this.forceUpdate();
  },
  showMockDialog: function(e) {
    var self = this;
    var props = self.props;
    var reqData = props.reqData;
    if (reqData) {
      return events.trigger('showMockDialog', {
        type: props.reqType,
        item: reqData
      });
    }
    self.showNameInput(e);
  },
  showNameInput: function (e) {
    var self = this;
    self.state.showDownloadInput = /w-download/.test(e.target.className);
    self.state.showNameInput = true;
    self.forceUpdate(function () {
      var nameInput = findDOMNode(self.refs.nameInput);
      var defaultName = !nameInput.value && self.props.defaultName;
      if (defaultName) {
        nameInput.value = defaultName;
      }
      nameInput.select();
      nameInput.focus();
    });
  },
  download: function () {
    var target = findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    target.value = '';
    var base64 = this.props.base64;
    findDOMNode(this.refs.filename).value = name;
    findDOMNode(this.refs.type).value = base64 ? 'base64' : '';
    findDOMNode(this.refs.headers).value = this.props.headers || '';
    findDOMNode(this.refs.content).value =
      base64 != null ? base64 : this.props.value || '';
    findDOMNode(this.refs.downloadForm).submit();
    this.hideNameInput();
  },
  submit: function (e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var modal = dataCenter.valuesModal;
    if (!modal) {
      return;
    }
    var target = findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    var self = this;
    if (self.state.showDownloadInput) {
      self.download();
      return;
    }
    if (!name) {
      message.error('The key is required');
      return;
    }

    if (/\s/.test(name)) {
      message.error('Spaces are not allowed in the key');
      return;
    }
    var handleSubmit = function (sure) {
      if (!sure) {
        return;
      }
      var value = (self.props.value || '').replace(/\r\n|\r/g, '\n');
      dataCenter.values.add({ name: name, value: value }, function (data, xhr) {
        if (data && data.ec === 0) {
          modal.add(name, value);
          target.value = '';
          target.blur();
        } else {
          util.showSystemError(xhr);
        }
      });
    };
    if (!modal.exists(name)) {
      return handleSubmit(true);
    }
    win.confirm(
      'The key \'' + name + '\' is already in use. Overwrite?',
      handleSubmit
    );
  },
  hideNameInput: function () {
    this.state.showNameInput = false;
    this.forceUpdate(function () {
      var nameInput = findDOMNode(this.refs.nameInput);
      var defaultName = this.props.defaultName;
      if (defaultName === nameInput.value) {
        nameInput.value = '';
      }
    });
  },
  render: function () {
    var props = this.props;
    var value = props.value || '';
    var exceed = value.length - MAX_LENGTH;
    if (exceed > 512) {
      value = value.substring(0, MAX_LENGTH) +
        '...\r\n\r\n(' +
        exceed +
        ' characters remaining (click View All in top-right corner)\r\n';
    }
    var isHexView = props.isHexView;
    this.state.value = value;
    return (
      <div
        className={
          'fill v-box w-textarea' +
          (props.hide ? ' hide' : '')
        }
      >
        <Tips data={props.tips} />
        <div className={'w-textarea-bar' + (value ? '' : ' hide')}>
          {props.reqType === 'reqRaw' ? <a onClick={props.onEdit}>
            <Icon name="send" />
            Edit
          </a> : undefined}
          <CopyBtn value={props.value} />
          {isHexView ? (
            <CopyBtn name="AsHex" value={util.getHexText(props.value)} />
          ) : undefined}
          <a
            onDoubleClick={this.download}
            onClick={this.showNameInput}
            draggable="false"
          >
            Download
          </a>
          <a style={{display: dataCenter.hideMockMenu ? 'none' : null}} className="w-add" onClick={this.showMockDialog} draggable="false">
            { props.reqData ? 'Mock' : '+Key' }
          </a>
          <a onClick={this.edit} draggable="false">
            ViewAll
          </a>
          <a
            onClick={this.openWith}
            draggable="false"
            title={
              this.getOpenWithTemplate() ||
              'Open With template is not set, click to configure'
            }
          >
            Open With
          </a>
          {this.hasOpenWithTemplate() ? (
            <a
              className="w-open-with-settings"
              onClick={this.editOpenWithTemplate}
              draggable="false"
              title="Edit Open With template"
            >
              <Icon name="cog" />
            </a>
          ) : null}
          <div
            onMouseDown={this.preventBlur}
            style={{ display: this.state.showNameInput ? 'block' : 'none' }}
            className="w-shadow w-textarea-input"
          >
            <input
              ref="nameInput"
              onKeyDown={this.submit}
              onBlur={this.hideNameInput}
              type="text"
              maxLength="64"
              placeholder={
                this.state.showDownloadInput
                  ? 'Enter filename'
                  : 'Enter key name'
              }
            />
            <button
              type="button"
              onClick={this.submit}
              className="btn btn-primary"
            >
              {this.state.showDownloadInput ? 'OK' : '+Key'}
            </button>
          </div>
        </div>
        <TextView className={props.className || ''} value={value} />
        <form
          ref="downloadForm"
          action="cgi-bin/download"
          style={{ display: 'none' }}
          method="post"
          target="downloadTargetFrame"
        >
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
