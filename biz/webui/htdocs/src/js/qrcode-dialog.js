var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var QRCode = require('qrcode');
var events = require('./events');
var win = require('./win');

var QRCodeDialog = React.createClass({
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (url) {
    if (!url) {
      return;
    }
    var self = this;
    QRCode.toDataURL(
      url,
      {
        width: 320,
        height: 320,
        margin: 0
      },
      function (err, result) {
        if (err) {
          return win.alert(err.message);
        }
        var img = ReactDOM.findDOMNode(self.refs.qrcodeImg);
        img.title = url;
        img.src = result;
        ReactDOM.findDOMNode(self.refs.qrcodeUrl).value = url;
        self.refs.qrcodeDialog.show();
        self.result = result.substring(result.indexOf(',') + 1);
      }
    );
  },
  download: function () {
    events.trigger('download', {
      base64: this.result,
      name: 'qrcode.png'
    });
  },
  render: function () {
    return (
      <Dialog ref="qrcodeDialog" wstyle="w-qrcode-dialog">
        <div className="modal-body">
          <button type="button" className="btn-close" data-bs-dismiss="modal">

          </button>
          <input readOnly ref="qrcodeUrl" />
          <img
            ref="qrcodeImg"
            onDoubleClick={this.download}
            style={{ width: 320, height: 320 }}
          />
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.download}
          >
            Download
          </button>
          <button
            type="button"
            className="btn btn-default"
            data-bs-dismiss="modal"
          >
            Close
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = QRCodeDialog;
