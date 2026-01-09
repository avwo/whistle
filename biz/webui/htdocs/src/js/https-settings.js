var React = require('react');
var CertsInfoDialog = require('./certs-info-dialog');
var QRCodeImg = require('./qrcode');
var dataCenter = require('./data-center');
var storage = require('./storage');
var util = require('./util');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var events = require('./events');

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
    $(ReactDOM.findDOMNode(this.refs.rootCADialog)).modal('show');
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
        util.showSystemError(xhr);
        return;
      }
      self.refs.certsInfoDialog.show(data.certs, data.dir);
    });
  },
  componentDidMount: function() {
    events.on('showCustomCerts', this.showCustomCertsInfo);
  },
  render: function() {
    var props = this.props;
    var caHash = props.caHash;
    var port = props.port;
    var caUrlList = props.caUrlList;
    var multiEnv = props.multiEnv;
    var interceptHttpsConnects = props.interceptHttpsConnects;
    var enableHttp2 = props.enableHttp2;
    var onEnableHttps = props.onEnableHttps;
    var onEnableHttp2 = props.onEnableHttp2;
    var state = this.state;
    var caType = state.caType;
    var caFullUrl = state.caFullUrl;
    var caUrl = 'cgi-bin/rootca';
    var caShortUrl = 'http://rootca.pro/';

    if (caType !== 'cer') {
      caUrl += '?type=' + caType;
      caShortUrl += caType;
    }

    return (
      <div ref="rootCADialog" className="modal fade w-https-dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <div style={{marginBottom: 10}}>
                  <a
                    className="w-help-menu"
                    title="Click here to learn how to install root ca"
                    href={util.getDocUrl('gui/https.html')}
                    target="_blank"
                  >
                    <span className="glyphicon glyphicon-question-sign"></span>
                  </a>
                  <a
                    className="w-download-rootca"
                    title={caShortUrl}
                    href={caUrl}
                    target="downloadTargetFrame"
                  >
                    Download RootCA
                  </a>
                  <select className="w-root-ca-type" value={caType} onChange={this.selectCAType}>
                    <option value="crt">rootCA.crt</option>
                    <option value="cer">rootCA.cer</option>
                    <option value="pem">rootCA.pem</option>
                  </select>
                </div>
                <div className="w-root-ca-url-wrap">
                  <select className="w-root-ca-url" value={caFullUrl} onChange={this.selectCAUrl}>
                    <option value="">{caShortUrl} (PROXY REQUIRED)</option>
                    {caUrlList.map(function (url) {
                      url = url[0] === 'h' ? url : 'http://' + url + ':' + port;
                      url += '/cgi-bin/rootca' + (caType === 'cer' ? '' : '?type=' + caType);
                      return <option value={url}>{url}</option>;
                    })}
                  </select>
                  <span title="Copy Root CA URL" className="glyphicon glyphicon-copy w-copy-text-with-tips" data-clipboard-text={caFullUrl || caShortUrl} />
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
                          : undefined
                      }
                    >
                      <input
                        disabled={multiEnv}
                        checked={interceptHttpsConnects}
                        onChange={onEnableHttps}
                        type="checkbox"
                         className="w-va-mdl"
                      />
                      <span className="w-va-mdl w-mrl-5">
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
                        className="w-va-mdl"
                      />
                    <span className="w-va-mdl w-mrl-5">
                      Enable HTTP/2
                    </span>
                    </label>
                  </p>
                  <a
                    draggable="false"
                    style={{
                      color: dataCenter.hasInvalidCerts ? 'red' : undefined
                    }}
                    onClick={this.showCustomCertsInfo}
                  >
                    View Custom Certs
                  </a>
                  <CertsInfoDialog ref="certsInfoDialog" />
                </div>
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
            </div>
          </div>
        </div>
    );
  }
});

module.exports = HttpsSettings;
