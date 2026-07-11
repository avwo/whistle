var React = require('react');
var CertsInfoDialog = require('./certs-info-dialog');
var QRCodeImg = require('./qrcode');
var dataCenter = require('./data-center');
var storage = require('./storage');
var util = require('./util');
var Icon = require('./icon');
var HelpIcon = require('./help-icon');
var CloseBtn = require('./close-btn');
var DismissBtn = require('./dismiss-btn');
var Dialog = require('./dialog');

function getCAType(type) {
  if (type === 'crt' || type === 'pem') {
    return type;
  }
  return 'cer';
}

var HttpsSettings = React.createClass({
  getInitialState: function() {
    return {
      caType: getCAType(storage.get('caType'))
    };
  },
  selectCAType: function(e) {
    var caType = getCAType(e.target.value);
    this.setState({ caType: caType });
    storage.set('caType', caType);
  },
  selectCAUrl: function(e) {
    this.setState({ caFullUrl: e.target.value });
  },
  show: function() {
    this.refs.dialog.show();
  },
  showCustomCertsInfo: function () {
    var self = this;
    if (self.loadingCerts) {
      return;
    }
    self.loadingCerts = true;
    dataCenter.certs.all(function (data, xhr) {
      self.loadingCerts = false;
      if (!data) {
        util.showSysErr(xhr);
        return;
      }
      self.refs.certsInfo.show(data.certs, data.dir);
    });
  },
  shouldComponentUpdate: util.scuDlg,
  componentDidMount: function() {
    util.on('showCustomCerts', this.showCustomCertsInfo);
  },
  render: function() {
    var self = this;
    var props = self.props;
    var caHash = props.caHash;
    var port = props.port;
    var caUrlList = props.caUrlList;
    var multiEnv = props.multiEnv;
    var interceptHttpsConnects = props.interceptHttpsConnects;
    var enableHttp2 = props.enableHttp2;
    var onEnableHttps = props.onEnableHttps;
    var onEnableHttp2 = props.onEnableHttp2;
    var state = self.state;
    var caType = state.caType;
    var caFullUrl = state.caFullUrl;
    var caUrl = 'cgi-bin/rootca';
    var caShortUrl = 'http://rootca.pro/';

    if (caType !== 'cer') {
      caUrl += '?type=' + caType;
      caShortUrl += caType;
    }

    return (
      <Dialog ref="dialog" wstyle="w-https-dialog">
          <div className="modal-body">
            <CloseBtn />
            <div style={{marginBottom: 10}}>
              <HelpIcon docsUrl="gui/https.html" />
              <a
                className="w-download-rootca"
                title={caShortUrl}
                href={caUrl}
                target="downloadTargetFrame"
              >
                Download RootCA
              </a>
              <select className="w-root-ca-type" value={caType} onChange={self.selectCAType}>
                <option value="crt">rootCA.crt</option>
                <option value="cer">rootCA.cer</option>
                <option value="pem">rootCA.pem</option>
              </select>
            </div>
            <div className="w-root-ca-url-wrap">
              <select className="w-root-ca-url" value={caFullUrl} onChange={self.selectCAUrl}>
                <option value="">{caShortUrl} (PROXY REQUIRED)</option>
                {caUrlList.map(function (url) {
                  url = url[0] === 'h' ? url : 'http://' + url + ':' + port;
                  url += '/cgi-bin/rootca' + (caType === 'cer' ? '' : '?type=' + caType);
                  return <option value={url}>{url}</option>;
                })}
              </select>
              <Icon title="Copy Root CA URL" name="copy" className="w-copy-text-with-tips" data-clipboard-text={caFullUrl || caShortUrl} />
            </div>
            <a
              href={caUrl}
              target="downloadTargetFrame"
            >
              <QRCodeImg url={caFullUrl || caShortUrl + caHash} />
            </a>
            <div className="w-https-settings">
              <p>
                <label
                  title={
                    multiEnv
                      ? 'Use \'pattern enable://capture\' in rules to enable HTTPS'
                      : null
                  }
                >
                  <input
                    disabled={multiEnv}
                    checked={interceptHttpsConnects}
                    onChange={onEnableHttps}
                    type="checkbox"
                    className="w-vm"
                  />
                  <span className="w-vm w-mrl-5">
                    Enable HTTPS (Capture Tunnel Traffic)
                  </span>
                </label>
              </p>
              <p>
                <label>
                  <input
                    checked={dataCenter.supportH2 && enableHttp2}
                    onChange={onEnableHttp2}
                    type="checkbox"
                    className="w-vm"
                  />
                <span className="w-vm w-mrl-5">
                  Enable HTTP/2
                </span>
                </label>
              </p>
              <a
                draggable="false"
                style={{
                  color: dataCenter.hasInvalidCerts ? 'var(--c-error)' : null
                }}
                onClick={self.showCustomCertsInfo}
              >
                Custom Certs Settings
              </a>
              <CertsInfoDialog ref="certsInfo" />
            </div>
          </div>
          <div className="modal-footer">
            <DismissBtn />
          </div>
        </Dialog>
    );
  }
});

module.exports = HttpsSettings;
