require('../css/iframe-dialog.css');
var React = require('react');
var Dialog = require('./dialog');
var getBridge = require('./bridge');
var dataCenter = require('./data-center');
var Icon = require('./icon');
var ModalHeader = require('./modal-header');
var util = require('./util');

function onWhistlePluginOptionModalReady(init, win) {
  if (util.isFunc(init)) {
    init(getBridge(win));
  }
}

var IframeDialog = React.createClass({
  getInitialState: function() {
    return {};
  },
  show: function(plugin) {
    var self = this;
    self.refs.dialog.show();
    self.setState(plugin);
  },
  hide: function() {
    this.refs.dialog.hide();
  },
  shouldComponentUpdate: util.scuDialog,
  render: function() {
    var state = this.state;
    var disabled = state.disabled;
    var name = state.name;
    var url = state.url;
    var favicon = state.favicon ? <img src={state.favicon} /> : null;
    var className = 'w-plugins-tab inline-align-items' + (disabled ? ' w-plugin-tab-disabled' : '');

    window.onWhistlePluginOptionModalReady = onWhistlePluginOptionModalReady;

    return (
      <Dialog ref="dialog" wstyle="w-iframe-dialog" width={state.width || 'max(calc(100% - 240px), 720px)'}>
        <ModalHeader>
          <span className={className}>
            {disabled ? <Icon data-name={name} name="ban-circle" /> : favicon}
            {name || 'Untitled'}
          </span>
        </ModalHeader>
        <div className="modal-body w-fix-drag" style={{height: state.height || 'max(calc(100vh - 120px), 600px)'}}>
        <iframe src={url} onLoad={dataCenter.handleIframeLoad} />
        </div>
      </Dialog>
    );
  }
});

module.exports = IframeDialog;
