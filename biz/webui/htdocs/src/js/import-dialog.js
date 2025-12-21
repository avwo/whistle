require('../css/import-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var events = require('./events');
var message = require('./message');
var EditorDialog = require('./editor-dialog');
var parseCurl = require('./parse-curl');

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
    self.refs.importDialog.show();
    setTimeout(function () {
      var input = ReactDOM.findDOMNode(self.refs.input);
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
    this.refs.importDialog.hide();
  },
  showService: function () {
    util.showService(this.state.name + '/history');
  },
  importRemoteUrl: function (e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    var self = this;
    var input = ReactDOM.findDOMNode(self.refs.input);
    var url = input.value.trim();
    if (!url) {
      message.error('The url or file path is required');
      input.value = '';
      input.focus();
      return;
    }
    dataCenter.getRemoteData(url, function (_, data) {
      if (data) {
        self.hide();
        events.trigger(self.state.name + 'ImportData', [data]);
      }
    });
  },
  handleFile: function(file) {
    if (file) {
      this.hide();
      events.trigger(this.state.name + 'ImportFile', [file]);
    }
  },
  componentDidMount: function () {
    var self = this;
    events.on('importFile', function (_, file) {
      self.handleFile(file);
    });
  },
  shouldComponentUpdate: function () {
    return this.refs.importDialog.isVisible();
  },
  uploadFile: function() {
    var fileInput = ReactDOM.findDOMNode(this.refs.importFile);
    this.handleFile(fileInput.files[0]);
    ReactDOM.findDOMNode(this.refs.importFile).value = '';
  },
  selectFile: function() {
    ReactDOM.findDOMNode(this.refs.importFile).click();
  },
  importCURL: function(text) {
    text = text.trim();
    if (!text) {
      message.error('The text is required');
      return false;
    }
    try {
      var result = parseJson(text) || parseCurl(text);
      if (!result || !result.url) {
        message.error('Not cURL text');
        return false;
      }
      result.isHexText = false;
      result.headers = util.objectToString(result.headers);
      events.trigger('setComposerData', [result]);
    } catch (e) {
      message.error(e.message);
      return false;
    }

  },
  showImportCURL: function() {
    this.refs.editorDialog.show();
  },
  render: function () {
    var state = this.state;

    return (
      <Dialog ref="importDialog" wstyle="w-ie-dialog w-import-dialog">
        <div className="modal-header">
          <h4>{state.title}</h4>
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <input
            ref="input"
            maxLength="2048"
            onKeyDown={this.importRemoteUrl}
            placeholder="Enter url or file path"
          />
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          {
            state.importCURL ? <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
            onClick={this.showImportCURL}
          >
            <span className="glyphicon glyphicon-file" />
            Import cURL
          </button> : null
          }
          {dataCenter.whistleId ? <button
            type="button"
            className="btn btn-warning"
            data-dismiss="modal"
            onClick={this.showService}
          >
            <span className="glyphicon glyphicon-cloud" />
            Import From Service
          </button> : null}
          <button
            type="button"
            className="btn btn-info"
            onClick={this.selectFile}
          >
            <span className="glyphicon glyphicon-folder-open" />
            Upload
          </button>
          <button
            type="button"
            className="btn btn-primary w-fmt-btn"
            onMouseDown={util.preventBlur}
            onClick={this.importRemoteUrl}
          >
            Import
          </button>
        </div>
        <form
          ref="importFileForm"
          encType="multipart/form-data"
          style={{ display: 'none' }}
        >
          <input
            ref="importFile"
            onChange={this.uploadFile}
            name="fileInput"
            type="file"
            accept={state.accept}
          />
        </form>
        <EditorDialog ref="editorDialog" title="Import cURL" hideFormat="1" placeholder="Enter cURL text"
          textEditor onConfirm={this.importCURL} />
      </Dialog>
    );
  }
});

module.exports = ImportDialog;
