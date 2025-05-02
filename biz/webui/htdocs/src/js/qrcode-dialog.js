var React = require('react');
var Dialog = require('./dialog');
var QRCodeImg = require('./qrcode');

var QRCodeDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  shouldComponentUpdate: function () {
    return this.refs.qrcodeDialog.isVisible();
  },
  show: function (url) {
    this.refs.qrcodeDialog.show();
    this.setState({ url: url });
  },
  render: function () {
    var url = this.state.url;

    return (
      <Dialog ref="qrcodeDialog" wstyle="w-qrcode-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div className="w-qrcode-url-wrap">
            <input readOnly value={url} />
            <span className="glyphicon glyphicon-copy w-copy-text-with-tips" data-clipboard-text={url} />
          </div>
          <QRCodeImg url={this.state.url} />
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Close
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = QRCodeDialog;
