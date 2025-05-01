require('../css/service.css');
var React = require('react');
var events = require('./events');
var LargeDialog = require('./large-dialog');

var ServiceBtn = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    events.on('showService', this.showService);
    events.on('hideService', this.hideService);
  },
  showService: function (_, name) {
    this.refs.serviceDialog.show('service/index.html');
  },
  hideService: function () {
    this.refs.serviceDialog.hide();
  },
  render: function () {
    return (
      <a
        onClick={this.showService}
        className="w-plugins-menu w-service-btn"
        draggable="false"
      >
        <span className="glyphicon glyphicon-cloud" />
        Service
        <LargeDialog ref="serviceDialog" hideButton="1" />
      </a>
    );
  }
});

module.exports = ServiceBtn;
