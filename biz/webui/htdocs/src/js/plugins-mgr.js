require('./base-css.js');
require('../css/plugins-mgr.css');
var React = require('react');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');

var REGISTRY_RE = /^--registry=https?:\/\/[^/?]/;
var SEP_RE = /\s*[|,;\s]+\s*/;

function getRegistry(cmd) {
  if (!cmd || typeof cmd !== 'string') {
    return;
  }
  cmd = cmd.trim().split(SEP_RE);
  for (var i = 0, len = cmd.length; i < len; i++) {
    var name = cmd[i].trim();
    if (REGISTRY_RE.test(name)) {
      return name.substring(11, 1035);
    }
  }
}

var PluginsMgr = React.createClass({
  getInitialState: function () {
    return { list: [] };
  },
  handleCallback: function (data, xhr) {
    if (util.showHandlePluginInfo(data, xhr)) {
      var registry = getRegistry(this._cmd);
      if (registry) {
        dataCenter.plugins.addRegistry({ registry: registry });
      }
    }
  },
  installPlugin: function () {
    dataCenter.plugins.installPlugins({ cmd: this._cmd  }, this.handleCallback);
  },
  installPluginExt: function (plugin) {
    var installPlugin = dataCenter.createCgi(util.getPluginCgiUrl(plugin.moduleName, plugin.installUrl), false, true);
    installPlugin({ cmd: this._cmd  }, this.handleCallback);
  },
  show: function (cmd, list, isUpdate) {
    var self = this;
    list = list || [];
    var len = list.length;
    self._cmd = cmd;
    self._hideDialog = false;
    if (!len) {
      return self.installPlugin();
    }
    if (!dataCenter.enablePluginMgr && len === 1) {
      return self.installPluginExt(list[0]);
    }
    self.setState({
      isUpdate: isUpdate,
      list: list
    }, function() {
      self.refs.pluginsMgr.show();
    });
  },
  hide: function () {
    this.refs.pluginsMgr.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  render: function () {
    var self = this;
    var state = self.state;
    var list = state.list || [];
    var isUpdate = state.isUpdate;
    var actionText = isUpdate ? 'Update' : 'Install';

    return (
      <Dialog ref="pluginsMgr" wstyle="w-plugins-mgr-dialog">
        <div className="modal-header">
          Select {isUpdate ? 'Updater' : 'Installer'}
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          {
            dataCenter.enablePluginMgr ?
            <div className="btn btn-primary plugin-mgr-btn" data-dismiss="modal" onClick={self.installPlugin}>
              {actionText} <span>(Use Default)</span>
            </div> : null
          }
          {
            list.map(function (item) {
              return (
                <div className="btn btn-default plugin-mgr-btn" data-dismiss="modal"
                  key={item.moduleName} onClick={self.installPluginExt.bind(self, item)}>
                  {actionText} <span>(Use plugin {util.getSimplePluginName(item.moduleName)})</span>
                </div>
              );
            })
          }
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Close
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = PluginsMgr;
