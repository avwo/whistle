require('./base-css.js');
require('../css/files-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var util = require('./util');
var events = require('./events');
var message = require('./message');

var MAX_FILE_SIZE = 1024 * 1024 * 20;

function focus(input) {
  input.select();
  input.focus();
}

function showError(msg, input) {
  message.error(msg);
  input.select();
  input.focus();
}

var FilesDialog = React.createClass({
  show: function(data) {
    this.refs.filesDialog.show();
  },
  hide: function() {
    this.refs.filesDialog.hide();
  },
  showNameInput: function() {
    var self = this;
    var refs = self.refs;
    refs.filenameDialog.show();
    setTimeout(function() {
      var input = ReactDOM.findDOMNode(refs.filename);
      input.value = self.params.name || '';
      focus(input);
    }, 500);
  },
  componentDidMount: function() {
    var self = this;
    events.on('uploadFile', function(e, file) {
      self.submit(file);
    });
    events.on('showFilenameInput', function(e, params) {
      self.params = params;
      self.showNameInput();
    });
  },
  onConfirm: function() {
    var input = ReactDOM.findDOMNode(this.refs.filename);
    var name = input.value.trim();
    if (!name) {
      showError('The name can not be empty.', input);
      return;
    }
    if (/[\\/:*?"<>|\s]/.test(name)) {
      showError('The name can not contain \\/:*?"<>| and spaces.', input);
      return;
    }
    this.params.name = name;
    return true;
  },
  download: function(e) {
    if (!this.onConfirm()) {
      return;
    }
    var params = this.params;
    ReactDOM.findDOMNode(this.refs.name).value = params.name;
    ReactDOM.findDOMNode(this.refs.headers).value = params.headers || '';
    ReactDOM.findDOMNode(this.refs.content).value = params.base64 || '';
    ReactDOM.findDOMNode(this.refs.downloadForm).submit();
  },
  submit: function(file) {
    if (!file.size) {
      return alert('The file size can not be empty.');
    }
    if (file.size > MAX_FILE_SIZE) {
      return alert('The file size can not exceed 20m.');
    }
    var self = this;
    var params = {};
    util.readFileAsBase64(file, function(base64) {
      params.base64 = base64;
      ReactDOM.findDOMNode(self.refs.file).value = '';
      self.params = params;
      self.showNameInput();
    });
  },
  uploadFile: function() {
    var form = ReactDOM.findDOMNode(this.refs.uploadFileForm);
    this.submit(new FormData(form).get('file'));
  },
  selectFile: function() {
    ReactDOM.findDOMNode(this.refs.file).click();
  },
  render: function() {
    var title = (this.params || '').title;
    return (
      <Dialog wstyle="w-files-dialog" ref="filesDialog">
          <div className="modal-body">
            <button type="button" className="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
            <h4>
              <a className="w-help-menu" title="Click here to see help"
                href="https://avwo.github.io/whistle/webui/files.html" target="_blank">
              <span className="glyphicon glyphicon-question-sign"></span>
              </a>
              System Files
            </h4>
            <button className="w-files-upload-btn" onClick={this.selectFile}>
              <span className="glyphicon glyphicon-arrow-up"></span>
              Drop file here or click to browse (size &lt;= 20m)
            </button>
            <table className="table">
              <thead>
                <th className="w-files-order">#</th>
                <th className="w-files-path">Path</th>
                <th className="w-files-operation">Operation</th>
              </thead>
              <tbody>
                <tr>
                  <th className="w-files-order">1</th>
                  <td className="w-files-path">$whistle/xxxx.txt</td>
                  <td className="w-files-operation">
                    <a href="javascript:;">Copy path</a>
                    <a href="javascript:;">Download</a>
                    <a href="javascript:;">Delete</a>
                  </td>
                </tr>
              </tbody>
             </table>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          </div>
          <form ref="uploadFileForm" encType="multipart/form-data" style={{display: 'none'}}>
            <input ref="file" onChange={this.uploadFile} name="file" type="file" />
          </form>
          <Dialog ref="filenameDialog" wstyle="w-files-info-dialog">
            <div className="modal-header">
              {title || 'Modify the filename'}
              <button type="button" className="close" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>  
            <div className="modal-body">
              <label className="w-files-name">
                Name:
                <input ref="filename" maxLength="36" placeholder="Input the filename"
                  type="text" className="form-control" />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={this.download}>Download</button>
              <button type="button" className="btn btn-primary" onClick={this.onConfirm}>Confirm</button>
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </Dialog>
          <form ref="downloadForm" action="cgi-bin/download" style={{display: 'none'}}
            method="post" target="downloadTargetFrame">
            <input ref="name" name="filename" type="hidden" />
            <input ref="type" name="type" type="hidden" value="rawBase64" />
            <input ref="headers" name="headers" type="hidden" />
            <input ref="content" name="content" type="hidden" />
          </form>
        </Dialog>
    );
  }
});

var FilesDialogWrap = React.createClass({
  show: function(data) {
    this.refs.filesDialog.show(data);
  },
  hide: function() {
    this.refs.filesDialog.hide();
  },
  shouldComponentUpdate: function() {
    return false;
  },
  render: function() {
    return <FilesDialog ref="filesDialog" />;
  }
});

module.exports = FilesDialogWrap;
