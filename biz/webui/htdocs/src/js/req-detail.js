require('./base-css.js');
require('../css/req-detail.css');
var React = require('react');

var json2 = require('./components/json');
var Divider = require('./divider');
var Properties = require('./properties');
var util = require('./util');
var BtnGroup = require('./btn-group');
var JSONViewer = require('./json-viewer');
var Textarea = require('./textarea');

var BTNS = [{name: 'Headers'}, {name: 'TextView'}, {name: 'JSON'}, {name: 'WebForms'}, {name: 'Cookies'}, {name: 'Raw'}];

var ReqDetail = React.createClass({
  getInitialState: function() {
    return {
      initedHeaders: false,
      initedTextView: false,
      initedCookies: false,
      initedWebForms: false,
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
    var req, headers, rawHeaders, cookies, body, raw, query, form, tips, json, defaultName;
    body = raw = '';
    if (modal) {
      req = modal.req;
      rawHeaders = req.rawHeaders;
      defaultName = util.getFilename(modal, true);
      body = req.body || '';
      headers = req.headers;
      if (req.json) {
        json = req.json;
      } else if (json = util.resolveJSON(body, decodeURIComponent)) {
        json = req.json = {
          json: json,
          str: (window._$hasBigNumberJson ? json2 : JSON).stringify(json, null, '    ')
        };
      }
      delete headers.Host;
      cookies = util.parseQueryString(headers.cookie, /;\s*/g, null, decodeURIComponent);
      var url = modal.url;
      var realUrl = modal.realUrl;
      if (!realUrl || !/^(?:http|wss)s?:\/\//.test(realUrl)) {
        realUrl = url;
      }
      var index = realUrl.indexOf('?');
      query = util.parseQueryString(index == -1 ? '' : realUrl.substring(index + 1), null, null, decodeURIComponent);
      if (util.isUrlEncoded(req)) {
        form = util.parseQueryString(req.body, null, null, decodeURIComponent);
      }

      raw = [req.method, req.method == 'CONNECT' ? headers.host : util.getPath(realUrl), 'HTTP/' + (req.httpVersion || '1.1')].join(' ')
          + '\r\n' + util.objectToString(headers, req.rawHeaderNames) + '\r\n\r\n' + body;
      if (modal.isHttps) {
        tips = { isHttps: true };
      } else if (modal.requestTime && !body && !/^ws/.test(modal.url)) {
        if (req.size < 5120) {
          tips = { message: 'No Content' };
        }  else {
          tips = { message: 'Request data too large to display' };
        }
      }
    }
    state.raw = raw;
    state.body = body;

    return (
      <div className={'fill orient-vertical-box w-detail-content w-detail-request' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
        <BtnGroup onClick={this.onClickBtn} btns={BTNS} />
        {state.initedHeaders ? <div className={'fill w-detail-request-headers' + (name == BTNS[0].name ? '' : ' hide')}><Properties modal={rawHeaders || headers} enableViewSource="1" /></div> : ''}
        {state.initedTextView ? <Textarea defaultName={defaultName} tips={tips} value={body} className="fill w-detail-request-textview" hide={name != BTNS[1].name} /> : ''}
        {state.initedJSON ? <JSONViewer defaultName={defaultName} data={json} hide={name != BTNS[2].name} /> : undefined}
        {state.initedWebForms ? <Divider vertical="true" className={'w-detail-request-webforms' + (name == BTNS[3].name ? '' : ' hide')}>
          <div className="fill orient-vertical-box">
            <div className="w-detail-request-webforms-title">
              Query
            </div>
            <div className="fill w-detail-request-query">
              <Properties modal={query} enableViewSource="1" />
            </div>
          </div>
          <div className="fill orient-vertical-box">
            <div className="w-detail-request-webforms-title">
              Body
            </div>
            <div className="fill orient-vertical-box w-detail-request-form">
              <Properties modal={form} enableViewSource="1" />
            </div>
          </div>
        </Divider> : ''}
        {state.initedCookies ? <div className={'fill w-detail-request-cookies' + (name == BTNS[4].name ? '' : ' hide')}><Properties modal={cookies} enableViewSource="1" /></div> : ''}
        {state.initedRaw ? <Textarea defaultName={defaultName} value={raw} className="fill w-detail-request-raw" hide={name != BTNS[5].name} /> : ''}
      </div>
    );
  }
});

module.exports = ReqDetail;


