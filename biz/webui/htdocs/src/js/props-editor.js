require('./base-css.js');
require('../css/props-editor.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var util = require('./util');
var message = require('./message');

var MAX_FILE_SIZE = 1024 * 1024 * 20;
var MAX_NAME_LEN = 128;
var MAX_VALUE_LEN = 36 * 1024;
var MAX_COUNT = 160;
var index = MAX_COUNT;
var W2_HEADER_RE = /^x-whistle-/;

var highlight = function(name) {
  return name === 'x-forwarded-for' || W2_HEADER_RE.test(name);
};
var PropsEditor = React.createClass({
  getInitialState: function() {
    return {};
  },
  getValue: function(name, field) {
    var isHeader = this.props.isHeader;
    var allowUploadFile = this.props.allowUploadFile;
    var decode = isHeader ? util.decodeURIComponentSafe : util.noop;
    var shortName = decode(name.substring(0, MAX_NAME_LEN), isHeader);
    var result = { name: shortName };
    if (allowUploadFile && field && field.value != null) {
      result.value = decode(util.toString(field.value).substring(0, MAX_VALUE_LEN), isHeader);
      result.data = field.data;
      result.size = field.data && field.data.length;
      result.type = field.type;
    } else {
      result.value = decode(util.toString(field).substring(0, MAX_VALUE_LEN), isHeader);
    }
    return result;
  },
  update: function(data) {
    var modal = {};
    var overflow;
    if (data) {
      var self = this;
      var keys = Object.keys(data);
      overflow = keys.length >= MAX_COUNT;
      if (overflow) {
        keys = keys.slice(0, MAX_COUNT);
      }
      keys.forEach(function(name) {
        var value = data[name];
        if (!Array.isArray(value)) {
          modal[name + '_0'] = self.getValue(name, value);
          return;
        }
        value.forEach(function(val, i) {
          modal[name + '_' + i] =  self.getValue(name, val);
        });
      });
    }
    this.setState({ modal: modal });
    return overflow;
  },
  onAdd: function() {
    if (this.props.disabled) {
      return;
    }
    if (Object.keys(this.state.modal || '').length >= MAX_COUNT) {
      return message.error('The number cannot exceed ' + MAX_COUNT + '.');
    }
    this.setState({ data: '' });
    this.showDialog();
  },
  onEdit: function(e) {
    if (this.props.disabled) {
      return;
    }
    var name = e.target.getAttribute('data-name');
    var data = this.state.modal[name];
    this.setState({ data: data });
    this.showDialog(data);
  },
  edit: function() {
    var nameInput = ReactDOM.findDOMNode(this.refs.name);
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return message.error('The name cannot be empty.');
    }
    var valueInput = ReactDOM.findDOMNode(this.refs.valueInput);
    var value = valueInput.value.trim();
    var state = this.state;
    var data = state.data;
    var origName = data.name;
    data.name = name;
    data.data = state.fileData;
    if (state.fileData) {
      data.size = state.fileSize;
      data.value = state.filename;
      data.type = state.fileType;
    } else {
      data.value = value;
    }
    this.props.onChange(origName, name);
    this.setState({
      fileData: null,
      fileSize: null,
      filename: null,
      fileType: null
    });
    this.hideDialog();
    nameInput.value = valueInput.value = '';
  },
  add: function() {
    var nameInput = ReactDOM.findDOMNode(this.refs.name);
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return message.error('The name cannot be empty.');
    }
    var valueInput = ReactDOM.findDOMNode(this.refs.valueInput);
    var value = valueInput.value.trim();
    var modal = this.state.modal;
    var state = this.state;
    modal[name + '_' + ++index] = state.fileData ? {
      name: name,
      value: state.filename,
      size: state.fileSize,
      data: state.fileData,
      type: state.fileType
    } : {
      name: name,
      value: value
    };
    this.props.onChange(name);
    this.setState({
      fileData: null,
      fileSize: null,
      filename: null,
      fileType: null
    });
    this.hideDialog();
    nameInput.value = valueInput.value = '';
  },
  hideDialog: function() {
    this.refs.composerDialog.hide();
  },
  showDialog: function(data) {
    this.refs.composerDialog.show();
    var nameInput = ReactDOM.findDOMNode(this.refs.name);
    if (data) {
      nameInput.value = data.name || '';
      if (data.data) {
        this.setState({
          filename: data.value,
          fileSize: data.size,
          fileData: data.data,
          fileType: data.type
        });
      } else {
        ReactDOM.findDOMNode(this.refs.valueInput).value = data.value || '';
      }
    }
    setTimeout(function() {
      nameInput.select();
      nameInput.focus();
    }, 600);
  },
  onRemove: function(e) {
    if (this.props.disabled) {
      return;
    }
    var name = e.target.getAttribute('data-name');
    var opName = this.props.isHeader ? 'header' : 'field';
    var item = this.state.modal[name];
    if (confirm('Are you sure to delete this ' + opName + ' \'' + item.name + '\'.')) {
      delete this.state.modal[name];
      this.props.onChange(item.name);
      this.setState({});
    }
  },
  getFields: function() {
    var modal = this.state.modal || '';
    return Object.keys(modal).map(function(key) {
      return modal[key];
    });
  },
  toString: function() {
    var modal = this.state.modal || '';
    var keys = Object.keys(modal);
    if (this.props.isHeader) {
      return keys.map(function(key) {
        var obj = modal[key];
        return obj.name + ': ' + util.encodeNonLatin1Char(obj.value);
      }).join('\r\n');
    }
    return keys.map(function(key) {
      var obj = modal[key];
      return util.encodeURIComponent(obj.name) + '=' + util.encodeURIComponent(obj.value);
    }).join('&');
  },
  onUpload: function() {
    if (!this.reading) {
      ReactDOM.findDOMNode(this.refs.readLocalFile).click();
    }
  },
  readLocalFile: function() {
    var form = new FormData(ReactDOM.findDOMNode(this.refs.readLocalFileForm));
    var file = form.get('localFile');
    if (file.size > MAX_FILE_SIZE) {
      return alert('The size of all files cannot exceed 20m.');
    }
    var modal = this.state.modal || '';
    var size = file.size;
    Object.keys(modal).forEach(function(key) {
      size += modal[key].size;
    });
    if (size > MAX_FILE_SIZE) {
      return alert('The size of all files cannot exceed 20m.');
    }
    var self = this;
    self.reading = true;
    util.readFile(file, function(data) {
      self.reading = false;
      self.localFileData = data;
      self.setState({ 
        filename: file.name || 'unknown',
        fileData: data,
        fileSize: file.size,
        fileType: file.type
      });
    });
    ReactDOM.findDOMNode(this.refs.readLocalFile).value = '';
  },
  removeLocalFile: function(e) {
    var self = this;
    self.setState({ 
      filename: null,
      fileData: null
    }, function() {
      var valueInput = ReactDOM.findDOMNode(self.refs.valueInput);
      valueInput.select();
      valueInput.focus();
    });
    e.stopPropagation();
  },
  render: function() {
    var self = this;
    var modal = this.state.modal || '';
    var filename = this.state.filename;
    var fileSize = this.state.fileSize;
    var keys = Object.keys(modal);
    var isHeader = this.props.isHeader;
    var allowUploadFile = this.props.allowUploadFile;
    var data = this.state.data || '';
    var btnText = (data ? 'Modify' : 'Add') + (isHeader ? ' header' : ' field');
    
    return (
      <div className={'fill orient-vertical-box w-props-editor' + (this.props.hide ? ' hide' : '')} title={this.props.title} onDoubleClick={this.props.onDoubleClick}>
        {keys.length ? (<table className="table">
          <tbody>
            {
              keys.map(function(name) {
                var item = modal[name];
                return (
                  <tr key={name}>
                    <th className={isHeader && highlight(item.name) ? 'w-bold' : undefined}>{item.name}</th>
                    <td>
                      <pre>
                        {item.data ? <span className="glyphicon glyphicon-file"></span> : undefined}
                        {item.data ? ' [' + util.getSize(item.size) + '] ' : undefined}
                        {item.value}
                      </pre>
                    </td>
                    <td className="w-props-ops">
                      <a data-name={name} onClick={self.onEdit} className="glyphicon glyphicon-edit" title="Edit"></a>
                      <a data-name={name} onClick={self.onRemove} className="glyphicon glyphicon-remove" title="Delete"></a>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>) : (
          <button onClick={this.onAdd} className={'btn btn-primary btn-sm w-add-field' + (this.props.isHeader ? ' w-add-header' : '')}>{this.props.isHeader ? 'Add header' : 'Add field'}</button>
        )}
        <Dialog ref="composerDialog" wstyle="w-composer-dialog">
            <div className="modal-body">
              <button type="button" className="close" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
              </button>
              <label>
                Name:
                <input ref="name" placeholder="Input the name" className="form-control" maxLength="128" />
              </label>
              <div>
                Value:
                <div className={allowUploadFile ? 'w-props-editor-upload' : 'w-props-editor-form'}>
                  <div onClick={this.onUpload} className={'w-props-editor-file' + (filename ? '' : ' hide')} title={filename}>
                    <button onClick={this.removeLocalFile} type="button" className="close" title="Remove file">
                      <span aria-hidden="true">&times;</span>
                    </button>
                    <span className="glyphicon glyphicon-file"></span>
                     {' [' + util.getSize(fileSize) + '] '} 
                    {filename}
                  </div>
                  <textarea ref="valueInput" maxLength={MAX_VALUE_LEN} placeholder="Input the value" className={'form-control' + (filename ? ' hide' : '')} />
                  <button onClick={this.onUpload} className={'btn btn-primary' + (filename ? ' hide' : '')}>Upload file</button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary"
                onClick={data ? self.edit : self.add}>{ btnText }</button>
              <button type="button" className="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
          </Dialog>
          <form ref="readLocalFileForm" encType="multipart/form-data" style={{display: 'none'}}>
            <input ref="readLocalFile" onChange={this.readLocalFile} type="file" name="localFile" />
          </form>
      </div>
    );
  }
});

module.exports = PropsEditor;
