var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var QRCode = require('qrcode');

var QRCodeDialog = React.createClass({
  shouldComponentUpdate: function() {
    return false;
  },
  show: function(url) {
    if (!url) {
      return;
    }
    var self = this;
    var canvas = ReactDOM.findDOMNode(self.refs.qrcodeCanvas);
    canvas.title = url;
    QRCode.toCanvas(canvas, url, {
      width: 320,
      height: 320,
      margin: 0
    }, function (err) {
      if (err) {
        return alert(err.message);
      }
      ReactDOM.findDOMNode(self.refs.qrcodeUrl).value = url;
      self.refs.qrcodeDialog.show();
    });
  },
  render: function() {
    return (
      <Dialog ref="qrcodeDialog" wstyle="w-qrcode-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <input readOnly ref="qrcodeUrl" />
          <canvas ref="qrcodeCanvas" />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary">Download</button>
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
    );
  }
});

module.exports = QRCodeDialog;
