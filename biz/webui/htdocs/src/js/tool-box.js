var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var QRCodeDialog = require('./qrcode-dialog');
var TextDialog = require('./text-dialog');
var storage = require('./storage');
var win = require('./win');
var events = require('./events');

var URL_RE = /^(?:(?:[\w.-]+:)?\/\/)?([\w.-]+)/i;
var NOT_EMPTY_RE = /[^\s]/;
var MAX_QRCODE_LEN = 2048;
var MAX_JSON_LEN = 32768;
var MAX_SAVE_LEN = 5120;
var MAX_TEXT_LEN = 5120;
var MAX_IMAGE_SIZE = 1024 * 1024 * 3;
var findDOMNode = ReactDOM.findDOMNode;

var ToolBox = React.createClass({
  getInitialState: function () {
    return {
      qrcodeValue: util
        .toString(storage.get('qrcodeValue'))
        .substring(0, MAX_QRCODE_LEN),
      jsonValue: util
        .toString(storage.get('jsonValue'))
        .substring(0, MAX_SAVE_LEN),
      codecText: util
        .toString(storage.get('codecText'))
        .substring(0, MAX_TEXT_LEN)
    };
  },
  _saveQRCodeValue: function () {
    storage.set('qrcodeValue', this.state.qrcodeValue);
  },
  saveQRCodeValue: function () {
    clearTimeout(this.qrcodeTimer);
    this.qrcodeTimer = setTimeout(this._saveQRCodeValue, 1000);
  },
  _saveJSONValue: function () {
    var value = this.state.jsonValue;
    if (value.length <= MAX_SAVE_LEN) {
      storage.set('jsonValue', value);
    }
  },
  _saveCodecText: function () {
    var value = this.state.codecText;
    if (value.length <= MAX_TEXT_LEN) {
      storage.set('codecText', value);
    }
  },
  saveCodecText: function () {
    clearTimeout(this.codecTimer);
    this.codecTimer = setTimeout(this._saveCodecText, 1000);
  },
  onJSONChange: function (e) {
    this.setState(
      {
        jsonValue: e.target.value
      },
      this._saveJSONValue
    );
  },
  onForamt: function (e) {
    util.handleFormat(e, this.formatJSON);
    util.handleTab(e);
  },
  onCodecChange: function (e) {
    this.setState(
      {
        codecText: e.target.value
      },
      this._saveCodecText
    );
  },
  generageQRCode: function () {
    this.refs.qrcodeDialog.show(this.state.qrcodeValue);
  },
  parseJSON: function () {
    events.trigger('showJsonViewDialog', this.state.jsonValue);
  },
  formatJSON: function() {
    var value = this.state.jsonValue;
    value = value && util.parseRawJson(value);
    if (!value) {
      return;
    }
    this.setState({
      jsonValue: JSON.stringify(value, null, '  ')
    }, this._saveJSONValue);
  },
  encode: function () {
    try {
      var value = util.toBase64(this.state.codecText);
      this.refs.textDialog.show(value);
    } catch (e) {
      win.alert(e.message);
    }
  },
  decode: function () {
    try {
      var value = util.decodeBase64(this.state.codecText).text;
      this.refs.textDialog.show(value);
    } catch (e) {
      win.alert(e.message);
    }
  },
  uploadFile: function () {
    findDOMNode(this.refs.uploadFile).click();
  },
  readFile: function () {
    var self = this;
    var file = new FormData(findDOMNode(this.refs.uploadFileForm)).get('file');
    if (!(file.size <= MAX_IMAGE_SIZE)) {
      return win.alert('Maximum file size: 3MB');
    }
    var type = 'data:' + file.type + ';base64,';
    util.readFileAsBase64(file, function (base64) {
      findDOMNode(self.refs.uploadFile).value = '';
      self.refs.textDialog.show(type + base64, base64, file.name);
    });
  },
  onQRCodeChange: function (e) {
    this.setState(
      {
        qrcodeValue: e.target.value
      },
      this.saveQRCodeValue
    );
  },
  onDomainChange: function (e) {
    this.setState({
      domainValue: e.target.value
    });
  },
  generateCert: function () {
    window.open(
      'cgi-bin/create-cert?domain=' + encodeURIComponent(this.state.domainValue),
      'downloadTargetFrame'
    );
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
  render: function () {
    var state = this.state;
    var qrcodeValue = state.qrcodeValue;
    var jsonValue = state.jsonValue;
    var domainValue = state.domainValue;
    var codecText = state.codecText;
    var emptyJson = !NOT_EMPTY_RE.test(jsonValue);
    var emptyCodec = !NOT_EMPTY_RE.test(codecText);

    return (
      <div
        className={
          'fill orient-vertical-box w-tool-box ' +
          (this.props.hide ? 'hide' : '')
        }
      >
        <div className="w-detail-inspectors-title">
          <span className="glyphicon glyphicon-qrcode"></span>QRCode
          <button
            className="btn btn-primary"
            disabled={!NOT_EMPTY_RE.test(qrcodeValue)}
            onClick={this.generageQRCode}
          >
            Show
          </button>
        </div>
        <textarea
          onChange={this.onQRCodeChange}
          onKeyDown={util.handleTab}
          value={qrcodeValue}
          className="w-tool-box-ctn"
          maxLength={MAX_QRCODE_LEN}
          placeholder="Enter URL or text"
        />
        <div className="w-detail-inspectors-title">
          <span className="glyphicon glyphicon-pencil"></span>JSON
          <button
            className="btn btn-primary"
            disabled={emptyJson}
            onClick={this.parseJSON}
            style={{marginLeft: 10}}
          >
            Inspect
          </button>
          <button
            className="btn btn-default"
            disabled={emptyJson}
            onClick={this.formatJSON}
          >
            Format
          </button>
        </div>
        <textarea
          onChange={this.onJSONChange}
          value={jsonValue}
          className="w-tool-box-ctn"
          maxLength={MAX_JSON_LEN}
          placeholder="Enter JSON text"
          onKeyDown={this.onForamt}
        />
        <div className="w-detail-inspectors-title" style={{ height: 20 }}>
          <span className="glyphicon glyphicon-eye-close"></span>Base64
          <button
            className="btn btn-primary"
            style={{marginLeft: 10}}
            onClick={this.uploadFile}
          >
            Upload
          </button>
          <button
            className="btn btn-default"
            style={{marginLeft: 10}}
            disabled={emptyCodec}
            onClick={this.encode}
          >
            Encode
          </button>
          <button
            className="btn btn-default"
            disabled={emptyCodec}
            onClick={this.decode}
          >
            Decode
          </button>
        </div>
        <textarea
          onChange={this.onCodecChange}
          onKeyDown={util.handleTab}
          value={codecText}
          className="w-tool-box-ctn"
          maxLength={MAX_TEXT_LEN}
          placeholder="Enter text"
        />
        <div className="w-detail-inspectors-title">
          <span className="glyphicon glyphicon-certificate"></span>Certificate
        </div>
        <div className="box w-generate-cert">
          <input
            className="fill"
            maxLength="256"
            placeholder="Enter certificate domain name"
            value={domainValue}
            onChange={this.onDomainChange}
          />
          <button
            className="btn btn-primary"
            disabled={!domainValue || !URL_RE.test(domainValue)}
            onClick={this.generateCert}
          >
            Download
          </button>
        </div>
        <QRCodeDialog ref="qrcodeDialog" />
        <TextDialog ref="textDialog" />
        <form
          ref="uploadFileForm"
          encType="multipart/form-data"
          style={{ display: 'none' }}
        >
          <input
            ref="uploadFile"
            onChange={this.readFile}
            name="file"
            type="file"
          />
        </form>
      </div>
    );
  }
});

module.exports = ToolBox;
