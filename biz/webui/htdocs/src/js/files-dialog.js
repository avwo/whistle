require('./base-css.js');
require('../css/files-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var util = require('./util');
var events = require('./events');
var message = require('./message');
var dataCenter = require('./data-center');

var MAX_FILE_SIZE = 1024 * 1024 * 20;
var MAX_FILES_COUNT = 60;

function focus(input) {
  input.select();
  input.focus();
}

function showError(msg, input) {
  message.error(msg);
  input.select();
  input.focus();
}

function fomatFiles(files) {
  return files.map(function(file) {
    file.date = util.toLocaleString(new Date(file.date));
    return file;
  });
}

var FilesDialog = React.createClass({
  getInitialState: function() {
    return { files: fomatFiles(dataCenter.getUploadFiles()) };
  },
  updateFiles: function(files) {
    files && this.setState({ files: fomatFiles(files) });
  },
  show: function() {
    this.refs.filesDialog.show();
  },
  hide: function() {
    this.refs.filesDialog.hide();
  },
  showNameInput: function() {
    if (!this.checkCount()) {
      return;
    }
    var refs = this.refs;
    refs.filenameDialog.show();
    var input = ReactDOM.findDOMNode(refs.filename);
    input.value = this.params.name || '';
    setTimeout(function() {
      focus(input);
    }, 500);
    this.setState({});
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
    events.on('download', function(_, params) {
      self.startDownload(params);
    });
  },
  checkParams: function() {
    var input = ReactDOM.findDOMNode(this.refs.filename);
    var name = input.value.trim();
    if (!name) {
      showError('The filename cannot be empty.', input);
      return;
    }
    if (name.length > MAX_FILES_COUNT) {
      showError('The filename length cannot exceed 60.', input);
      return;
    }
    if (/[\\/:*?"<>|\s]/.test(name)) {
      showError('The filename cannot contain \\/:*?"<>| and spaces.', input);
      return;
    }
    this.params.name = name;
    return true;
  },
  checkCount: function() {
    var files = this.state.files;
    if (files.length >= MAX_FILES_COUNT) {
      this.show();
      setTimeout(function() {
        alert('The number of uploaded files cannot exceed 60,\ndelete the unnecessary files first.');
      }, 10);
      return false;
    }
    return true;
  },
  onConfirm: function() {
    if (this.pending || !this.checkParams() || !this.checkCount()) {
      return;
    }
    var self = this;
    self.pending = true;
    var name = self.params.name;
    dataCenter.values.checkFile({
      name: name,
      count: self.state.files.length
    }, function(data, xhr) {
      self.pending = false;
      if (!data) {
        return util.showSystemError(xhr);
      }
      self.updateFiles(data.files);
      if (data.isMax) {
        return alert('The number of uploaded files cannot exceed 60,\ndelete the unnecessary files first.');
      }
      if (data.exists &&
          !confirm('The name `' + name + '`  already exists, whether to overwrite it?')) {
        return;
      }
      self.pending = true;
      dataCenter.values.upload(JSON.stringify(self.params), function(data, xhr) {
        self.pending = false;
        if (!data) {
          return util.showSystemError(xhr);
        }
        if (data.ec !== 0) {
          return alert(data.em);
        }
        self.params = '';
        self.refs.filenameDialog.hide();
        self.updateFiles(data.files);
        self.show();
      }, {
        contentType: 'application/json',
        processData: false
      });
    });
  },
  startDownload: function(params) {
    ReactDOM.findDOMNode(this.refs.name).value = params.name;
    ReactDOM.findDOMNode(this.refs.headers).value = params.headers || '';
    ReactDOM.findDOMNode(this.refs.content).value = params.base64 || '';
    ReactDOM.findDOMNode(this.refs.downloadForm).submit();
  },
  download: function(e) {
    if (this.checkParams()) {
      this.startDownload(this.params);
    }
    
  },
  submit: function(file) {
    if (!file.size) {
      return alert('The file size cannot be empty.');
    }
    if (file.size > MAX_FILE_SIZE) {
      return alert('The file size cannot exceed 20m.');
    }
    var self = this;
    var params = {};
    util.readFileAsBase64(file, function(base64) {
      params.base64 = base64;
      ReactDOM.findDOMNode(self.refs.file).value = '';
      params.name = (file.name || '').replace(/[\\/:*?"<>|\s]/g, '');
      self.params = params;
      self.showNameInput();
    });
  },
  uploadFile: function() {
    var form = ReactDOM.findDOMNode(this.refs.uploadFileForm);
    this.submit(new FormData(form).get('file'));
  },
  selectFile: function() {
    if (!this.checkCount()) {
      return;
    }
    ReactDOM.findDOMNode(this.refs.file).click();
  },
  remove: function(e) {
    var name = e.target.getAttribute('data-name');
    if (!confirm('Are you sure to delete this file \'' + name + '\'.')) {
      return;
    }
    var self = this;
    dataCenter.values.removeFile({ name: name }, function(data, xhr) {
      if (!data) {
        return util.showSystemError(xhr);
      }
      if (data.ec !== 0) {
        return alert(data.em);
      }
      self.updateFiles(data.files);
    });
  },
  downloadFile: function(e) {
    var name = e.target.getAttribute('data-name');
    window.open('cgi-bin/values/download?name=' + encodeURIComponent(name));
  },
  render: function() {
    var self = this;
    var title = (self.params || '').title;
    var files = self.state.files;
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
            <button className="w-files-upload-btn" onClick={self.selectFile}>
              <span className="glyphicon glyphicon-arrow-up"></span>
              Drop file here or click to browse (size &lt;= 20m)
            </button>
            <table className="table" style={{ display: files.length ? undefined : 'none' }}>
              <thead>
                <th className="w-files-order">#</th>
                <th className="w-files-date">Date</th>
                <th className="w-files-path">Path</th>
                <th className="w-files-operation">Operation</th>
              </thead>
              <tbody>
                {
                  files.map(function(file, i) {
                    var filePath = '/$whistle/' + file.name;
                    return (
                      <tr>
                        <th className="w-files-order">{ i + 1 }</th>
                        <td className="w-files-date">{file.date}</td>
                        <td className="w-files-path">{filePath}</td>
                        <td className="w-files-operation">
                          <a className="w-copy-text-with-tips"
                            data-clipboard-text={filePath}>Copy path</a>
                          <a data-name={file.name} onClick={self.downloadFile}>Download</a>
                          <a data-name={file.name} onClick={self.remove}>Delete</a>
                        </td>
                      </tr>
                    );
                  })
                }
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
                <input ref="filename" maxLength="60" placeholder="Input the filename"
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
