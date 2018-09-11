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
    this.setState({ data: data });
  },
  render: function() {
    var data = this.state.data || '';
    var keys = Object.keys(data);
    if (keys.length > MAX_COUNT) {
      keys = keys.slice(0, MAX_COUNT);
    }
    return (
      <div className={'fill orient-vertical-box w-props-editor' + (this.props.hide ? ' hide' : '')}>
        {keys.length ? (<table className="table">
          <tbody>
            {
              keys.map(function(name) {
                return (
                  <tr>
                    <th>{name.substring(0, MAX_NAME_LEN)}</th>
                    <td>
                      <pre>{util.toString(data[name]).substring(0, MAX_VALUE_LEN)}</pre>
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
          <button className="btn btn-primary btn-sm w-add-field">{this.props.isHeader ? 'Add header' : 'Add field'}</button>
        )}
      </div>
    );
  }
});

module.exports = PropsEditor;
