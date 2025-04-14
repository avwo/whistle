require('./base-css.js');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var events = require('./events');
var dataCenter = require('./data-center');
var util = require('./util');
var message = require('./message');
var win = require('./win');

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
      return util.showSystemError(xhr);
    }
    if (result.em) {
      message.error(result.em);
      if (result.ec) {
        return;
      }
    }
    cb(result.value || '');
  });
}

var EditorDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (data) {
    this._hideDialog = false;
    this.setState(data);
    var textarea = this._textarea;
    if (this.props.textEditor && textarea) {
      textarea.value = (data && data.value) || '';
      setTimeout(function() {
        textarea.focus();
      }, 600);
    }
    this.refs.editorDialog.show();
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
    var iframe = ReactDOM.findDOMNode(self.refs.iframe);
    var initTextArea = function() {
      var textarea = iframe.contentWindow.document.querySelector('textarea');
      var style = textarea && textarea.style;
      self._textarea = textarea;
      if (style) {
        style.resize = 'none';
        style.width = iframeStyle.width + 'px';
        style.height = iframeStyle.height + 'px';
        style.padding = '5px';
        style.border = '1px solid #ccc';
        style.borderRadius = '3px';
        textarea.maxLength = MAX_LEN;
        textarea.placeholder = self.props.placeholder || 'Input the text';
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
      if (data.name) {
        var item = dataCenter.valuesModal.get(data.name);
        var value = item && item.value || '';
        self._keyName = data.name;
        self.show({
          value: value,
          title: (item ? 'Modify the key value' : 'Create a new key') + ' in Values (key: ' + data.name + ')',
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
              title: (isBlank ? 'Create a' : 'Modify the') + ' temp file' + (isBlank ? '' : ' (temp/' + tempFile + ')'),
              isTempFile: true
            });
          });
        }
      }
    });
  },
  getValue: function() {
    var value = this._textarea ? this._textarea.value : this.state.value;
    return value || '';
  },
  onConfirm: function() {
    var result = this.props.onConfirm(this.getValue());
    if (result !== false) {
      this.hide();
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
          util.showSystemError(xhr);
        }
      });
      return;
    }
    var params = {  clientId: dataCenter.getPageId() };
    params[isBase64 ? 'base64' : 'value'] = value;
    dataCenter.createTempFile(JSON.stringify(params), function (result, xhr) {
      if (!result || result.ec !== 0) {
        return util.showSystemError(xhr);
      }
      var elem = self._fileElem;
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
            util.showSystemError(xhr);
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
      ReactDOM.findDOMNode(this.refs.readLocalFile).click();
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
    var form = new FormData(ReactDOM.findDOMNode(this.refs.readLocalFileForm));
    var file = form.get('localFile');
    if (file.size > MAX_LEN) {
      return win.alert('The size of all files cannot exceed 10m.');
    }
    this.readFile(file);
    ReactDOM.findDOMNode(this.refs.readLocalFile).value = '';
  },
  render: function () {
    var state = this.state;
    var props = this.props;
    var value = state.value;
    var title = props.title || state.title;
    var textEditor = this.props.textEditor;
    var showUpload = textEditor && !props.onConfirm;

    return (
      <Dialog ref="editorDialog" wstyle={'w-editor-dialog' + (textEditor ? ' w-big-editor-dialog' : '') +
      (showUpload ? ' w-show-upload-temp-file' : '')}>
        <div className="modal-header">
          {title || 'Edit the copied text'}
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          {
            textEditor ? <div className="w-mock-inline-action">
              {props.hideFormat ? null : <a onClick={this.formatValue}>Format</a>}
              <a onClick={this.clearValue}>Clear</a>
            </div> : null
          }
          {
            textEditor ? <iframe ref="iframe" src={fakeIframe} style={iframeStyle}/> :
              <textarea onChange={this.onChange} value={value} />
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
            className="btn btn-warning"
            onClick={this.onUpload}
          >
            Upload
          </button>}
          <button
            type="button"
            className="btn btn-primary"
            onClick={props.onConfirm ? this.onConfirm : this.onSave}
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
          style={{ display: 'none' }}
        >
          <input
            ref="readLocalFile"
            onChange={this.readLocalFile}
            type="file"
            name="localFile"
          />
        </form>
      </Dialog>
    );
  }
});

module.exports = EditorDialog;
