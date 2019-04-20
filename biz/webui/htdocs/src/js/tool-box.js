var React = require('react');
var util = require('./util');
var QRCodeDialog = require('./qrcode-dialog');
var storage = require('./storage');

var NOT_EMPTY_RE = /[^\s]/;
var MAX_QRCODE_LEN = 2048;
var MAX_JSON_LEN = 32768;
var MAX_SAVE_LEN = 5120;

var ToolBox = React.createClass({
  getInitialState: function() {
    return {
      qrcodeValue: util.toString(storage.get('qrcodeValue')).substring(0, MAX_QRCODE_LEN),
      jsonValue: util.toString(storage.get('jsonValue')).substring(0, MAX_SAVE_LEN)
    };
  },
  _saveQRCodeValue: function() {
    storage.set('qrcodeValue', this.state.qrcodeValue);
  },
  saveQRCodeValue: function() {
    clearTimeout(this.qrcodeTimer);
    this.qrcodeTimer = setTimeout(this._saveQRCodeValue, 1000);
  },
  _saveJSONValue: function() {
    var value = this.state.jsonValue;
    if (value.length <= MAX_SAVE_LEN) {
      storage.set('jsonValue', value);
    }
  },
  saveJSONValue: function() {
    clearTimeout(this.jsonTimer);
    this.jsonTimer = setTimeout(this._saveJSONValue, 1000);
  },
  onJSONChange: function(e) {
    this.setState({
      jsonValue: e.target.value
    }, this._saveJSONValue);
  },
  generageQRCode: function() {
    this.refs.qrcodeDialog.show(this.state.qrcodeValue);
  },
  parseJSON: function() {
    alert(this.state.jsonValue);
  },
  onQRCodeChange: function(e) {
    this.setState({
      qrcodeValue: e.target.value
    }, this.saveQRCodeValue);
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    var state = this.state;
    var qrcodeValue = state.qrcodeValue;
    var jsonValue = state.jsonValue;
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
          <button className="btn btn-primary" disabled={!NOT_EMPTY_RE.test(jsonValue)}
            onClick={this.parseJSON}>Parse</button>
        </div>
        <textarea onChange={this.onJSONChange} value={jsonValue} className="w-tool-box-ctn"
          maxLength={MAX_JSON_LEN} placeholder="Input the JSON text" />
        <div className="w-detail-inspectors-title">
          Base64
        </div>
        <button className="w-tool-box-ctn w-tool-box-base64">
          <span className="glyphicon glyphicon-arrow-up"></span>
          Click here to upload image (size &lt;= 1m)
        </button>
        <QRCodeDialog ref="qrcodeDialog" />
      </div>
    );
  }
});

module.exports = ToolBox;
