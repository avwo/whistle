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
  showService: function (_, path) {
    if (!path) {
      path = '/';
    } else if (path[0] !== '/') {
      path = '/' + path;
    }
    this.refs.serviceDialog.show('service/index.html#' + path);
  },
  hideService: function () {
    this.refs.serviceDialog.hide();
  },
  componentWillUnmount: function () {
    events.off('showService');
    events.off('hideService');
    this.hideService();
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
