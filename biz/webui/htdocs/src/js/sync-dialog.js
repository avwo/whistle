require('../css/sync-dialog.css');
var React = require('react');
var Dialog = require('./dialog');
var util = require('./util');
var dataCenter = require('./data-center');
var KVDialog = require('./kv-dialog');

function getCgiUrl(moduleName, url) {
  var pluginName = 'plugin.' + moduleName.substring(8);
  if (url.indexOf(moduleName) === 0 || url.indexOf(pluginName) === 0) {
    return url;
  }
  return pluginName + '/' + url;
}

var SyncDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (plugin, rulesModal, valuesModal, cb) {
    var self = this;
    self.rulesModal = rulesModal;
    self.valuesModal = valuesModal;
    self.plugin = plugin;
    if (!util.isString(plugin.rulesUrl)) {
      plugin.rulesUrl = null;
    }
    if (!util.isString(plugin.valuesUrl)) {
      plugin.valuesUrl = null;
    }
    if (plugin.rulesUrl || plugin.valuesUrl) {
      self.setState(plugin, typeof cb === 'function' ? cb : function () {
        self.refs.syncDialog.show();
      });
    }
  },
  _syncRules: function(history) {
    var self = this;
    var rulesUrl = self.state.rulesUrl;
    if (self.loadingRules || !util.isString(rulesUrl)) {
      return;
    }
    self.loadingRules = true;
    if (history) {
      rulesUrl += (rulesUrl.indexOf('?') === -1 ? '?' : '&') + 'history=' + encodeURIComponent(history);
    }
    var loadRules = dataCenter.createCgi(
      getCgiUrl(self.state.moduleName, rulesUrl)
    );
    loadRules(function (data, xhr) {
      self.loadingRules = false;
      self.setState({});
      if (!data) {
        return util.showSystemError(xhr);
      }
      self.plugin.selectedRulesHistory = history;
      self.refs.kvDialog.show(data, self.rulesModal, self.valuesModal, false, history);
    });
    self.setState({});
  },
  _syncValues: function (history) {
    var self = this;
    var valuesUrl = self.state.valuesUrl;
    if (self.loadingValues || !util.isString(valuesUrl)) {
      return;
    }
    self.loadingValues = true;
    if (history) {
      valuesUrl += (valuesUrl.indexOf('?') === -1 ? '?' : '&') + 'history=' + encodeURIComponent(history);
    }
    var loadValues = dataCenter.createCgi(
      getCgiUrl(self.state.moduleName, valuesUrl)
    );
    loadValues(function (data, xhr) {
      self.loadingValues = false;
      self.setState({});
      if (!data) {
        return util.showSystemError(xhr);
      }
      self.plugin.selectedValuesHistory = history;
      self.refs.kvDialog.show(data, self.rulesModal, self.valuesModal, true, history);
    });
    self.setState({});
  },
  syncRules: function () {
    this._syncRules(this.plugin.selectedRulesHistory);
  },
  syncValues: function () {
    this._syncValues(this.plugin.selectedValuesHistory);
  },
  onHistoryChange: function(history, isValues) {
    if (isValues) {
      this._syncValues(history);
    } else {
      this._syncRules(history);
    }
  },
  render: function () {
    var state = this.state;
    return (
      <Dialog ref="syncDialog" wstyle="w-sync-dialog">
        <div className="modal-body">
          <button
            onClick={this.syncRules}
            disabled={this.loadingRules || !util.isString(state.rulesUrl)}
            type="button"
            className="btn btn-primary"
          >
            <span className="glyphicon glyphicon-list" />{' '}
            {this.loadingRules ? 'Loading' : 'Sync'} Rules
          </button>
          <button
            onClick={this.syncValues}
            disabled={this.loadingValues || !util.isString(state.valuesUrl)}
            type="button"
            className="btn btn-default"
          >
            <span className="glyphicon glyphicon-folder-close" />{' '}
            {this.loadingValues ? 'Loading' : 'Sync'} Values
          </button>
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
        <KVDialog onHistoryChange={this.onHistoryChange} ref="kvDialog" />
      </Dialog>
    );
  }
});

var SyncDialogWrap = React.createClass({
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (plugin, rulesModal, valuesModal, cb) {
    this.refs.syncDialog.show(plugin, rulesModal, valuesModal, cb);
  },
  syncRules: function() {
    this.refs.syncDialog.syncRules();
  },
  syncValues: function() {
    this.refs.syncDialog.syncValues();
  },
  render: function () {
    return <SyncDialog ref="syncDialog" />;
  }
});

module.exports = SyncDialogWrap;
