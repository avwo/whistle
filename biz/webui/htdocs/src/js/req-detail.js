require('../css/req-detail.css');
var React = require('react');
var Divider = require('./divider');
var Properties = require('./properties');
var util = require('./util');
var BtnGroup = require('./btn-group');
var JSONViewer = require('./json-viewer');
var Textarea = require('./textarea');
var dataCenter = require('./data-center');
var PluginsTabs = require('./plugins-tabs');
var Tips = require('./panel-tips');

var parseQueryString = util.parseQueryString;
var EMPTY_COOKIES = { message: 'No request cookies' };

var BTNS = [
  { name: 'Raw' },
  { name: 'Headers' },
  { name: 'WebForms' },
  { name: 'TextView', display: 'Body' },
  { name: 'JSONView' },
  { name: 'HexView' },
  { name: 'Cookies' },
  { name: 'Plugins', hide: true }
];
var getHide = util.getHide;

var ReqDetail = React.createClass({
  getInitialState: function () {
    return {
      initedHeaders: false,
      initedTextView: false,
      initedCookies: false,
      initedWebForms: false,
      initedJSONView: false,
      initedHexView: false,
      initedRaw: false,
      initPlugins: false
    };
  },
  componentDidMount: function () {
    var self = this;
    util.on('reqTabsChange', function () {
      self.setState({});
    });
  },
  shouldComponentUpdate: util.scu,
  onClickBtn: function (btn) {
    this.selectBtn(btn);
    this.setState({});
  },
  selectBtn: function (btn) {
    btn.active = true;
    this.state.btn = btn;
    this.state['inited' + btn.name] = true;
  },
  onEdit: function () {
    util.trigger('setComposerData', this.props.modal);
  },
  render: function () {
    var self = this;
    var state = self.state;
    var btn = state.btn;
    if (!btn) {
      btn = BTNS[0];
      self.selectBtn(btn);
    }
    var name = btn && btn.name;
    var modal = self.props.modal;
    var req,
      headers,
      headersStr,
      rawHeaders,
      cookies,
      body,
      raw,
      query,
      form,
      tips,
      json,
      defaultName,
      bin,
      base64;
    body = raw = '';
    if (modal) {
      req = modal.req;
      rawHeaders = req.rawHeaders;
      defaultName = util.getFilename(modal, true);
      body = util.getBody(req, true);
      bin = util.getHex(req);
      base64 = req.base64;
      headers = req.headers;
      json = util.getJson(req, true, decodeURIComponent);
      delete headers.Host;
      cookies = headers.cookie;
      cookies = cookies && parseQueryString(
        cookies,
        /;\s*/g,
        null,
        decodeURIComponent
      );
      var realUrl = util.getRealUrl(modal);
      var index = realUrl.indexOf('?');
      query = index == -1 ? '' : realUrl.substring(index + 1);
      query = query && parseQueryString(
        query,
        null,
        null,
        decodeURIComponent
      );
      if (util.isUrlEncoded(req)) {
        form = parseQueryString(
          util.getBody(req, true),
          null,
          null,
          decodeURIComponent
        );
        if (!window.___hasFormData) {
          form = null;
        }
      } else if (util.isUploadForm(req)) {
        form = util.parseUploadBody(req, true);
      } else if (json && json.isJSONText) {
        form = json;
      }
      headersStr = util.getReqRawHeaders(modal);
      raw = headersStr + '\r\n\r\n' + body;
      if (modal.frames && (!modal.isSse || modal.isCse)) {
        tips = { isFrames: true };
      } else if (modal.isHttps) {
        tips = { isHttps: true };
      } else if (
        modal.requestTime &&
        modal.useFrames !== false &&
        !body &&
        !/^ws/.test(modal.url)
      ) {
        if (req.size < 5120) {
          tips = { message: 'No request body' };
        } else {
          raw += '(Request body exceeds display limit)';
          tips = { message: 'Request body exceeds display limit' };
        }
      }
    }
    state.raw = raw;
    state.body = body;
    base64 = base64 || '';
    var pluginsTab = BTNS[7];
    var tabs = dataCenter.getReqTabs();
    var len = tabs.length;
    pluginsTab.display = undefined;
    pluginsTab.title = undefined;
    pluginsTab.className = undefined;
    pluginsTab.hide = !len;
    if (len && len === 1) {
      pluginsTab.display = pluginsTab.title = tabs[0].name;
      pluginsTab.className = 'w-detail-custom-tab w-req';
    } else {
      pluginsTab.display = undefined;
      pluginsTab.title = undefined;
      pluginsTab.className = undefined;
    }

    return (
      <div
        className={
          'fill v-box w-detail-ctn w-detail-request' +
          util.getHide(util.getBool(self.props.hide))
        }
      >
        <BtnGroup onClick={self.onClickBtn} btns={BTNS} />
        {state.initedRaw ? (
          <Textarea
            session={modal}
            onEdit={self.onEdit}
            reqType="reqRaw"
            defaultName={defaultName}
            value={raw}
            headers={headersStr}
            base64={base64}
            className="fill"
            hide={name != BTNS[0].name}
          />
        ) : null}
        {state.initedHeaders ? (
          <div
            className={
              'fill w-auto' +
              getHide(name != BTNS[1].name)
            }
          >
            <Properties modal={rawHeaders || headers} enableViewSource="1" />
          </div>
        ) : (
          ''
        )}
        {state.initedWebForms ? (
          <Divider
            vertical="true"
            hideRight={!form}
            hideLeft={!query}
            splitRatio={0.6}
            className={getHide(name != BTNS[2].name)}
          >
            <div className="fill v-box">
              <div className="w-detail-webforms-title">Query</div>
              <div className="fill v-box w-auto">
                <Properties modal={query} enableViewSource="1" showJsonView="1" />
              </div>
            </div>
            <div className="fill v-box">
              <div className="w-detail-webforms-title">Body</div>
              <div className="fill v-box w-auto">
                {!json || !json.isJSONText ? <Properties modal={form} richKey="1" enableViewSource="1" showJsonView="1" /> :
                <JSONViewer data={json} session={modal} />}
              </div>
            </div>
          </Divider>
        ) : (
          ''
        )}
        {state.initedTextView ? (
          <Textarea
            defaultName={defaultName}
            tips={tips}
            base64={base64}
            value={body}
            session={modal}
            className="fill"
            hide={name != BTNS[3].name}
          />
        ) : null}
        {state.initedJSONView ? (
          <JSONViewer
            defaultName={defaultName}
            data={json}
            tips={tips}
            session={modal}
            hide={name != BTNS[4].name}
          />
        ) : null}
        {state.initedHexView ? (
          <Textarea
            defaultName={defaultName}
            tips={tips}
            isHexView="1"
            base64={base64}
            value={bin}
            session={modal}
            className="fill n-monospace"
            hide={name != BTNS[5].name}
          />
        ) : null}
        {state.initedCookies ? (
          <div
            className={
              'fill w-auto' +
              getHide(name != BTNS[6].name)
            }
          >
            {
              cookies ? <Properties modal={cookies} enableViewSource="1" /> : (headers ? <Tips data={EMPTY_COOKIES} /> : null)
            }
          </div>
        ) : null}
        {state.initedPlugins ? (
          <PluginsTabs
            tabs={tabs}
            hide={name != pluginsTab.name || pluginsTab.hide}
          />
        ) : null}
      </div>
    );
  }
});

module.exports = ReqDetail;
