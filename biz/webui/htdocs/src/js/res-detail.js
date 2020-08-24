require('./base-css.js');
require('../css/res-detail.css');
var $ = require('jquery');
var React = require('react');
var Table = require('./table');
var Properties = require('./properties');
var util = require('./util');
var BtnGroup = require('./btn-group');
var Textarea = require('./textarea');
var ImageView = require('./image-view');
var JSONViewer = require('./json-viewer');
var COOKIE_HEADERS = ['Name', 'Value', 'Domain', 'Path', 'Expires', 'Max-Age', 'HttpOnly', 'Secure', 'SameSite'];

var ResDetail = React.createClass({
  getInitialState: function() {
    return {
      initedHeaders: false,
      initedTrailers: false,
      initedTextView: false,
      initedPreview: false,
      initedCookies: false,
      initedJSONView: false,
      initedHexView: false,
      initedRaw: false,
      btns: [
        {name: 'Headers'},
        {name: 'Preview'},
        {name: 'TextView', display: 'Body'},
        {name: 'JSONView'},
        {name: 'HexView'},
        {name: 'Cookies'},
        {name: 'Trailers'},
        {name: 'Raw'}
      ]
    };
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onClickBtn: function(btn) {
    this.selectBtn(btn);
    this.setState({});
  },
  selectBtn: function(btn) {
    btn.active = true;
    this.state.btn = btn;
    this.state['inited' + btn.name] = true;
  },
  render: function() {
    var state = this.state;
    var btns = state.btns;
    var btn = state.btn;
    if (!btn) {
      btn = btns[0];
      this.selectBtn(btn);
    }
    var name = btn && btn.name;
    var modal = this.props.modal;
    var res, rawHeaders, rawTrailers, headersStr, trailerStr, headers, trailers, cookies, body, raw, json, tips, defaultName, base64, bin;
    body = raw = '';
    if (modal) {
      res = modal.res;
      defaultName = util.getFilename(modal, true);
      rawHeaders = res.rawHeaders;
      rawTrailers = res.rawTrailers;
      body = util.getBody(res);
      bin = util.getHex(res);
      base64 = res.base64;
      headers = res.headers;
      trailers = res.trailers;
      json = util.getJson(res);
      if (headers && headers['set-cookie']) {
        cookies = headers['set-cookie'];
        if (!$.isArray(cookies)) {
          cookies = typeof cookies == 'string' ? [cookies] : [];
        }
        cookies = cookies.map(function(cookie) {
          cookie = util.parseQueryString(cookie, /;\s*/, null, decodeURIComponent, true);
          var row = ['', '', '', '', '', '', '', '', ''];
          for (var i in cookie) {
            switch(i.toLowerCase()) {
            case 'domain':
              row[2] = cookie[i];
              break;
            case 'path':
              row[3] = cookie[i];
              break;
            case 'expires':
              row[4] = cookie[i];
              break;
            case 'max-age':
              row[5] = cookie[i];
              break;
            case 'httponly':
              row[6] = '√';
              break;
            case 'secure':
              row[7] = '√';
              break;
            case 'samesite':
              row[8] = cookie[i];
              break;
            default:
              if (!row[0]) {
                row[0] = i;
                row[1] = cookie[i];
              }
            }
          }

          return row;
        });
      }
      var imgSrc, data, isJson;
      var isText = true;
      var status = res.statusCode;
      var showImg = name === btns[1].name;
      if (status != null) {
        headersStr = util.objectToString(headers, res.rawHeaderNames);
        trailerStr = trailers ? util.objectToString(trailers, res.rawTrailerNames) : '';
        headersStr = ['HTTP/' + (modal.req.httpVersion || '1.1'), status, util.getStatusMessage(res)].join(' ')
        + '\r\n' + headersStr;
        raw = headersStr + '\r\n\r\n' + body + '\r\n\r\n' + trailerStr;
        var type = util.getContentType(headers);
        isJson = type === 'JSON';
        if (type === 'IMG') {
          imgSrc = body || (res.size ? modal.url : undefined);
          isText = false;
        } else if (showImg && res.base64 && type === 'HTML') {
          data = modal;
          isText = false;
        }
      }
      if (modal.isHttps) {
        tips = !body && { isHttps: true };
      } else if (headers && !body && modal.responseTime && !/^ws/.test(modal.url)) {
        tips = { message: res.size < 5120 ? 'No response body data' : 'Respose data too large to show' };
        tips.url = modal.url;
      }
    }

    state.raw = raw;
    state.body = body;
    if (isText && name === 'Preview') {
      showImg = false;
      if (isJson) {
        name = 'JSONView';
        state.initedJSONView = true;
      } else {
        name = 'TextView';
        state.initedTextView = true;
      }
    }
    base64 = base64 || '';
    return (
      <div className={'fill orient-vertical-box w-detail-content w-detail-response'
        + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
        <BtnGroup onClick={this.onClickBtn} btns={btns} />
        {state.initedHeaders ? <div className={'fill w-detail-response-headers' + (name == btns[0].name ? '' : ' hide')}><Properties modal={rawHeaders || headers} enableViewSource="1" /></div> : undefined}
        {state.initedPreview ? <ImageView imgSrc={imgSrc} data={data} hide={!showImg} /> : undefined}
        {state.initedTextView ? <Textarea defaultName={defaultName} tips={tips} base64={base64} value={body} className="fill w-detail-response-textview" hide={name != btns[2].name} /> : undefined}
        {state.initedJSONView ? <JSONViewer defaultName={defaultName} data={json} hide={name != btns[3].name} /> : undefined}
        {state.initedHexView ? <Textarea defaultName={defaultName} isHexView="1" base64={base64} value={bin} className="fill n-monospace w-detail-response-hex" hide={name != btns[4].name} /> : undefined}
        {state.initedCookies ? <div className={'fill w-detail-response-cookies' + (name == btns[5].name ? '' : ' hide')}>{cookies && cookies.length ? <Table head={COOKIE_HEADERS} modal={cookies} /> : undefined}</div> : undefined}
        {state.initedTrailers ? <div className={'fill w-detail-response-headers' + (name == btns[6].name ? '' : ' hide')}><Properties modal={rawTrailers || trailers} enableViewSource="1" /></div> : undefined}
        {state.initedRaw ? <Textarea defaultName={defaultName} value={raw} headers={headersStr}
          base64={base64} className="fill w-detail-response-raw" hide={name != btns[7].name} /> : undefined}
      </div>
    );
  }
});

module.exports = ResDetail;
