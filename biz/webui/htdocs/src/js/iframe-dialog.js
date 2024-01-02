require('../css/iframe-dialog.css');
var React = require('react');
var Dialog = require('./dialog');
var getBridge = require('./bridge');

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
    var homepage = state.homepage;

    window.onWhistlePluginOptionModalReady = onWhistlePluginOptionModalReady;
  
    return (
      <Dialog ref="iframeDialog" wstyle="w-iframe-dialog" width={state.width || 'max(calc(100% - 240px), 720px)'}>
        <div className="modal-header">
          {
            homepage ? <a
              className={disabled ? 'w-plugin-tab-disabled' : null}
              href={homepage}
              target='_blank'
            >
              {disabled ? <span data-name={name} className="glyphicon glyphicon-ban-circle" /> : undefined}
              {name || 'Untitled'}
            </a> : <span className={disabled ? 'w-plugin-tab-disabled' : null}>
            {disabled ? <span data-name={name} className="glyphicon glyphicon-ban-circle" /> : undefined}
            {name || 'Untitled'}
          </span>
          }
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body" style={{height: state.height || 'max(calc(100vh - 120px), 600px)'}}>
         <iframe src={url} />
        </div>
      </Dialog>
    );
  }
});

module.exports = IframeDialog;
