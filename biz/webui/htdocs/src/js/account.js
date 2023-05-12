var React = require('react');
var util = require('./util');

var Account = React.createClass({
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    return (
      <div className={'w-account' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
        Pending ...
      </div>
    );
  }
});

module.exports = Account;
