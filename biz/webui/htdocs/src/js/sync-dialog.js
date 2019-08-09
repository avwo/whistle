var React = require('react');
var Dialog = require('./dialog');
require('../css/sync-dialog.css');

var SyncDialog = React.createClass({
  show: function(options) {
    var self = this;
    this.syncOptions = options;
    self.refs.syncDialog.show();
  },
  render: function() {
    return (
      <Dialog ref="syncDialog" wstyle="w-sync-dialog">
        <div className="modal-body">
          <button type="button" className="btn btn-primary">
            <span className="glyphicon glyphicon-list" /> Sync Rules
          </button>
          <button type="button" className="btn btn-default">
            <span className="glyphicon glyphicon-folder-open" /> Sync Values
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
