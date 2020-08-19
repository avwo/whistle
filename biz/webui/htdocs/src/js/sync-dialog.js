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
  getInitialState: function() {
    return {};
  },
  show: function(options, rulesModal, valuesModal) {
    var self = this;
    self.rulesModal = rulesModal;
    self.valuesModal = valuesModal;
    if (!util.isString(options.rulesUrl)) {
      options.rulesUrl = null;
    }
    if (!util.isString(options.valuesUrl)) {
      options.valuesUrl = null;
    }
    self.setState(options, function() {
      self.refs.syncDialog.show();
    });
  },
  syncRules: function() {
    var self = this;
    var rulesUrl = self.state.rulesUrl;
    if (self.loadingRules || !util.isString(rulesUrl)) {
      return;
    }
    self.loadingRules = true;
    var loadRules = dataCenter.createCgi(getCgiUrl(self.state.moduleName, rulesUrl));
    loadRules(function(data, xhr) {
      self.loadingRules = false;
      self.setState({});
      if (!data) {
        return util.showSystemError(xhr);
      }
      self.refs.kvDialog.show(data, self.rulesModal, self.valuesModal);
    });
    self.setState({});
  },
  syncValues: function() {
    var self = this;
    var valuesUrl = self.state.valuesUrl;
    if (self.loadingValues || !util.isString(valuesUrl)) {
      return;
    }
    self.loadingValues = true;
    var loadValues = dataCenter.createCgi(getCgiUrl(self.state.moduleName, valuesUrl));
    loadValues(function(data, xhr) {
      self.loadingValues = false;
      self.setState({});
      if (!data) {
        return util.showSystemError(xhr);
      }
      self.refs.kvDialog.show(data, self.rulesModal, self.valuesModal, true);
    });
    self.setState({});
  },
  render: function() {
    var state = this.state;
    return (
      <Dialog ref="syncDialog" wstyle="w-sync-dialog">
        <div className="modal-body">
          <button onClick={this.syncRules} disabled={this.loadingRules || !util.isString(state.rulesUrl)} type="button" className="btn btn-primary">
            <span className="glyphicon glyphicon-list" /> {this.loadingRules ? 'Loading' : 'Sync'} Rules
          </button>
          <button onClick={this.syncValues} disabled={this.loadingValues || !util.isString(state.valuesUrl)} type="button" className="btn btn-default">
            <span className="glyphicon glyphicon-folder-close" /> {this.loadingValues ? 'Loading' : 'Sync'} Values
          </button>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
        <KVDialog ref="kvDialog" />
      </Dialog>
    );
  }
});

var SyncDialogWrap = React.createClass({
  shouldComponentUpdate: function() {
    return false;
  },
  show: function(options, rulesModal, valuesModal) {
    this.refs.syncDialog.show(options, rulesModal, valuesModal);
  },
  render: function() {
    return <SyncDialog ref="syncDialog" />;
  }
});

module.exports = SyncDialogWrap;
