require('../css/online.css');
var React = require('react');
var Dialog = require('./dialog');
var IFrame = require('./iframe');
var dataCenter = require('./data-center');
var getBridge = require('./bridge');

var PAGE_URL = 'service/login.html?from=webui';
var bridgeApi;
var serviceApi;
var onWhistleServiceLoginPageReady = function(api) {
  serviceApi = api || {};
  return bridgeApi;
};

function setDialogProperty(name, size) {
  var style = document.querySelector('.w-login-dialog').style;
  if (size > 0) {
    style.setProperty(name, size + 'px');
  } else {
    style.removeProperty(name);
  }
}

var LoginDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (cb, path) {
    if (!path) {
      path = '/';
    } else if (path[0] !== '/') {
      path = '/' + path;
    }
    var self = this;
    var complete;
    var iframe = self.refs.iframe;
    try {
      var win = iframe.getWindow();
      complete = win.location.href.indexOf(PAGE_URL) !== -1 && win.document.readyState === 'complete';
    } catch (e) {}
    if (!bridgeApi) {
      bridgeApi = getBridge(null, dataCenter.getServiceBridge());
      bridgeApi.closeDialog = function() {
        self.hide();
      };
      bridgeApi.setDialogWidth = function(width) {
        setDialogProperty('--w-login-dialog-width', width);
      };
      bridgeApi.setDialogHeight = function(height) {
        setDialogProperty('--w-login-dialog-height', height);
      };
    }
    self.refs.loginDialog.show();
    self.setState({ cb: cb, src: PAGE_URL + (complete && !serviceApi ? '&t=' + Date.now() : '') + '#' + path  });
  },
  hide: function () {
    this.refs.loginDialog.hide();
  },
  render: function () {
    window.onWhistleServiceLoginPageReady = onWhistleServiceLoginPageReady;
    return (
      <Dialog ref="loginDialog" wstyle="w-login-dialog">
        <IFrame ref="iframe" src={this.state.src} className="modal-body" />
      </Dialog>
    );
  }
});

module.exports = LoginDialog;
