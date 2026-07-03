var React = require('react');
var dataCenter = require('./data-center');
var util = require('./util');
var Icon = require('./icon');

var ServiceBtn = React.createClass({
  showService: function () {
    util.showService();
  },
  render: function () {
    if (!dataCenter.whistleId) {
      return null;
    }
    return (
      <a
        onClick={this.showService}
        className="w-plugins-menu"
        draggable="false"
      >
        <Icon name="cloud" />
        Service
      </a>
    );
  }
});

module.exports = ServiceBtn;
