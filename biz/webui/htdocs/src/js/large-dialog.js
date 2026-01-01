require('../css/large-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var events = require('./events');

var AccountDialog = React.createClass({
  show: function(url) {
    if (url) {
      this.getIframe().src = url;
    }
    this.refs.dialog.show();
  },
  hide: function() {
    this.refs.dialog.hide();
  },
  getIframe: function() {
    return ReactDOM.findDOMNode(this.refs.iframe);
  },
  getWindow: function() {
    return this.getIframe().contentWindow;
  },
  shouldComponentUpdate: function() {
    return false;
  },
  openInNewWin: function() {
    events.trigger('openInNewWin');
  },
  render: function() {
    var props = this.props;
    var className = props.className;
    var hideButton = props.hideButton;

    return (
      <Dialog disableBackdrop={props.disableBackdrop} ref="dialog" wstyle={'w-large-dialog' + (className ? ' ' + className : '')}>
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
