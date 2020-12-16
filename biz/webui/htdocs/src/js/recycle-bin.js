var React = require('react');
var Dialog = require('./dialog');

var RecycleBinDialog = React.createClass({
  show: function(options) {
    this.refs.recycleBinDialog.show();
  },
  render: function() {
    return (
      <Dialog ref="recycleBinDialog" wstyle="w-recycle-bin-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
    );
  }
});

var RecycleBinDialogWrap = React.createClass({
  shouldComponentUpdate: function() {
    return false;
  },
  show: function(options) {
    this.refs.recycleBinDialog.show(options);
  },
  render: function() {
    return <RecycleBinDialog ref="recycleBinDialog" />;
  }
});

module.exports = RecycleBinDialogWrap;
