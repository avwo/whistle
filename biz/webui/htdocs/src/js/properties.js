require('./base-css.js');
require('../css/properties.css');
var React = require('react');
var util = require('./util');
var ExpandCollapse = require('./expand-collapse');

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
    var sourceText = enableViewSource && keys.map(function(name) {
      var value = modal[name];
      return (Array.isArray(value) ?
          value.map(function(val, i) {
            return name + ': ' + util.toString(val);
          }).join('\n')
          : name + ': ' + util.toString(value)
      );
    }).join('\n');
    return (
      <div className={ 'w-properties-wrap ' + (viewSource ? 'w-properties-view-source ' : 'w-properties-view-parsed ') + (props.hide ? 'hide' : '') }>
        { enableViewSource ? <a onClick={this.toggle} className="w-properties-btn">{ viewSource ? 'view parsed' : 'view source' }</a> : undefined }
        { enableViewSource ? (<pre className="w-properties-source">
          {sourceText && sourceText.length >= 2100 ? <ExpandCollapse text={sourceText} /> : sourceText}
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
                          <th>{name && name.length >= 2100 ? <ExpandCollapse text={name} /> : name}</th>
                          <td><pre>{val && val.length >= 2100 ? <ExpandCollapse text={val} /> : val}</pre></td>
                        </tr>
                      );
                    })
                  );
                }
                value = util.toString(value);
                return (
                  <tr key={name} title={title[name]} className={value ? undefined : 'w-no-value'}>
                    <th>{name && name.length >= 2100 ? <ExpandCollapse text={name} /> : name}</th>
                    <td><pre>{value && value.length >= 2100 ? <ExpandCollapse text={value} /> : value}</pre></td>
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
