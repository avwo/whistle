require('../css/account.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');

var AccountDialog = React.createClass({
  show: function(url) {
    if (url) {
      ReactDOM.findDOMNode(this.refs.iframe).src = url;
    }
    this.refs.dialog.show();
  },
  hide: function() {
    this.refs.dialog.hide();
  },
  shouldComponentUpdate: function() {
    return false;
  },
  render: function() {
    var className = this.props.className;
    return (
      <Dialog ref="dialog" wstyle={'w-account-dialog' + (className ? ' ' + className : '')}>
        <button
          type="button"
          className="close"
          data-dismiss="modal"
          aria-label="Close"
        >&times;</button>
        <iframe ref="iframe" className="modal-body" />
      </Dialog>
    );
  }
});

module.exports = AccountDialog;
