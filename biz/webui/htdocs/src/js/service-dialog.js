var React = require('react');
var LargeDialog = require('./large-dialog');
var getServiceBridge = require('./bridge').getServiceBridge;
var util = require('./util');

var addEvent = util.on;
var bridgeApi;

var ServiceDialog = React.createClass({
  componentDidMount: function () {
    var self = this;
    addEvent('showService', self.showService);
    addEvent('hideService', self.hideService);
  },
  showService: function (_, path) {
    var self = this;
    var dialog = self.refs.serviceDialog;
    bridgeApi = bridgeApi || getServiceBridge(self.hideService);
    dialog.show(util.getServiceUrl(dialog.getWindow(), path, bridgeApi));
  },
  hideService: function () {
    this.refs.serviceDialog.hide();
  },
  render: function () {
    return <LargeDialog className="w-service-dialog" ref="serviceDialog" hideButton="1" />;
  }
});

module.exports = ServiceDialog;
