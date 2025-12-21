require('../css/service.css');
var React = require('react');
var events = require('./events');
var LargeDialog = require('./large-dialog');
var dataCenter = require('./data-center');
var getBridge = require('./bridge');

var PAGE_URL = 'service/index.html';
var bridgeApi;
var serviceApi;
var onWhistleServiceMainPageReady = function(api) {
  serviceApi = api || {};
  return bridgeApi;
};

var ServiceBtn = React.createClass({
  getInitialState: function () {
    return {};
  },
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
        serviceApi.onHasWhistleTokenChange(dataCenter.hasWhistleToken);
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
    var iframe = self.refs.serviceDialog;
    var complete = false;
    try {
      var win = iframe.getWindow();
      complete = win.location.href.indexOf(PAGE_URL) !== -1 && win.document.readyState === 'complete';
    } catch (e) {}
    if (!bridgeApi) {
      bridgeApi = getBridge(null, dataCenter.getServiceBridge());
      bridgeApi.closeDialog = function() {
        self.hideService();
      };
      bridgeApi.installPlugins = dataCenter.installPluginsFromService;
    }
    iframe.show(PAGE_URL + (complete && !serviceApi ? '?t=' + Date.now() : '') + '#' + path);
  },
  hideService: function () {
    this.refs.serviceDialog.hide();
  },
  componentWillUnmount: function () {
    events.off('showService');
    events.off('hideService');
    events.off('whistleIdChanged');
    events.off('hasWhistleTokenChanged');
    this.hideService();
  },
  render: function () {
    window.onWhistleServiceMainPageReady = onWhistleServiceMainPageReady;
    return (
      <a
        onClick={this.showService}
        className="w-plugins-menu w-service-btn"
        draggable="false"
        title={dataCenter.hasWhistleToken ? 'Whistle Service' : 'Whistle Service (not logged in)'}
      >
        <span className={'glyphicon glyphicon-cloud' + (dataCenter.hasWhistleToken ? '' : ' w-disabled')} />
        Service
        <LargeDialog className="w-service-dialog" ref="serviceDialog" hideButton="1" />
      </a>
    );
  }
});

module.exports = ServiceBtn;
