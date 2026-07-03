var React = require('react');
var util = require('./util');
var QRCodeDialog = require('./qrcode-dialog');
var TextDialog = require('./text-dialog');
var storage = require('./storage');
var win = require('./win');
var Icon = require('./icon');
var UploadForm = require('./upload-form');

var URL_RE = /^(?:(?:[\w.-]+:)?\/\/)?([\w.-]+)/i;
var MAX_QRCODE_LEN = 2048;
var MAX_JSON_LEN = 32768;
var MAX_SAVE_LEN = 5120;
var MAX_TEXT_LEN = 5120;
var MAX_IMAGE_SIZE = 1024 * 1024 * 3;
var handleTab = util.handleTab;
var EXCEED_TIPS = util.EXCEED_TIPS + ' 3MB';

var notEmpty = util.notEmpty;

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
    var self = this;
    clearTimeout(self.qrcodeTimer);
    self.qrcodeTimer = setTimeout(self._saveQRCodeValue, 1000);
  },
  _saveValue: function (name, maxLen) {
    var value = this.state[name];
    if (value.length <= maxLen) {
      storage.set(name, value);
    }
  },
  _saveJSONValue: function () {
    this._saveValue('jsonValue', MAX_SAVE_LEN);
  },
  _saveCodecText: function () {
    this._saveValue('codecText', MAX_TEXT_LEN);
  },
  saveCodecText: function () {
    var self = this;
    clearTimeout(self.codecTimer);
    self.codecTimer = setTimeout(self._saveCodecText, 1000);
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
    handleTab(e);
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
    util.trigger('showJsonViewDialog', this.state.jsonValue);
  },
  formatJSON: function() {
    var self = this;
    var value = self.state.jsonValue;
    value = value && util.parseRawJson(value);
    if (!value) {
      return;
    }
    self.setState({
      jsonValue: util.stringify(value)
    }, self._saveJSONValue);
  },
  encode: function () {
    var self = this;
    try {
      var value = util.toBase64(self.state.codecText);
      self.refs.textDialog.show(value);
    } catch (e) {
      win.alert(e.message);
    }
  },
  decode: function () {
    var self = this;
    try {
      var value = util.decodeBase64(self.state.codecText).text;
      self.refs.textDialog.show(value);
    } catch (e) {
      win.alert(e.message);
    }
  },
  uploadFile: function () {
    this.refs.uploadForm.getInput().click();
  },
  readFile: function () {
    var self = this;
    var uploadForm = self.refs.uploadForm;
    var file = new FormData(uploadForm.getForm()).get('file');
    if (!(file.size <= MAX_IMAGE_SIZE)) {
      return win.alert(EXCEED_TIPS);
    }
    var type = 'data:' + file.type + ';base64,';
    util.readFileAsBase64(file, function (base64) {
      uploadForm.getInput().value = '';
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
  shouldComponentUpdate: util.scu,
  render: function () {
    var self = this;
    var state = self.state;
    var qrcodeValue = state.qrcodeValue;
    var jsonValue = state.jsonValue;
    var domainValue = state.domainValue;
    var codecText = state.codecText;
    var emptyJson = !notEmpty(jsonValue);
    var emptyCodec = !notEmpty(codecText);

    return (
      <div
        className={
          'fill v-box w-tool-box' +
          util.getHide(self.props.hide)
        }
      >
        <div className="w-inspectors-title">
          <Icon name="qrcode" />QRCode
          <button
            className="btn btn-primary"
            disabled={!notEmpty(qrcodeValue)}
            onClick={self.generageQRCode}
          >
            Show
          </button>
        </div>
        <textarea
          onChange={self.onQRCodeChange}
          onKeyDown={handleTab}
          value={qrcodeValue}
          className="w-tool-box-ctn"
          maxLength={MAX_QRCODE_LEN}
          placeholder="Enter request URL or any plain text"
        />
        <div className="w-inspectors-title">
          <Icon name="pencil" />JSON
          <button
            className="btn btn-primary ml-10"
            disabled={emptyJson}
            onClick={self.parseJSON}
          >
            Inspect
          </button>
          <button
            className="btn btn-default"
            disabled={emptyJson}
            onClick={self.formatJSON}
          >
            Format
          </button>
        </div>
        <textarea
          onChange={self.onJSONChange}
          value={jsonValue}
          className="w-tool-box-ctn"
          maxLength={MAX_JSON_LEN}
          placeholder="Enter JSON text"
          onKeyDown={self.onForamt}
        />
        <div className="w-inspectors-title" style={{ height: 20 }}>
          <Icon name="eye-close" />Base64
          <button
            className="btn btn-primary ml-10"
            onClick={self.uploadFile}
          >
            Upload
          </button>
          <button
            className="btn btn-default ml-10"
            disabled={emptyCodec}
            onClick={self.encode}
          >
            Encode
          </button>
          <button
            className="btn btn-default"
            disabled={emptyCodec}
            onClick={self.decode}
          >
            Decode
          </button>
        </div>
        <textarea
          onChange={self.onCodecChange}
          onKeyDown={handleTab}
          value={codecText}
          className="w-tool-box-ctn"
          maxLength={MAX_TEXT_LEN}
          placeholder="Enter text"
        />
        <div className="w-inspectors-title">
          <Icon name="certificate" />Certificate
        </div>
        <div className="box w-generate-cert">
          <input
            className="fill"
            maxLength="256"
            placeholder="Enter certificate domain name"
            value={domainValue}
            onChange={self.onDomainChange}
          />
          <button
            className="btn btn-primary"
            disabled={!domainValue || !URL_RE.test(domainValue)}
            onClick={self.generateCert}
          >
            Download
          </button>
        </div>
        <QRCodeDialog ref="qrcodeDialog" />
        <TextDialog ref="textDialog" />
        <UploadForm ref="uploadForm" name="file" onChange={self.readFile} />
      </div>
    );
  }
});

module.exports = ToolBox;
