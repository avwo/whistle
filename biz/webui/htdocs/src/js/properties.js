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
    var props = this.props;
    var enableViewSource = props.enableViewSource;
    var viewSource = this.state.viewSource;
    var modal = props.modal || {};
    var title = props.title || {};
    var keys = Object.keys(modal);
    return (
      <div className={ 'w-properties-wrap ' + (viewSource ? 'w-properties-view-source ' : 'w-properties-view-parsed ') }>
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
        <table className={'table w-properties w-properties-parsed ' + (props.className || '')}>
          <tbody>
            {
              keys.map(function(name) {
                var value = modal[name];
                if (Array.isArray(value)) {
                  return (
                    value.map(function(val, i) {
                      val = util.toString(val);
                      return (
                        <tr key={i} className={val ? undefined : 'w-no-value'}>
                          <th>{name}</th>
                          <td><pre>{val}</pre></td>
                        </tr>
                      );
                    })
                  );
                }
                value = util.toString(value);
                return (
                  <tr key={name} title={title[name]} className={value ? undefined : 'w-no-value'}>
                    <th>{name}</th>
                    <td><pre>{value}</pre></td>
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
