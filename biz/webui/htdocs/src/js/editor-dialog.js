var React = require('react');
var $ = require('jquery');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var win = require('./win');
var Icon = require('./icon');
var ModalFooter = require('./modal-footer');
var ModalHeader = require('./modal-header');
var UploadForm = require('./upload-form');
var Select = require('./custom-select');
var showError = require('./message').error;

var showSysErr = util.showSysErr;
var isStr = util.isStr;
var trigger = util.trigger;
var addEvent = util.on;
var stringify = util.stringify;
var getValuesModal = dataCenter.getValuesModal;
var MAX_LEN = 1024 * 1024 * 11;
var fakeIframe = 'javascript:"<style>html,body{padding:0;margin:0}</style><textarea></textarea>"';
var INSERT_BTN = 'Populate from Session';
var iframeStyle = {
  padding: 0,
  border: 'none',
  width: 980,
  height: 550,
  margin: 0,
  verticalAlign: 'top'
};

var SESSION_OPTIONS = ['URL', 'Method', 'Status Code', 'Request Headers', 'Response Headers',
  'Request Body', 'Response Body', 'Request JSON', 'Response JSON', 'Raw Request', 'Raw Response'];

function getTitle(tempFile) {
  return tempFile ? 'Replace File (' + tempFile + ')' : 'Create File';
}

function getKey(tempFile) {
  if (tempFile && tempFile[0] === '{') {
    var last = tempFile.length - 1;
    if (tempFile[last] === '}') {
      return tempFile.substring(1, last);
    }
  }
}

function getKeyItem(key) {
  return key && getValuesModal().get(key);
}

function getKeyValue(key) {
  var item = getKeyItem(key);
  return (item && item.value) || '';
}

function getTempFile(tempFile, cb) {
  if (!tempFile ||tempFile === 'blank') {
    return cb('');
  }
  var key = getKey(tempFile);
  if (key) {
    return cb(getKeyValue(key));
  }
  dataCenter.getTempFile({
    filename: tempFile
  }, function (result, xhr) {
    if (!result) {
      return showSysErr(xhr);
    }
    if (result.em) {
      showError(result.em);
      if (result.ec) {
        return;
      }
    }
    cb(result.value || '');
  });
}

function getText(item, key) {
  var req = item.req;
  var res = item.res || '';
  switch(key) {
  case SESSION_OPTIONS[0]:
    return item.url;
  case SESSION_OPTIONS[1]:
    return req.method;
  case SESSION_OPTIONS[2]:
    return res.statusCode;
  case SESSION_OPTIONS[3]:
    return stringify(req.headers);
  case SESSION_OPTIONS[4]:
    return res.headers ? stringify(res.headers) : '';
  case SESSION_OPTIONS[5]:
    return util.getBody(req, true);
  case SESSION_OPTIONS[6]:
    return util.getBody(res);
  case SESSION_OPTIONS[7]:
    return util.getJsonStr(req, true, decodeURIComponent);
  case SESSION_OPTIONS[8]:
    return util.getJsonStr(res);
  case SESSION_OPTIONS[9]:
    return util.getRawReq(item);
  case SESSION_OPTIONS[10]:
    return util.getRawRes(item);
  }
  return '';
}

var EditorDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (data) {
    var self = this;
    var textarea = self._textarea;
    self.refs.dialog.show();
    data = data || {};
    data.isKey = !!data.isKey;
    self.setState(data);
    if (self.props.textEditor && textarea) {
      var value = data.value;
      if (isStr(value)) {
        textarea.value = value;
      }
      setTimeout(function() {
        textarea.focus();
      }, 600);
    }
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  onChange: function (e) {
    this.setState({ value: e.target.value });
  },
  shouldComponentUpdate: util.scuDlg,
  componentDidMount: function() {
    var self = this;
    var props = self.props;
    if (!props.textEditor) {
      return;
    }
    var iframe = self.refs.iframe;
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
        textarea.onkeydown = function(e) {
          if (util.isCtrl(e) && e.keyCode === 83) {
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
    if (props.standalone) {
      addEvent('uploadTempFile', function(_, file) {
        self.readFile(file);
      });
      addEvent('showEditorDialog', function(_, data, elem) {
        self.onClose();
        var state = self.state;
        var name;
        state.callback = null;
        var text = data && (data.text || data.value) || '';
        if (!data || text || data.session !== undefined) {
          var filename = data && data.filename;
          var textarea = self._textarea;
          var isKey = data && data.isKey;
          self._session = data && data.session;
          self._filename = filename;
          state.callback = data && data.callback;
          var selectedKey = isKey ? (getKey(filename) || getValuesModal().getKeys()[0]) : null;
          self.show({
            isKey: isKey,
            selectedKey: selectedKey,
            value: isKey ? getKeyValue(selectedKey) : text,
            title: getTitle(filename),
            isTempFile: !isKey
          });
          filename && getTempFile(filename, function(value) {
            textarea.value = value;
          });
        } else if (name = data.name) {
          var item = getKeyItem(name);
          self._keyName = name;
          self._modifyValue = !!item;
          self.show({
            value: getKeyValue(name),
            title: item ? 'Modify value for key \'' + name + '\' in Values' : 'Create a new key \'' + name + '\' to Values',
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
            tempFile = (tempFile === 'blank' || /[\\/]/.test(tempFile)) ? null : 'temp/' + tempFile;
            getTempFile(tempFile, function(value) {
              self.show({
                value: value,
                title: getTitle(tempFile),
                isTempFile: true
              });
            });
          }
        }
      });
    }
  },
  getValue: function() {
    var self = this;
    var textarea = self._textarea;
    var value = textarea ? textarea.value : self.state.value;
    return value || '';
  },
  onConfirm: function() {
    var self = this;
    var result = self.props.onConfirm(self.getValue());
    if (result !== false) {
      self.hide();
    }
  },
  addKey: function(name, value, cb) {
    var graceful = value == null;
    dataCenter.values.add({
      name: name,
      value: value || '',
      graceful: graceful
    }, function (data, xhr) {
      if (data && data.ec === 0) {
        trigger('addNewValuesFile', {
          filename: name,
          data: graceful ? getKeyValue(name) : value,
          update: true
        });
        cb && cb();
      } else {
        showSysErr(xhr);
      }
    });
  },
  onSave: function(base64) {
    var self = this;
    var state = self.state;
    var isBase64 = isStr(base64);
    var value = isBase64 ? base64 : self.getValue();
    if (!isBase64 && !state.isTempFile) {
      var keyName = self._keyName || state.selectedKey;
      if (!keyName) {
        self.refs.select.shake();
        return showError('The key is required');
      }
      return self.addKey(keyName, value, function() {
        self.hide();
        var callback = state.callback;
        if (callback) {
          callback('{' + keyName + '}');
        }
      });
    }
    var params = {  clientId: dataCenter.getPageId() };
    params[isBase64 ? 'base64' : 'value'] = value;
    dataCenter.createTempFile(util.strfy(params), function (result, xhr) {
      if (!result || result.ec !== 0) {
        return showSysErr(xhr);
      }
      var elem = self._fileElem;
      if (!elem) {
        var callback = state.callback;
        if (callback) {
          callback(result.filepath);
        } else {
          win.alert('File created:\n' + result.filepath, result.filepath, 'Copy File Path', 'alert-info');
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
      var rulesItem = self._rulesItem;
      var rulesText = rulesItem.value.split(/\r\n|\r|\n/).map(function(l, i) {
        if (i === index) {
          l = l.trim().split(/\s+/).map(function(part) {
            return part === text ? newText : part;
          }).join(' ');
        }
        return l;
      }).join('\n');
      var filename = rulesItem.name;
      dataCenter.rules.add(
        {
          name: filename,
          value: rulesText,
          selected: rulesItem.selected ? '1' : ''
        },
        function (result, xhr) {
          if (result && result.ec === 0) {
            trigger('addNewRulesFile', {
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
        var formattedVal = stringify(JSON.parse(val));
        if (textarea.value !== formattedVal) {
          textarea.value = formattedVal;
        }
      }
    } catch (e) {
      showError(e.message);
    }
  },
  clearValue: function() {
    this._textarea.value = '';
  },
  onUpload: function () {
    if (!this.reading) {
      this.refs.uploadForm.getInput().click();
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
    var uploadForm = self.refs.uploadForm;
    var form = new FormData(uploadForm.getForm());
    var file = form.get('localFile');
    if (file.size > MAX_LEN) {
      return win.alert(util.EXCEED_TIPS + ' 10MB');
    }
    self.readFile(file);
    uploadForm.getInput().value = '';
  },
  populate: function(e) {
    var self = this;
    self._textarea.value = getText(self._session, $(e.target).text().trim()) || '';
  },
  onClose: function () {
    var self = this;
    self._keyName = null;
    self._modifyValue = null;
    self._tempFile = null;
    self._filename = null;
    self._fileElem = null;
    self._rulesItem = null;
    self._session = null;
  },
  showSessionOptions: function() {
    this.refs.session.show();
  },
  createKey: function(key, cb) {
    var self = this;
    self.addKey(key, null, function() {
      self.changeKey({ value: key });
      cb();
    });
  },
  changeKey: function(e) {
    var self = this;
    var key = e.value;
    var textarea = self._textarea;
    var preKey = self.state.selectedKey;
    var preVal = getKeyValue(preKey);
    var handleChange = function(flag) {
      if (flag === false) {
        return;
      }
      textarea.value = getKeyValue(key);
      self.setState({ selectedKey: key });
    };
    if (preVal && preVal !== textarea.value) {
      return win.confirm('The value for key \'' + preKey + '\' has been modified. Switch and lose changes. Continue?', handleChange);
    }
    handleChange();
  },
  renderKeys: function() {
    var self = this;
    var keys = getValuesModal().getKeys();
    var selectedKey = self.state.selectedKey;
    if (selectedKey && keys.indexOf(selectedKey) === -1) {
      keys.push(selectedKey);
    } else if (!keys.length) {
      keys.push('No keys available');
    }

    return <Select ref="select" value={selectedKey} className="w-session-text-select ml-5" placeholder="Enter new key"
      options={keys} onCreate={self.createKey} onChange={self.changeKey} />;
  },
  renderHeader: function(showUpload) {
    var self = this;
    var state = self.state;
    var props = self.props;
    var title = props.title || state.title || '';
    var session = self._session;
    var isKey = state.isKey;

    return (
      <ModalHeader>
        {isKey ? 'Select Key' : title || 'Modify Copied Text'}
        {isKey ? self.renderKeys() : null}
        {showUpload && session ? <button type="button" className="btn btn-sm btn-default ml-10" onClick={self.showSessionOptions}>
          <Icon name="import" className="mr-5" />
          {INSERT_BTN}
        </button> : null}
      </ModalHeader>
    );
  },
  render: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    var value = state.value;
    var hasConfirm = props.onConfirm;
    var textEditor = props.textEditor;
    var showUpload = textEditor && !hasConfirm;
    var keyName = self._keyName;
    var isKey = state.isKey;

    return (
      <Dialog ref="dialog" wstyle={'w-editor-dialog' + (textEditor ? ' w-big-editor-dialog' : '') +
      (showUpload ? ' w-show-upload-temp-file' : '')} onClose={self.onClose}>
        {self.renderHeader(showUpload)}
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
        {textEditor ? <ModalFooter className="modal-footer">
          {hasConfirm || keyName || isKey ? null : <button
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
            onClick={hasConfirm ? self.onConfirm : self.onSave}
          >
            {hasConfirm ? 'Confirm' : (self._fileElem || self._filename || isKey || self._modifyValue ? 'Save' : 'Create')}
          </button>
        </ModalFooter> : <ModalFooter>
          <button
            type="button"
            data-dismiss="modal"
            className="btn btn-primary w-copy-text-with-tips"
            data-clipboard-text={value}
            disabled={!value}
          >
            Copy
          </button>
        </ModalFooter>}
        <UploadForm ref="uploadForm" onChange={self.readLocalFile} />
        <Dialog ref="session" wstyle="w-plugins-mgr w-session-dialog" closable>
          <ModalHeader>
          {INSERT_BTN}
          </ModalHeader>
          <div className="modal-body">
            {
              SESSION_OPTIONS.map(function (name) {
                return (
                  <div key={name} className="btn btn-default plugin-mgr-btn" data-dismiss="modal" onClick={self.populate}>
                    {name}
                  </div>
                );
              })
            }
          </div>
        </Dialog>
      </Dialog>
    );
  }
});

module.exports = EditorDialog;
