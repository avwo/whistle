require('../css/import-dialog.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var EditorDialog = require('./editor-dialog');
var parseCurl = require('./parse-curl');
var Icon = require('./icon');
var ModalHeader = require('./modal-header');
var DismissBtn = require('./dismiss-btn');
var UploadForm = require('./upload-form');
var showError = require('./message').error;

var trigger = util.trigger;

function getAccept(name) {
  if (name === 'network') {
    return '.txt,.json,.saz,.har';
  }
  if (name === 'console' || name === 'server') {
    return '.log';
  }
  if (name === 'composer') {
    return '.txt,.json,.har';
  }
  return '.txt,.json';
}

function parseJson(text) {
  if (text[0] !== '{' && text[0] !== '[') {
    return;
  }
  try {
    return JSON.parse(text);
  } catch(e) {}
}

var ImportDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (name) {
    var self = this;
    self.refs.dialog.show();
    setTimeout(function () {
      var input = findDOMNode(self.refs.input);
      input.focus();
      input.select();
    }, 500);
    name = name || 'network';
    self.setState({
      name: name,
      accept: getAccept(name),
      importCURL: name === 'composer',
      title: util.getDialogTitle(name)
    });
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  showService: function () {
    util.showService(this.state.name + '/history');
  },
  importRemoteUrl: function (e) {
    if (util.checkSubmit(e)) {
      return;
    }
    var self = this;
    var input = findDOMNode(self.refs.input);
    var url = input.value.trim();
    if (!url) {
      showError('The url or file path is required');
      input.value = '';
      input.focus();
      return;
    }
    dataCenter.getRemoteData(url, function (_, data) {
      if (data) {
        self.hide();
        trigger(self.state.name + 'ImportData', [data]);
      }
    });
  },
  handleFile: function(file) {
    if (file) {
      this.hide();
      trigger(this.state.name + 'ImportFile', [file]);
    }
  },
  componentDidMount: function () {
    var self = this;
    util.on('importFile', function (_, file) {
      self.handleFile(file);
    });
  },
  shouldComponentUpdate: util.scuDialog,
  uploadFile: function() {
    var self = this;
    var fileInput = self.refs.uploadForm.getInput();
    self.handleFile(fileInput.files[0]);
    fileInput.value = '';
  },
  selectFile: function() {
    this.refs.uploadForm.getInput().click();
  },
  importCURL: function(text) {
    text = text.trim();
    if (!text) {
      showError('The text is required');
      return false;
    }
    try {
      var result = parseJson(text) || parseCurl(text);
      if (!result || !result.url) {
        showError('Not cURL text');
        return false;
      }
      result.isHexText = false;
      result.headers = util.objectToString(result.headers);
      trigger('setComposerData', [result]);
    } catch (e) {
      showError(e.message);
      return false;
    }

  },
  showImportCURL: function() {
    this.refs.editorDialog.show();
  },
  render: function () {
    var self = this;
    var state = self.state;

    return (
      <Dialog ref="dialog" wstyle="w-ie-dialog w-import-dialog">
        <ModalHeader>
          {state.title}
        </ModalHeader>
        <div className="modal-body">
          <input
            ref="input"
            maxLength="2048"
            onKeyDown={self.importRemoteUrl}
            placeholder="Enter request URL or file path"
          />
        </div>
        <div className="modal-footer">
          <DismissBtn />
          {
            state.importCURL ? <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
            onClick={self.showImportCURL}
          >
            <Icon name="file" />
            Import cURL
          </button> : null
          }
          {dataCenter.whistleId ? <button
            type="button"
            className="btn btn-warning"
            data-dismiss="modal"
            onClick={self.showService}
          >
            <Icon name="cloud" />
            Import From Service
          </button> : null}
          <button
            type="button"
            className="btn btn-info"
            onClick={self.selectFile}
          >
            <Icon name="folder-open" />
            Upload
          </button>
          <button
            type="button"
            className="btn btn-primary w-fmt-btn"
            onMouseDown={util.preventBlur}
            onClick={self.importRemoteUrl}
          >
            Import
          </button>
        </div>
        <UploadForm ref="uploadForm" name="fileInput" onChange={self.uploadFile} accept={state.accept} />
        <EditorDialog ref="editorDialog" title="Import cURL" hideFormat="1" placeholder="Enter cURL text"
          textEditor onConfirm={self.importCURL} />
      </Dialog>
    );
  }
});

module.exports = ImportDialog;
