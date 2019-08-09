var React = require('react');
var Dialog = require('./dialog');
var util = require('./util');
var dataCenter = require('./data-center');
require('../css/sync-dialog.css');

var SyncDialog = React.createClass({
  getInitialState: function() {
    return {};
  },
  show: function(options) {
    var self = this;
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
    var loadRules = dataCenter.createCgi(rulesUrl);
    loadRules(function(data, xhr) {
      self.loadingRules = false;
      self.setState({});
      if (!data) {
        return util.showSystemError(xhr);
      }
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
    var loadValues = dataCenter.createCgi(valuesUrl);
    loadValues(function(data, xhr) {
      self.loadingValues = false;
      self.setState({});
      if (!data) {
        return util.showSystemError(xhr);
      }
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
            <span className="glyphicon glyphicon-folder-open" /> {this.loadingValues ? 'Loading' : 'Sync'} Values
          </button>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
    );
  }
});

var SyncDialogWrap = React.createClass({
  shouldComponentUpdate: function() {
    return false;
  },
  show: function(options) {
    this.refs.syncDialog.show(options);
  },
  render: function() {
    return <SyncDialog ref="syncDialog" />;
  }
});

module.exports = SyncDialogWrap;
