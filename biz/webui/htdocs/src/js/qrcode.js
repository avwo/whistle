var React = require('react');
var QRCode = require('qrcode');

function getSize(size) {
  return size > 0 ? size : 320;
}

function getDataURL(options, cb) {
  QRCode.toDataURL(
    options.url,
    {
      width: getSize(options.width),
      height: getSize(options.height),
      margin: 0
    },
    function (err, dataURL) {
      cb(err, dataURL);
    }
  );
}

var QRCodeImg = React.createClass({
  getInitialState: function () {
    return {};
  },
  renderQRCode: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    if (!props.url) {
      state.dataURL = null;
      state.error = null;
      return;
    }
    if (props.url == state.url) {
      return;
    }
    getDataURL(props, function (err, dataURL) {
      state.url = props.url;
      state.error = err;
      state.dataURL = dataURL;
      self.setState({});
    });
  },
  renderError: function () {
    var error = this.state.error;
    if (!error) {
      return this.props.url ? 'Generating...' : null;
    }
    return (
      <div className="w-qrcode-error">
        {error.message || 'Error occurred.'}
      </div>
    );
  },
  render: function () {
    this.renderQRCode();
    var state = this.state;
    var props = this.props;
    var dataURL = state.dataURL;
    var size = { width: getSize(props.width), height: getSize(props.width) };

    return (
      <div className="w-qrcode-wrap" style={size}>
        {dataURL ? <img src={dataURL} /> : this.renderError()}
      </div>
    );
  }
});

module.exports = QRCodeImg;
