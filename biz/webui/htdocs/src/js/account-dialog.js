require('../css/account.css');
var React = require('react');
var $ = require('jquery');
var Dialog = require('./dialog');

var AccountDialog = React.createClass({
  show: function(url) {
    if (url) {
      $('.w-account-dialog iframe')[0].src = url;
      this.refs.dialog.show();
    }
  },
  hide: function() {
    this.refs.dialog.hide();
  },
  shouldComponentUpdate: function() {
    return false;
  },
  render: function() {
    return (
      <Dialog ref="dialog" wstyle="w-account-dialog">
        <button
          type="button"
          className="close"
          data-dismiss="modal"
          aria-label="Close"
        >&times;</button>
        <iframe className="modal-body" />
      </Dialog>
    );
  }
});

module.exports = AccountDialog;
