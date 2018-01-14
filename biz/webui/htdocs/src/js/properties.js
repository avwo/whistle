require('./base-css.js');
require('../css/properties.css');
var React = require('react');
var util = require('./util');

var Properties = React.createClass({
  getInitialState: function() {
    return { viewSource: false };
  },
  toggle: function() {
    this.setState({ viewSource: !this.state.viewSource });
  },
  render: function() {
    var enableViewSource = this.props.enableViewSource;
    var viewSource = this.state.viewSource;
    var modal = this.props.modal || {};
    var title = this.props.title || {};
    var keys = Object.keys(modal);
    return (
      <div className={ 'w-properties-wrap ' + (viewSource ? 'w-properties-view-source' : 'w-properties-view-parsed') }>
        { enableViewSource ? <a onClick={this.toggle} className="w-properties-btn">{ viewSource ? 'view parsed' : 'view source' }</a> : undefined }
        { enableViewSource ? (<pre className="w-properties-source">
          { keys.map(function(name) {
            var value = modal[name];
            return (Array.isArray(value) ?
                value.map(function(val, i) {
                  return name + ': ' + util.toString(val);
                }).join('\n')
                : name + ': ' + util.toString(value)
            );
          }).join('\n') }
        </pre>) : undefined }
        <table className="table w-properties w-properties-parsed">
          <tbody>
            {
              keys.map(function(name) {
                var value = modal[name];

                return (Array.isArray(value) ?
                    value.map(function(val, i) {
                      return (
                        <tr key={i}>
                          <th>{name}</th>
                          <td><pre>{util.toString(val)}</pre></td>
                        </tr>
                      );
                    })
                    :
                    <tr key={name} title={title[name]}>
                      <th>{name}</th>
                      <td><pre>{util.toString(value)}</pre></td>
                    </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    );
  }
});

module.exports = Properties;
