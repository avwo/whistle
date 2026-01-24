require('../css/iframe-dialog.css');
var React = require('react');
var Dialog = require('./dialog');
var getBridge = require('./bridge');
var dataCenter = require('./data-center');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');

function onWhistlePluginOptionModalReady(init, win) {
  if (typeof init === 'function') {
    init(getBridge(win));
  }
}

var IframeDialog = React.createClass({
  getInitialState: function() {
    return {};
  },
  show: function(plugin) {
    var self = this;
    self._hideDialog = false;
    self.setState(plugin, function() {
      self.refs.iframeDialog.show();
    });
  },
  hide: function() {
    this.refs.iframeDialog.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  render: function() {
    var state = this.state;
    var disabled = state.disabled;
    var name = state.name;
    var url = state.url;
    var favicon = state.favicon ? <img src={state.favicon} /> : null;
    var className = 'w-plugins-tab inline-align-items' + (disabled ? ' w-plugin-tab-disabled' : '');

    window.onWhistlePluginOptionModalReady = onWhistlePluginOptionModalReady;

    return (
      <Dialog ref="iframeDialog" wstyle="w-iframe-dialog" width={state.width || 'max(calc(100% - 240px), 720px)'}>
        <div className="modal-header">
          <h4>
            <span className={className}>
              {disabled ? <Icon data-name={name} name="ban-circle" /> : favicon}
              {name || 'Untitled'}
            </span>
          </h4>
          <CloseBtn />
        </div>
        <div className="modal-body w-fix-drag" style={{height: state.height || 'max(calc(100vh - 120px), 600px)'}}>
        <iframe src={url} onLoad={dataCenter.handleIframeLoad} />
        </div>
      </Dialog>
    );
  }
});

module.exports = IframeDialog;
