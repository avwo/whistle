var React = require('react');
var util = require('./util');

var EnabledRules = React.createClass({
  getInitialState: function () {
    return {};
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function () {

    return (
      <div className={this.props.hide ? 'hide' : null}>
        Enabled Rules
      </div>
    );
  }
});

module.exports = EnabledRules;
