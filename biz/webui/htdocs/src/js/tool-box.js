var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var QRCodeDialog = require('./qrcode-dialog');
var TextDialog = require('./text-dialog');
var JSONDialog = require('./json-dialog');
var storage = require('./storage');

var URL_RE = /^(?:(?:[\w.-]+:)?\/\/)?([\w.-]+)/i;
var NOT_EMPTY_RE = /[^\s]/;
var MAX_QRCODE_LEN = 2048;
var MAX_JSON_LEN = 32768;
var MAX_SAVE_LEN = 5120;
var MAX_IMAGE_SIZE = 1024 * 1024;

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
    this.refs.jsonDialog.show(this.state.jsonValue);
  },
  uploadImg: function() {
    ReactDOM.findDOMNode(this.refs.uploadImg).click();
  },
  readImg: function() {
    var self = this;
    var image = new FormData(ReactDOM.findDOMNode(this.refs.uploadImgForm)).get('image');
    if (!(image.size <= MAX_IMAGE_SIZE)) {
      return alert('The file size cannot exceed 1m.');
    }
    var type = 'data:' + image.type + ';base64,';
    util.readFileAsBase64(image, function(base64) {
      ReactDOM.findDOMNode(self.refs.uploadImg).value = '';
      self.refs.textDialog.show(type + base64, base64, image.name);
    });
  },
  onQRCodeChange: function(e) {
    this.setState({
      qrcodeValue: e.target.value
    }, this.saveQRCodeValue);
  },
  onDomainChange: function(e) {
    this.setState({
      domainValue: e.target.value
    });
  },
  generateCert: function() {
    window.open('cgi-bin/create-cert?domain=' + this.state.domainValue, 'downloadTargetFrame');
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    var state = this.state;
    var qrcodeValue = state.qrcodeValue;
    var jsonValue = state.jsonValue;
    var domainValue = state.domainValue;
    return (
      <div className={'fill orient-vertical-box w-tool-box ' + (this.props.hide ? 'hide' : '')}>
        <div className="w-detail-inspectors-title">
          <span className="glyphicon glyphicon-qrcode"></span>QRCode
          <button className="btn btn-primary" disabled={!NOT_EMPTY_RE.test(qrcodeValue)}
          onClick={this.generageQRCode}>Confirm</button>
        </div>
        <textarea onChange={this.onQRCodeChange} value={qrcodeValue} className="w-tool-box-ctn"
          maxLength={MAX_QRCODE_LEN} placeholder="Input the URL" />
        <div className="w-detail-inspectors-title">
          <span className="glyphicon glyphicon-pencil"></span>JSONView
          <button className="btn btn-primary" disabled={!NOT_EMPTY_RE.test(jsonValue)}
            onClick={this.parseJSON}>Parse</button>
        </div>
        <textarea onChange={this.onJSONChange} value={jsonValue} className="w-tool-box-ctn"
          maxLength={MAX_JSON_LEN} placeholder="Input the JSON text" />
        <div className="w-detail-inspectors-title">
          <span className="glyphicon glyphicon-picture"></span>Base64
          <button className="btn btn-primary" onClick={this.uploadImg}>Upload</button>
        </div>
        <button className="w-tool-box-ctn w-tool-box-base64" onClick={this.uploadImg}>
          <span className="glyphicon glyphicon-arrow-up"></span>
          Click here to upload image (size &lt;= 1m)
        </button>
        <div className="w-detail-inspectors-title">
          <span className="glyphicon glyphicon-certificate"></span>Certificate
        </div>
        <div className="box w-generate-cert">
          <input className="fill" maxLength="64" placeholder="Input the domain name of the certificate" value={domainValue} onChange={this.onDomainChange} />
          <button className="btn btn-primary" disabled={!domainValue || !URL_RE.test(domainValue)} onClick={this.generateCert}>Generate</button>
        </div>
        <QRCodeDialog ref="qrcodeDialog" />
        <TextDialog ref="textDialog" />
        <JSONDialog ref="jsonDialog" />
        <form ref="uploadImgForm" encType="multipart/form-data" style={{display: 'none'}}>
          <input ref="uploadImg" onChange={this.readImg} name="image" type="file" accept="image/*" />
        </form>
      </div>
    );
  }
});

module.exports = ToolBox;
