var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var Dialog = require('./dialog');
var events = require('./events');
var dataCenter = require('./data-center');
var util = require('./util');
var message = require('./message');
var win = require('./win');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');

var showSysErr = util.showSysErr;
var MAX_LEN = 1024 * 1024 * 11;
var fakeIframe = 'javascript:"<style>html,body{padding:0;margin:0}</style><textarea></textarea>"';
var iframeStyle = {
  padding: 0,
  border: 'none',
  width: 980,
  height: 550,
  margin: 0,
  verticalAlign: 'top'
};

function getTempFile(tempFile, cb) {
  if (tempFile === 'blank') {
    return cb('');
  }
  dataCenter.getTempFile({
    filename: tempFile
  }, function (result, xhr) {
    if (!result) {
      return showSysErr(xhr);
    }
    if (result.em) {
      message.error(result.em);
      if (result.ec) {
        return;
      }
    }
    cb(result.value || '');
    util.showForbidden(result);
  });
}

function getText(item, key) {
  var req = item.req;
  var res = item.res || '';
  switch(key) {
  case 'blank':
    return '';
  case 'url':
    return item.url;
  case 'method':
    return req.method;
  case 'reqHeaders':
    return JSON.stringify(req.headers, null, '  ');
  case 'resHeaders':
    return item.res.headers ? JSON.stringify(res.headers, null, '  ') : '';
  case 'reqBody':
    return util.getBody(req, true);
  case 'resBody':
    return util.getBody(res);
  case 'reqJson':
    return util.getJsonStr(req, true, decodeURIComponent);
  case 'resJson':
    return util.getJsonStr(res);
  case 'rawReq':
    return util.getRawReq(item);
  case 'rawRes':
    return util.getRawRes(item);
  case 'statusCode':
    return res.statusCode;
  }
  return '';
}

var EditorDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (data) {
    var self = this;
    self._hideDialog = false;
    self.setState(data);
    var textarea = self._textarea;
    if (self.props.textEditor && textarea) {
      var value = data && data.value;
      if (typeof value === 'string') {
        textarea.value = value;
      }
      setTimeout(function() {
        textarea.focus();
      }, 600);
    }
    self.refs.editorDialog.show();
  },
  hide: function () {
    this.refs.editorDialog.hide();
    this._hideDialog = true;
  },
  onChange: function (e) {
    this.setState({ value: e.target.value });
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  componentDidMount: function() {
    var self = this;
    if (!self.props.textEditor) {
      return;
    }
    events.on('uploadTempFile', function(_, file) {
      self.readFile(file);
    });
    var iframe = findDOMNode(self.refs.iframe);
    var initTextArea = function() {
      var textarea = iframe.contentWindow.document.querySelector('textarea');
      var style = textarea && textarea.style;
      self._textarea = textarea;
      if (style) {
        style.resize = 'none';
        style.width = iframeStyle.width + 'px';
        style.height = iframeStyle.height + 'px';
        style.padding = '5px';
        style.border = '1px solid var(--c-border, #ccc)';
        style.borderRadius = '3px';
        textarea.maxLength = MAX_LEN;
        textarea.placeholder = self.props.placeholder || 'Enter text';
        textarea.addEventListener('input', function() {
          self.setState({ hasChanged: true });
        });
        textarea.onkeydown = function(e) {
          if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) {
            e.preventDefault();
            self.props.textEditor && self.onSave();
          }
          util.handleFormat(e, self.formatValue);
          util.handleTab(e);
        };
      }
    };
    iframe.onload = initTextArea;
    initTextArea();
    this.props.standalone && events.on('showEditorDialog', function(_, data, elem) {
      self.onClose();
      self.state.textSrc = '';
      self.state.callback = null;
      var text = data && (data.text || data.value) || '';
      if (!data || text || data.session !== undefined) {
        var filename = data && data.filename;
        self._session = data && data.session;
        self.state.callback = data && data.callback;
        self.show({
          hasChanged: !!(text || self._textarea.value.trim()),
          value: text,
          title: 'Create Temp File',
          isTempFile: true
        });
        filename && getTempFile(filename, function(value) {
          self._textarea.value = value;
        });
      } else if (data.name) {
        var item = dataCenter.valuesModal.get(data.name);
        var value = item && item.value || '';
        self._keyName = data.name;
        self.show({
          value: value,
          title: item ? 'Update value for key \'' + data.name + '\' in Values' : 'Create a new key \'' + data.name + '\' to Values',
          isTempFile: false
        });
      } else {
        var rulesItem = elem && dataCenter.rulesModal.get(data.ruleName);
        if (rulesItem) {
          var tempFile = data.tempFile;
          self._tempFile = tempFile;
          self._fileElem = elem;
          self._rulesItem = rulesItem;
          tempFile = tempFile || 'blank';
          var isBlank = tempFile === 'blank' || /[\\/]/.test(tempFile);
          getTempFile(tempFile, function(value) {
            self.show({
              value: value,
              title: (isBlank ? 'Create' : 'Edit') + ' Temp File' + (isBlank ? '' : ' (temp/' + tempFile + ')'),
              isTempFile: true
            });
          });
        }
      }
    });
  },
  getValue: function() {
    var self = this;
    var value = self._textarea ? self._textarea.value : self.state.value;
    return value || '';
  },
  onConfirm: function() {
    var self = this;
    var result = self.props.onConfirm(self.getValue());
    if (result !== false) {
      self.hide();
    }
  },
  onSave: function(base64) {
    var self = this;
    var isBase64 = typeof base64 === 'string';
    var value = isBase64 ? base64 : self.getValue();
    if (!isBase64 && !self.state.isTempFile) {
      dataCenter.values.add({
        name: self._keyName,
        value: value
      }, function (data, xhr) {
        if (data && data.ec === 0) {
          events.trigger('addNewValuesFile', {
            filename: self._keyName,
            data: value,
            update: true
          });
          self.hide();
        } else {
          showSysErr(xhr);
        }
      });
      return;
    }
    var params = {  clientId: dataCenter.getPageId() };
    params[isBase64 ? 'base64' : 'value'] = value;
    dataCenter.createTempFile(JSON.stringify(params), function (result, xhr) {
      if (!result || result.ec !== 0) {
        return showSysErr(xhr);
      }
      var elem = self._fileElem;
      if (!elem) {
        if (self.state.callback) {
          self.state.callback(result.filepath);
        } else {
          win.alert('Temp file created:\n' + result.filepath, result.filepath, 'Copy Temp File Path', 'alert-info');
        }
        return self.hide();
      }
      var line = elem.closest('.CodeMirror-line')[0];
      var list = elem.closest('.CodeMirror-code').find('.CodeMirror-line');
      var index = 0;
      for (var i = 0, len = list.length; i < len; i++) {
        if (list[i] === line) {
          index = i;
          break;
        }
      }
      var text = elem.text();
      var newText;
      var tempFile = self._tempFile;
      if (tempFile) {
        var suffix = tempFile.lastIndexOf('.');
        if (suffix === -1) {
          newText = text.replace('temp/' + tempFile, result.filepath);
        } else {
          newText = text.replace(tempFile.substring(0, suffix), result.filepath);
          if (newText.indexOf('://') === -1) {
            newText = 'file://' + newText;
          }
        }
      } else {
        newText = text.replace(/temp(\.[\w-]+)?$/, result.filepath + '$1');
      }
      var rulesText = self._rulesItem.value.split(/\r\n|\r|\n/).map(function(l, i) {
        if (i === index) {
          l = l.trim().split(/\s+/).map(function(part) {
            return part === text ? newText : part;
          }).join(' ');
        }
        return l;
      }).join('\n');
      var filename = self._rulesItem.name;
      dataCenter.rules.add(
        {
          name: filename,
          value: rulesText,
          selected: self._rulesItem.selected ? '1' : ''
        },
        function (result, xhr) {
          if (result && result.ec === 0) {
            events.trigger('addNewRulesFile', {
              filename: filename,
              data: rulesText,
              update: true
            });
            self.hide();
          } else {
            showSysErr(xhr);
          }
        }
      );
    });
  },
  formatValue: function() {
    var textarea = this._textarea;
    try {
      var val = textarea.value.trim();
      if (val[0] === '{' || val[0] === '[') {
        var formattedVal = JSON.stringify(JSON.parse(val), null, '  ');
        if (textarea.value !== formattedVal) {
          textarea.value = formattedVal;
        }
      }
    } catch (e) {
      message.error(e.message);
    }
  },
  clearValue: function() {
    this._textarea.value = '';
  },
  onUpload: function () {
    if (!this.reading) {
      findDOMNode(this.refs.readLocalFile).click();
    }
  },
  readFile: function(file) {
    var self = this;
    self.reading = true;
    util.readFile(file, function (data) {
      self.reading = false;
      self.onSave(util.bytesToBase64(data));
    });
  },
  readLocalFile: function () {
    var self = this;
    var form = new FormData(findDOMNode(self.refs.readLocalFileForm));
    var file = form.get('localFile');
    if (file.size > MAX_LEN) {
      return win.alert('Total file size must not exceed 10MB');
    }
    self.readFile(file);
    findDOMNode(self.refs.readLocalFile).value = '';
  },
  onTextChange: function(e) {
    var self = this;
    var textSrc = e.target.value;
    var updateValue = function() {
      self.setState({ textSrc: textSrc, hasChanged: false }, self.updateRules);
      if (textSrc[0] === '{') {
        var valuesModal = dataCenter.valuesModal;
        var item = valuesModal.getItem(textSrc.slice(1, -1));
        self._textarea.value = item && item.value || '';
      } else if (self._session) {
        self._textarea.value = getText(self._session, textSrc);
      }
    };
    if (!self.state.hasChanged || !self._textarea.value.trim()) {
      return updateValue();
    }
    win.confirm('Unsaved changes will be lost. Continue?', function(sure) {
      sure && updateValue();
    });
  },
  onClose: function () {
    var self = this;
    self._keyName = null;
    self._tempFile = null;
    self._fileElem = null;
    self._rulesItem = null;
    self._session = null;
  },
  renderHeader: function() {
    var self = this;
    var state = self.state;
    var props = self.props;
    var title = props.title || state.title || '';
    var textSrc = state.textSrc || '';
    var list = title[0] !== 'E' && dataCenter.getValuesModal().getNotEmptyList();
    var session = self._session;

    return (
      <div className="modal-header">
        <h4>
          {title || 'Edit Copied Text'}
          {session || list.length ? <span className="ml-10">
            (Import from:
            <select className="form-control w-session-text-select" value={textSrc} onChange={self.onTextChange}>
              <option value="">Blank</option>
              {session ? [
                <optgroup label="Request Session">
                  <option value="url">URL</option>
                  <option value="method">Method</option>
                  <option value="statusCode">Status Code</option>
                  <option value="reqHeaders">Request Headers</option>
                  <option value="resHeaders">Response Headers</option>
                  <option value="reqBody">Request Body</option>
                  <option value="resBody">Response Body</option>
                  <option value="reqJson">Request JSON</option>
                  <option value="resJson">Response JSON</option>
                  <option value="rawReq">Raw Request</option>
                  <option value="rawRes">Raw Response</option>
                </optgroup>
              ] : null}
              { list.length ? <optgroup label="Values">{
                  list.map(function(key) {
                    key = '{' + key + '}';
                    return <option value={key}>{key}</option>;
                  })
                }</optgroup> : null
              }
            </select> )
          </span> : null}
        </h4>
        <CloseBtn />
      </div>
    );
  },
  render: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    var value = state.value;
    var textEditor = self.props.textEditor;
    var showUpload = textEditor && !props.onConfirm;

    return (
      <Dialog ref="editorDialog" wstyle={'w-editor-dialog' + (textEditor ? ' w-big-editor-dialog' : '') +
      (showUpload ? ' w-show-upload-temp-file' : '')} onClose={self.onClose}>
        {self.renderHeader()}
        <div className="modal-body">
          {
            textEditor ? <div className="w-mock-action">
              {props.hideFormat ? null : <a onClick={self.formatValue}>Format</a>}
              <a onClick={self.clearValue}>Clear</a>
            </div> : null
          }
          {
            textEditor ? <div className="w-fake-iframe w-fix-drag"><iframe ref="iframe" data-type="fake"
              src={fakeIframe} onLoad={dataCenter.handleIframeLoad} style={iframeStyle}/></div> :
              <textarea onChange={self.onChange} value={value} />
          }
        </div>
        {textEditor ? <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          {props.onConfirm ? null : <button
            type="button"
            className="btn btn-info"
            onClick={self.onUpload}
          >
            <Icon name="folder-open" />
            Upload
          </button>}
          <button
            type="button"
            className="btn btn-primary"
            onClick={props.onConfirm ? self.onConfirm : self.onSave}
          >
            {props.onConfirm ? 'Confirm' : 'Save'}
          </button>
        </div> : <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Close
          </button>
          <button
            type="button"
            data-dismiss="modal"
            className="btn btn-primary w-copy-text-with-tips"
            data-clipboard-text={state.value}
            disabled={!value}
          >
            Copy
          </button>
        </div>}
        <form
          ref="readLocalFileForm"
          encType="multipart/form-data"
          style={util.HIDE_STYLE}
        >
          <input
            ref="readLocalFile"
            onChange={self.readLocalFile}
            type="file"
            name="localFile"
          />
        </form>
      </Dialog>
    );
  }
});

module.exports = EditorDialog;
