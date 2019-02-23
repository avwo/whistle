require('./base-css.js');
require('../css/props-editor.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var util = require('./util');
var message = require('./message');

var CRLF_RE = /[\r\n]+/g;
var MAX_NAME_LEN = 128;
var MAX_VALUE_LEN = 36 * 1024;
var MAX_COUNT = 160;
var index = MAX_COUNT;

var PropsEditor = React.createClass({
  getInitialState: function() {
    return {};
  },
  update: function(data) {
    var modal = {};
    var overflow;
    if (data) {
      var keys = Object.keys(data);
      overflow = keys.length >= MAX_COUNT;
      if (overflow) {
        keys = keys.slice(0, MAX_COUNT);
      }
      var isHeader = this.props.isHeader;
      var decode = isHeader ? util.decodeURIComponentSafe : util.noop;
      keys.forEach(function(name) {
        var value = data[name];
        var shortName = decode(name.substring(0, MAX_NAME_LEN), isHeader);
        if (!Array.isArray(value)) {
          modal[name + '_0'] =  {
            name: shortName,
            value: decode(util.toString(value).substring(0, MAX_VALUE_LEN), isHeader)
          };
          return;
        }
        value.forEach(function(val, i) {
          modal[name + '_' + i] =  {
            name: shortName,
            value: decode(util.toString(val).substring(0, MAX_VALUE_LEN))
          };
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
      return message.error('The name cannot be empty.');
    }
    var valueInput = ReactDOM.findDOMNode(this.refs.valueInput);
    var value = valueInput.value.trim();
    var data = this.state.data;
    var origName = data.name;
    data.name = name;
    data.value = value;
    this.props.onChange(origName, name);
    this.setState({});
    this.hideDialog();
    nameInput.value = valueInput.value = '';
  },
  add: function() {
    var nameInput = ReactDOM.findDOMNode(this.refs.name);
    var name = nameInput.value.trim();
    if (!name) {
      return message.error('The name cannot be empty.');
    }
    var valueInput = ReactDOM.findDOMNode(this.refs.valueInput);
    var value = valueInput.value.trim();
    var modal = this.state.modal;
    modal[name + '_' + ++index] = {
      name: name,
      value: value
    };
    this.props.onChange(name);
    this.setState({});
    this.hideDialog();
    nameInput.value = valueInput.value = '';
  },
  hideDialog: function() {
    this.refs.composerDialog.hide();
  },
  showDialog: function(data) {
    this.refs.composerDialog.show();
    var nameInput = ReactDOM.findDOMNode(this.refs.name);
    var valueInput = ReactDOM.findDOMNode(this.refs.valueInput);
    if (data) {
      nameInput.value = data.name || '';
      valueInput.value = data.value || '';
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
  toString: function() {
    var modal = this.state.modal;
    var keys = Object.keys(modal || '');
    if (this.props.isHeader) {
      return keys.map(function(key) {
        var obj = modal[key];
        return obj.name + ': ' + obj.value.replace(CRLF_RE, ' ');
      }).join('\r\n');
    }
    return keys.map(function(key) {
      var obj = modal[key];
      return util.encodeURIComponent(obj.name) + '=' + util.encodeURIComponent(obj.value);
    }).join('&');
  },
  render: function() {
    var self = this;
    var modal = this.state.modal || '';
    var keys = Object.keys(modal);
    var isHeader = this.props.isHeader;
    var data = this.state.data || '';
    var btnText = (data ? 'Modify' : 'Add') + (isHeader ? ' header' : ' field');
    
    return (
      <div className={'fill orient-vertical-box w-props-editor' + (this.props.hide ? ' hide' : '')}>
        {keys.length ? (<table className="table">
          <tbody>
            {
              keys.map(function(name) {
                var item = modal[name];
                return (
                  <tr key={name}>
                    <th>{item.name}</th>
                    <td>
                      <pre>{item.value}</pre>
                    </td>
                    <td className="w-props-ops">
                      <a data-name={name} onClick={self.onEdit} className="glyphicon glyphicon-edit" href="javascript:;" title="Edit"></a>
                      <a data-name={name} onClick={self.onRemove} className="glyphicon glyphicon-remove" href="javascript:;" title="Delete"></a>
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
              <label>
                Value:
                <textarea ref="valueInput" maxLength={MAX_VALUE_LEN} placeholder="Input the value" className="form-control" />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary"
                onClick={data ? self.edit : self.add}>{ btnText }</button>
              <button type="button" className="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
          </Dialog>
      </div>
    );
  }
});

module.exports = PropsEditor;
