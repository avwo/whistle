require('../css/large-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var events = require('./events');

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
  openInNewWin: function() {
    events.trigger('openInNewWin');
  },
  render: function() {
    var className = this.props.className;
    var hideButton = this.props.hideButton;

    return (
      <Dialog ref="dialog" wstyle={'w-large-dialog' + (className ? ' ' + className : '')}>
        {hideButton ? null : <a className="w-open-win-btn" onClick={this.openInNewWin}>Open In New Window</a>}
        <button
          type="button"
          className="close"
          data-dismiss="modal"
          aria-label="Close"
        >&times;</button>
        <div className="modal-body w-fix-drag">
          <iframe ref="iframe" className="modal-body" />
        </div>
      </Dialog>
    );
  }
});

module.exports = AccountDialog;
