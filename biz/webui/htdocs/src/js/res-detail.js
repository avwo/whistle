require('./base-css.js');
require('../css/res-detail.css');
var $ = require('jquery');
var React = require('react');

var json2 = require('./components/json');
var Table = require('./table');
var Properties = require('./properties');
var util = require('./util');
var BtnGroup = require('./btn-group');
var Textarea = require('./textarea');
var Frames = require('./frames');
var ImageView = require('./image-view');
var JSONViewer = require('./json-viewer');
var BTNS = [
  {name: 'Headers'},
  {name: 'TextView'},
  {name: 'JSON'},
  {name: 'Frames'},
  {name: 'ImageView'},
  {name: 'Cookies'},
  {name: 'Raw'}
];
var COOKIE_HEADERS = ['Name', 'Value', 'Domain', 'Path', 'Expires', 'Max-Age', 'HttpOnly', 'Secure'];

var ResDetail = React.createClass({
  getInitialState: function() {
    return {
      initedHeaders: false,
      initedTextView: false,
      initedFrames: false,
      initedImageView: false,
      initedCookies: false,
      initedJSON: false,
      initedRaw: false
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
    var btn = state.btn;
    if (!btn) {
      btn = BTNS[0];
      this.selectBtn(btn);
    }
    var name = btn && btn.name;
    var modal = this.props.modal;
    var res, rawHeaders, headers, cookies, body, frames, raw, json, tips, cId, defaultName;
    body = raw = '';
    if (modal) {
      res = modal.res;
      cId = modal.cId;
      defaultName = util.getFilename(modal, true);
      rawHeaders = res.rawHeaders;
      body = res.body || '';
      if (!modal.reqError && !modal.resError) {
        frames = modal.frames;
      }
      headers = res.headers;
      if (res.json) {
        json = res.json;
      } else if (json = util.resolveJSON(body)) {
        json = res.json = {
          json: json,
          str: (window._$hasBigNumberJson ? json2 : JSON).stringify(json, null, '    ')
        };
      }
      if (headers && headers['set-cookie']) {
        cookies = headers['set-cookie'];
        if (!$.isArray(cookies)) {
          cookies = typeof cookies == 'string' ? [cookies] : [];
        }
        cookies = cookies.map(function(cookie) {
          cookie = util.parseQueryString(cookie, /;\s*/, null, decodeURIComponent, true);
          var row = ['', '', '', '', '', '', '', ''];
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
      var imgSrc;
      var status = res.statusCode;
      if (status != null) {
        raw = ['HTTP/' + (modal.req.httpVersion || '1.1'), status, util.getStatusMessage(res)].join(' ')
            + '\r\n' + util.objectToString(headers, res.rawHeaderNames) + '\r\n\r\n' + body;
        if ((status == 200 || status == 304) && util.getContentType(headers) === 'IMG') {
          imgSrc = modal.url;
        }
      }
      if (modal.isHttps) {
        tips = { isHttps: true };
      } else if (headers && !body && modal.responseTime && !/^ws/.test(modal.url)) {
        if (!res.size || util.isText(headers['content-type'])) {
          tips = { message: res.size < 5120 ? 'No Content' : 'Respose data too large to display' };
        } else {
          tips = { message: modal.type || 'Non Text' };
        }
        tips.url = modal.url;
      }
    }

    state.raw = raw;
    state.body = body;

    return (
      <div className={'fill orient-vertical-box w-detail-content w-detail-response'
        + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
        <BtnGroup onClick={this.onClickBtn} btns={BTNS} />
        {state.initedHeaders ? <div className={'fill w-detail-response-headers' + (name == BTNS[0].name ? '' : ' hide')}><Properties modal={rawHeaders || headers} enableViewSource="1" /></div> : undefined}
        {state.initedTextView ? <Textarea defaultName={defaultName} tips={tips} value={body} className="fill w-detail-response-textview" hide={name != BTNS[1].name} /> : undefined}
        {state.initedJSON ? <JSONViewer defaultName={defaultName} data={json} hide={name != BTNS[2].name} /> : undefined}
        {state.initedFrames ? <Frames data={modal} cId={cId} frames={frames} hide={name != BTNS[3].name} /> : undefined}
        {state.initedImageView ? <ImageView imgSrc={imgSrc} hide={name != BTNS[4].name} /> : undefined}
        {state.initedCookies ? <div className={'fill w-detail-response-cookies' + (name == BTNS[5].name ? '' : ' hide')}>{cookies && cookies.length ? <Table head={COOKIE_HEADERS} modal={cookies} /> : undefined}</div> : undefined}
        {state.initedRaw ? <Textarea defaultName={defaultName} value={raw} className="fill w-detail-response-raw" hide={name != BTNS[6].name} /> : undefined}
      </div>
    );
  }
});

module.exports = ResDetail;
