require('../css/props-editor.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var Dialog = require('./dialog');
var util = require('./util');
var message = require('./message');
var win = require('./win');
var ContextMenu = require('./context-menu');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');

var MAX_FILE_SIZE = 1024 * 1024 * 20;
var MAX_NAME_LEN = 128;
var MAX_VALUE_LEN = 64 * 1024;
var MAX_COUNT = 160;
var index = MAX_COUNT;
var W2_HEADER_RE = /^x-whistle-/;

var highlight = function (name) {
  return name === 'x-forwarded-for' || W2_HEADER_RE.test(name);
};
var PropsEditor = React.createClass({
  getInitialState: function () {
    return {};
  },
  getValue: function (name, field) {
    var props = this.props;
    var isHeader = props.isHeader;
    var allowUploadFile = props.allowUploadFile;
    var decode = isHeader ? util.decodeURIComponentSafe : util.noop;
    var shortName = decode(name.substring(0, MAX_NAME_LEN), isHeader);
    var result = { name: shortName };
    if (allowUploadFile && field && field.value != null) {
      result.value = decode(
        util.toString(field.value).substring(0, MAX_VALUE_LEN),
        isHeader
      );
      result.data = field.data;
      result.size = (field.data && field.data.length) || 0;
      result.type = field.type;
    } else {
      result.value = decode(
        util.toString(field).substring(0, MAX_VALUE_LEN),
        isHeader
      );
    }
    return result;
  },
  update: function (data) {
    var modal = {};
    var overflow;
    var self = this;
    if (data) {
      var keys = Object.keys(data);
      overflow = keys.length >= MAX_COUNT;
      if (overflow) {
        keys = keys.slice(0, MAX_COUNT);
      }
      keys.forEach(function (name) {
        var value = data[name];
        if (!Array.isArray(value)) {
          modal[name + '_0'] = self.getValue(name, value);
          return;
        }
        value.forEach(function (val, i) {
          modal[name + '_' + i] = self.getValue(name, val);
        });
      });
    }
    self.setState({ modal: modal }, self.props.onUpdate);
    return overflow;
  },
  onAdd: function () {
    var self = this;
    if (self.props.disabled) {
      return;
    }
    if (Object.keys(self.state.modal || '').length >= MAX_COUNT) {
      return message.error('Maximum allowed value: ' + MAX_COUNT);
    }
    self.setState({ data: '' });
    self.showDialog();
  },
  clear: function() {
    var self = this;
    if (!Object.keys(self.state.modal || '').length) {
      return;
    }
    self.setState({ modal: {} }, self.props.onChange);
  },
  onEdit: function (e) {
    var self = this;
    if (self.props.disabled) {
      return;
    }
    var name = e.target.getAttribute('data-name');
    var data = self.state.modal[name];
    self.setState({ data: data });
    self.showDialog(data);
  },
  execCallback: function(e) {
    if (e.target.getAttribute('data-action') === 'callback') {
      this.props.callback();
    }
  },
  edit: function (e) {
    var self = this;
    var nameInput = findDOMNode(self.refs.name);
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return message.error('The name is required');
    }
    var valueInput = findDOMNode(self.refs.valueInput);
    var value = valueInput.value.trim();
    var state = self.state;
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
    self.props.onChange(origName, name);
    self.setState({
      fileData: null,
      fileSize: null,
      filename: null,
      fileType: null
    });
    self.hideDialog();
    nameInput.value = valueInput.value = '';
    self.execCallback(e);
  },
  add: function (e) {
    var self = this;
    var nameInput = findDOMNode(self.refs.name);
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return message.error('The name is required');
    }
    var valueInput = findDOMNode(self.refs.valueInput);
    var value = valueInput.value.trim();
    var modal = self.state.modal;
    var state = self.state;
    if (!modal) {
      modal = {};
      state.modal = modal;
    }
    modal[name + '_' + ++index] = state.fileData
      ? {
        name: name,
        value: state.filename,
        size: state.fileSize,
        data: state.fileData,
        type: state.fileType
      }
      : {
        name: name,
        value: value
      };
    self.props.onChange(name);
    self.setState({
      fileData: null,
      fileSize: null,
      filename: null,
      fileType: null
    });
    self.hideDialog();
    nameInput.value = valueInput.value = '';
    self.execCallback(e);
  },
  hideDialog: function () {
    this.refs.composerDialog.hide();
  },
  showDialog: function (data) {
    this.refs.composerDialog.show();
    var self = this;
    var nameInput = findDOMNode(self.refs.name);
    if (data) {
      nameInput.value = data.name || '';
      if (data.data) {
        self.setState({
          filename: data.value,
          fileSize: data.size,
          fileData: data.data,
          fileType: data.type
        });
      } else {
        findDOMNode(self.refs.valueInput).value = data.value || '';
      }
    }
    setTimeout(function () {
      nameInput.select();
      nameInput.focus();
    }, 600);
  },
  onRemove: function (e) {
    var self = this;
    if (self.props.disabled) {
      return;
    }
    var name = e.target.getAttribute('data-name');
    var opName = self.props.isHeader ? 'header' : 'param';
    var item = self.state.modal[name];
    win.confirm(
      'Do you confirm the deletion of this ' + opName + ' \'' + item.name + '\'?',
      function (sure) {
        if (sure) {
          delete self.state.modal[name];
          self.props.onChange(item.name);
          self.setState({});
        }
      }
    );
  },
  getFields: function () {
    var modal = this.state.modal || '';
    return Object.keys(modal).map(function (key) {
      return modal[key];
    });
  },
  toString: function () {
    var modal = this.state.modal || '';
    var keys = Object.keys(modal);
    if (this.props.isHeader) {
      return keys
        .map(function (key) {
          var obj = modal[key];
          return obj.name + ': ' + util.encodeNonLatin1Char(obj.value);
        })
        .join('\r\n');
    }
    return keys
      .map(function (key) {
        var obj = modal[key];
        return (
          util.encodeURIComponent(obj.name) +
          '=' +
          util.encodeURIComponent(obj.value)
        );
      })
      .join('&');
  },
  onUpload: function () {
    if (!this.reading) {
      findDOMNode(this.refs.readLocalFile).click();
    }
  },
  readLocalFile: function () {
    var self = this;
    var form = new FormData(findDOMNode(self.refs.readLocalFileForm));
    var file = form.get('localFile');
    if (file.size > MAX_FILE_SIZE) {
      return win.alert('Total file size must not exceed 20MB');
    }
    var modal = self.state.modal || '';
    var size = file.size;
    Object.keys(modal).forEach(function (key) {
      size += modal[key].size;
    });
    if (size > MAX_FILE_SIZE) {
      return win.alert('Total file size must not exceed 20MB');
    }
    self.reading = true;
    util.readFile(file, function (data) {
      self.reading = false;
      self.localFileData = data;
      self.setState({
        filename: file.name || 'unknown',
        fileData: data,
        fileSize: file.size,
        fileType: file.type
      });
    });
    findDOMNode(self.refs.readLocalFile).value = '';
  },
  removeLocalFile: function (e) {
    var self = this;
    self.setState(
      {
        filename: null,
        fileData: null
      },
      function () {
        var valueInput = findDOMNode(self.refs.valueInput);
        valueInput.select();
        valueInput.focus();
      }
    );
    e.stopPropagation();
  },
  onContextMenu: function(e) {
    util.handlePropsContextMenu(e, this.refs.contextMenu);
  },
  render: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    var modal = state.modal || '';
    var filename = state.filename;
    var fileSize = state.fileSize;
    var keys = Object.keys(modal);
    var isHeader = props.isHeader;
    var allowUploadFile = props.allowUploadFile;
    var data = state.data || '';
    var text = data ? 'Modify' : 'Add';
    var btnText = text + (isHeader ? ' Header' : ' Param');
    var cbBtnText = props.callback ? text + ' & Send' : null;

    return (
      <div
        className={
          'fill v-box w-props-editor' +
          (props.hide ? ' hide' : '')
        }
        title={props.title}
        onDoubleClick={props.onDoubleClick}
      >
        {keys.length ? (
          <table className="table">
            <tbody onContextMenu={self.onContextMenu}>
              {keys.map(function (name) {
                var item = modal[name];
                return (
                  <tr key={name} data-name={item.name} data-value={item.value}>
                    <th
                      className={
                        isHeader && highlight(item.name) ? 'w-bold' : undefined
                      }
                    >
                      {item.name}
                    </th>
                    <td>
                      <pre>
                        {item.data ? <Icon name="file" /> : undefined}
                        {item.data
                          ? ' [' + util.getSize(item.size) + '] '
                          : undefined}
                        {item.value}
                      </pre>
                    </td>
                    <td className="w-props-ops">
                      <Icon
                        name="edit"
                        className="w-edit-btn"
                        data-name={name}
                        onClick={self.onEdit}
                        title="Edit"
                      />
                      <Icon
                        name="remove"
                        className="w-del-btn"
                        data-name={name}
                        onClick={self.onRemove}
                        title="Delete"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <button
            onClick={self.onAdd}
            disabled={props.disabled}
            className={
              'btn btn-primary btn-sm w-add-field' +
              (props.isHeader ? ' w-add-header' : '')
            }
          >
            {props.isHeader ? '+Header' : '+Param'}
          </button>
        )}
        <Dialog ref="composerDialog" wstyle="w-com-dialog">
          <div className="modal-body">
            <CloseBtn />
            <label>
              Name:
              <input
                ref="name"
                placeholder="Enter key name"
                className="form-control mt-5"
                maxLength="128"
              />
            </label>
            <div>
              Value:
              <div
                className={
                  allowUploadFile
                    ? 'w-props-editor-upload mt-5'
                    : 'w-props-editor-form mt-5'
                }
              >
                <div
                  onClick={self.onUpload}
                  className={'w-props-editor-file' + (filename ? '' : ' hide')}
                  title={filename}
                >
                  <CloseBtn className="w-del-btn" onClick={self.removeLocalFile} />
                  <Icon name="file" />
                  {' [' + util.getSize(fileSize) + '] '}
                  {filename}
                </div>
                <textarea
                  ref="valueInput"
                  maxLength={MAX_VALUE_LEN}
                  placeholder="Enter key value"
                  className={'form-control' + (filename ? ' hide' : '')}
                  onKeyDown={util.handleTab}
                />
                <button
                  onClick={self.onUpload}
                  className={'btn btn-primary' + (filename ? ' hide' : '')}
                >
                  <Icon name="folder-open" />
                  Upload
                </button>
              </div>
            </div>
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
              cbBtnText ?
              <button
                type="button"
                className="btn btn-default"
                data-action="callback"
                onClick={data ? self.edit : self.add}
              >
                {cbBtnText}
              </button> : null
            }
            <button
              type="button"
              className="btn btn-primary"
              onClick={data ? self.edit : self.add}
            >
              {btnText}
            </button>
          </div>
        </Dialog>
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
        <ContextMenu ref="contextMenu" />
      </div>
    );
  }
});

module.exports = PropsEditor;
