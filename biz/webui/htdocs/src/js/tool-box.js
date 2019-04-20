var React = require('react');
var util = require('./util');
var QRCodeDialog = require('./qrcode-dialog');
var storage = require('./storage');

var NOT_EMPTY_RE = /[^\s]/;
var MAX_QRCODE_LEN = 2048;
var MAX_JSON_LEN = 32768;

var ToolBox = React.createClass({
  getInitialState: function() {
    return {
      qrcodeValue: util.toString(storage.get('qrcodeValue')).substring(0, MAX_QRCODE_LEN)
    };
  },
  _saveQRCodeChange: function() {
    storage.set('qrcodeValue', this.state.qrcodeValue);
  },
  saveQRCodeChange: function() {
    clearTimeout(this.qrcodeTimer);
    this.qrcodeTimer = setTimeout(this._saveQRCodeChange, 1000);
  },
  generageQRCode: function() {
    this.refs.qrcodeDialog.show(this.state.qrcodeValue);
  },
  onQRCodeChange: function(e) {
    this.setState({
      qrcodeValue: e.target.value
    }, this.saveQRCodeChange);
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    var state = this.state;
    var qrcodeValue = state.qrcodeValue;
    return (
      <div className={'fill orient-vertical-box w-tool-box ' + (this.props.hide ? 'hide' : '')}>
        <div className="w-detail-inspectors-title">
          QRCode
          <button className="btn btn-primary" disabled={!NOT_EMPTY_RE.test(qrcodeValue)}
          onClick={this.generageQRCode}>Generate</button>
        </div>
        <textarea onChange={this.onQRCodeChange} value={qrcodeValue} className="w-tool-box-ctn"
          maxLength={MAX_QRCODE_LEN} placeholder="Input the URL" />
        <div className="w-detail-inspectors-title">
          JSONView
          <button className="btn btn-primary">Parse</button>
        </div>
        <textarea className="w-tool-box-ctn" maxLength={MAX_JSON_LEN} placeholder="Input the JSON text" />
        <div className="w-detail-inspectors-title">
          URLData
        </div>
        <button className="w-tool-box-ctn w-tool-box-base64">
          <span className="glyphicon glyphicon-arrow-up"></span>
          Click here to upload image (size &lt;= 256k)
        </button>
        <QRCodeDialog ref="qrcodeDialog" />
      </div>
    );
  }
});

module.exports = ToolBox;
