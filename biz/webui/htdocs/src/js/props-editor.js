require('./base-css.js');
require('../css/props-editor.css');
var React = require('react');
var Dialog = require('./dialog');
var util = require('./util');
var message = require('./message');

var MAX_NAME_LEN = 128;
var MAX_VALUE_LEN = 36 * 1024;
var MAX_COUNT = 160;

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
      keys.forEach(function(name) {
        var value = data[name];
        var shortName = name.substring(0, MAX_NAME_LEN);
        if (!Array.isArray(value)) {
          modal[name + '_0'] =  {
            name: shortName,
            value: util.toString(value).substring(0, MAX_VALUE_LEN)
          };
          return;
        }
        value.forEach(function(val, i) {
          modal[name + '_' + i] =  {
            name: shortName,
            value: util.toString(val).substring(0, MAX_VALUE_LEN)
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
    this.refs.composerDialog.show();
    this.setState({ data: '' });
  },
  onEdit: function(e) {
    if (this.props.disabled) {
      return;
    }
    var name = e.target.getAttribute('data-name');
    this.refs.composerDialog.show();
    this.setState({ data: this.state.modal[name] });
  },
  onRemove: function(e) {
    if (this.props.disabled) {
      return;
    }
    var name = e.target.getAttribute('data-name');
    var opName = this.props.isHeader ? 'header' : 'field';
    var item = this.state.modal[name];
    if (confirm('Confirm delete this ' + opName + ' \'' + item.name + '\'.')) {
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
        return obj.name + ': ' + obj.value;
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
                      <a data-name={name} onClick={self.onRemove} className="glyphicon glyphicon-remove" href="javascript:;" title="Delete"></a>
                      <a data-name={name} onClick={self.onEdit} className="glyphicon glyphicon-edit" href="javascript:;" title="Edit"></a>
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
              Key:
              <input maxLength="128" />
              Value:
              { isHeader ? <input /> : <textarea />}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" data-dismiss="modal">{ btnText }</button>
              <button type="button" className="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
          </Dialog>
      </div>
    );
  }
});

module.exports = PropsEditor;
