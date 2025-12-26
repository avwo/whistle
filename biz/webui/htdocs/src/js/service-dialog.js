require('../css/service.css');
var React = require('react');
var $ = require('jquery');
var events = require('./events');
var LargeDialog = require('./large-dialog');
var dataCenter = require('./data-center');
var getBridge = require('./bridge');

var PAGE_URL = 'service/';
var LOGIN_PATH_RE = /^\/login(?:\?|$)/;
var bridgeApi;
var serviceApi;
var onWhistleServicePageReady = function(api) {
  serviceApi = api || {};
  return bridgeApi;
};

var ServiceDialog = React.createClass({
  componentDidMount: function () {
    var self = this;
    events.on('showService', self.showService);
    events.on('hideService', self.hideService);
    events.on('whistleIdChanged', function () {
      if (serviceApi && typeof serviceApi.onWhistleIdChange === 'function') {
        serviceApi.onWhistleIdChange(dataCenter.whistleId);
      }
    });
    events.on('hasWhistleTokenChanged', function () {
      if (serviceApi && typeof serviceApi.onHasWhistleTokenChange === 'function') {
        var hasToken = dataCenter.hasWhistleToken;
        var dialogElem = $('.w-service-dialog');
        if (hasToken && dialogElem.hasClass('w-service-login-dialog')) {
          self.showService();
        }
        serviceApi.onHasWhistleTokenChange(hasToken);
      }
      self.setState({});
    });
  },
  showService: function (_, path) {
    if (!path) {
      path = '/';
    } else if (path[0] !== '/') {
      path = '/' + path;
    }
    var self = this;
    var dialog = self.refs.serviceDialog;
    var complete = false;
    var dialogElem = $('.w-service-dialog');
    if (LOGIN_PATH_RE.test(path)) {
      if (serviceApi && typeof serviceApi.showLoginDialog === 'function') {
        serviceApi.showLoginDialog();
        dialogElem.removeClass('w-service-login-dialog');
        return dialog.show();
      }
      dialogElem.addClass('w-service-login-dialog');
    } else {
      dialogElem.removeClass('w-service-login-dialog');
    }
    try {
      var win = dialog.getWindow();
      complete = win.location.href.indexOf(PAGE_URL) !== -1 && win.document.readyState === 'complete';
    } catch (e) {}
    if (!bridgeApi) {
      bridgeApi = getBridge(null, dataCenter.getServiceBridge());
      bridgeApi.closeDialog = function() {
        self.hideService();
      };
      bridgeApi.installPlugins = dataCenter.installPluginsFromService;
    }
    dialog.show(PAGE_URL + (complete && !serviceApi ? '?t=' + Date.now() : '') + '#' + path);
  },
  hideService: function () {
    this.refs.serviceDialog.hide();
  },
  render: function () {
    window.onWhistleServicePageReady = onWhistleServicePageReady;
    return <LargeDialog className={'w-service-dialog' + (dataCenter.hasWhistleToken ? '' : ' w-service-login-dialog')} ref="serviceDialog" hideButton="1" />;
  }
});

module.exports = ServiceDialog;
