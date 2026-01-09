var React = require('react');
var dataCenter = require('./data-center');
var util = require('./util');

var ServiceBtn = React.createClass({
  showService: function () {
    util.showService();
  },
  render: function () {
    if (!dataCenter.whistleId) {
      return null;
    }
    var hasToken = dataCenter.hasWhistleToken;
    return (
      <a
        onClick={this.showService}
        className="w-plugins-menu w-service-btn"
        draggable="false"
        title={hasToken ? 'Whistle Service' : 'Whistle Service (not logged in)'}
      >
        <span className={'glyphicon glyphicon-cloud' + (hasToken ? '' : ' w-disabled')} />
        Service
      </a>
    );
  }
});

module.exports = ServiceBtn;
