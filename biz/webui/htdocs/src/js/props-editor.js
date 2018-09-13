require('./base-css.js');
require('../css/props-editor.css');
var React = require('react');
var util = require('./util');

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
  onEditor: function() {
    if (this.props.disabled) {
      return;
    }
    
  },
  onRemove: function() {
    if (this.props.disabled) {
      return;
    }

  },
  render: function() {
    var modal = this.state.modal || '';
    var keys = Object.keys(modal);
    
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
                      <a className="glyphicon glyphicon-remove" href="javascript:;" title="Delete"></a>
                      <a className="glyphicon glyphicon-edit" href="javascript:;" title="Edit"></a>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>) : (
          <button className={'btn btn-primary btn-sm w-add-field' + (this.props.isHeader ? ' w-add-header' : '')}>{this.props.isHeader ? 'Add header' : 'Add field'}</button>
        )}
      </div>
    );
  }
});

module.exports = PropsEditor;
