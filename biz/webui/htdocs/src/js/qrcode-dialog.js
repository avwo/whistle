var React = require('react');
var Dialog = require('./dialog');
var QRCodeImg = require('./qrcode');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');
var DismissBtn = require('./dismiss-btn');
var util = require('./util');

var QRCodeDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  shouldComponentUpdate: util.scuDlg,
  show: function (url) {
    this.refs.dialog.show();
    this.setState({ url: url });
  },
  render: function () {
    var url = this.state.url;

    return (
      <Dialog ref="dialog" wstyle="w-qrcode-dialog">
        <div className="modal-body">
          <h4>QR Code</h4>
          <CloseBtn />
          <div className="w-qrcode-url-wrap">
            <input readOnly value={url} />
            <Icon name="copy" className="w-copy-text-with-tips" data-clipboard-text={url} />
          </div>
          <QRCodeImg url={this.state.url} />
        </div>
        <div className="modal-footer">
          <DismissBtn />
        </div>
      </Dialog>
    );
  }
});

module.exports = QRCodeDialog;
