require('../css/service.css');
var React = require('react');
var $ = require('jquery');
var events = require('./events');
var LargeDialog = require('./large-dialog');
var dataCenter = require('./data-center');
var getServiceBridge = require('./bridge').getServiceBridge;
var util = require('./util');

var LOGIN_PATH_RE = /^\/?login(?:\?|$)/;
var bridgeApi;
var serviceApi;

var ServiceDialog = React.createClass({
  componentDidMount: function () {
    var self = this;
    events.on('showService', self.showService);
    events.on('hideService', self.hideService);
    events.on('whistleIdChanged', function () {
      var onWhistleIdChange = self.getServiceFunc('onWhistleIdChange');
      onWhistleIdChange && onWhistleIdChange(dataCenter.whistleId);
    });
    events.on('hasWhistleTokenChanged', function () {
      var onHasWhistleTokenChange = self.getServiceFunc('onHasWhistleTokenChange');
      if (onHasWhistleTokenChange) {
        var hasToken = dataCenter.hasWhistleToken;
        var dialogElem = $('.w-service-dialog');
        if (hasToken && dialogElem.hasClass('w-login-dialog')) {
          self.showService();
        }
        onHasWhistleTokenChange(hasToken);
      }
      self.setState({});
    });
  },
  getServiceFunc: function (fn) {
    serviceApi = serviceApi || util.getServiceApi(this.refs.serviceDialog.getWindow(), bridgeApi);
    if (!fn || !serviceApi) {
      return serviceApi;
    }
    fn = serviceApi[fn];
    return typeof fn === 'function' ? fn.bind(serviceApi) : null;
  },
  showService: function (_, path) {
    var self = this;
    var dialog = self.refs.serviceDialog;
    var dialogElem = $('.w-service-dialog');
    if (LOGIN_PATH_RE.test(path)) {
      var showLoginDialog = self.getServiceFunc('showLoginDialog');
      if (showLoginDialog) {
        showLoginDialog();
        dialogElem.removeClass('w-login-dialog');
        return dialog.show();
      }
      dialogElem.addClass('w-login-dialog');
    } else {
      dialogElem.removeClass('w-login-dialog');
    }
    bridgeApi = bridgeApi || getServiceBridge(self.hideService);
    dialog.show(util.getServiceUrl(dialog.getWindow(), path, bridgeApi));
  },
  hideService: function () {
    this.refs.serviceDialog.hide();
  },
  render: function () {
    var className = 'w-service-dialog' + (dataCenter.hasWhistleToken ? '' : ' w-login-dialog');
    return <LargeDialog className={className} ref="serviceDialog" hideButton="1" />;
  }
});

module.exports = ServiceDialog;
