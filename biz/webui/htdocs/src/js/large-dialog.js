require('../css/large-dialog.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var CloseBtn = require('./close-btn');
var Icon = require('./icon');

var LargeDialog = React.createClass({
  show: function(url) {
    if (url) {
      var iframe = this.getIframe();
      iframe.onload = dataCenter.handleIframeLoad;
      if (url === 'editor.html') {
        iframe.setAttribute('data-type', 'fake');
      }
      iframe.src = url;
    }
    this.refs.dialog.show();
  },
  hide: function() {
    this.refs.dialog.hide();
  },
  getIframe: function() {
    return findDOMNode(this.refs.iframe);
  },
  getWindow: function() {
    return this.getIframe().contentWindow;
  },
  shouldComponentUpdate: function() {
    return false;
  },
  openInNewWin: function() {
    var openInNewWin = this.props.openInNewWin;
    if (openInNewWin) {
      openInNewWin(this.getWindow());
    } else {
      window.open(this.getIframe().src);
    }
  },
  render: function() {
    var props = this.props;
    var className = props.className;
    var hideButton = props.hideButton;

    return (
      <Dialog ref="dialog" wstyle={'w-large-dialog' + (className ? ' ' + className : '')}>
        {hideButton ? null : <Icon className="w-open-win-btn" onClick={this.openInNewWin} name="new-window" title="Open in new window" />}
        <CloseBtn />
        <div className="modal-body w-fix-drag">
          <iframe ref="iframe" className="modal-body" />
        </div>
      </Dialog>
    );
  }
});

module.exports = LargeDialog;
