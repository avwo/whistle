require('../css/res-detail.css');
var React = require('react');
var Table = require('./table');
var Properties = require('./properties');
var util = require('./util');
var BtnGroup = require('./btn-group');
var Textarea = require('./textarea');
var ImageView = require('./image-view');
var JSONViewer = require('./json-viewer');
var dataCenter = require('./data-center');
var PluginsTabs = require('./plugins-tabs');
var Tips = require('./panel-tips');

var COOKIE_HEADERS = [
  'Name',
  'Value',
  'Domain',
  'Path',
  'Expires',
  'Max-Age',
  'HttpOnly',
  'Secure',
  'SameSite',
  'Partitioned'
];
var EMPTY_COOKIES = { message: 'No response cookies' };
var getHide = util.getHide;

var ResDetail = React.createClass({
  getInitialState: function () {
    return {
      initedHeaders: false,
      initedTrailers: false,
      initedTextView: false,
      initedPreview: false,
      initedCookies: false,
      initedJSONView: false,
      initedHexView: false,
      initedRaw: false,
      initPlugins: false,
      btns: [
        { name: 'Raw' },
        { name: 'Headers' },
        { name: 'Preview' },
        { name: 'TextView', display: 'Body' },
        { name: 'JSONView' },
        { name: 'HexView' },
        { name: 'Cookies' },
        { name: 'Trailers' },
        { name: 'Plugins', hide: true }
      ]
    };
  },
  componentDidMount: function () {
    var self = this;
    util.on('resTabsChange', function () {
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
  render: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    var btns = state.btns;
    var btn = state.btn;
    if (!btn) {
      btn = btns[0];
      self.selectBtn(btn);
    }
    var name = btn && btn.name;
    var modal = props.modal;
    var res,
      rawHeaders,
      rawTrailers,
      headersStr,
      trailerStr,
      headers,
      trailers,
      cookies,
      body,
      raw,
      json,
      tips,
      defaultName,
      base64,
      bin;
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
        if (!Array.isArray(cookies)) {
          cookies = util.isStr(cookies) ? [cookies] : [];
        }
        cookies = cookies.map(function (cookie) {
          cookie = util.parseQueryString(
            cookie,
            /;\s*/,
            null,
            decodeURIComponent,
            true
          );
          var row = ['', '', '', '', '', '', '', '', '', ''];
          for (var i in cookie) {
            switch (i.toLowerCase()) {
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
            case 'partitioned':
              row[9] = '√';
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
      var showImg = name === btns[2].name;
      if (status != null) {
        headersStr = util.getResRawHeaders(modal);
        trailerStr = trailers ? util.objectToString(trailers, res.rawTrailerNames) : '';
        raw = headersStr + '\r\n\r\n' + body;
        var rawType = !modal.resError && util.getRawType(headers);
        var type = util.getContentType(rawType);
        isJson = type === 'JSON';
        // 对 SVG 做特殊处理, 利用 base64 ，图片标签展示 svg 元素
        if (rawType === 'image/svg+xml') {
          imgSrc = 'data:image/svg+xml;base64,' + (res.base64 || '');
          isText = false;
        } else if (type === 'IMG') {
          imgSrc = body || (res.size ? modal.url : undefined);
          isText = false;
        } else if (showImg && res.base64 && (type === 'HTML' || (json && json.isJSONText && util.likeJson(body)))) {
          if (json && json.isJSONText) {
            isJson = true;
          } else if (
            !body ||
            (body.indexOf('<') !== -1 && body.indexOf('>') !== -1)
          ) {
            data = modal;
            isText = false;
          }
        }
      }
      if (imgSrc) {
        data = modal;
      }
      if (modal.frames) {
        tips = { isFrames: true, inComposer: modal.inComposer };
      } else if (modal.isHttps) {
        tips = !body && { isHttps: true };
      } else if (
        res.size >= 0 &&
        headers &&
        modal.useFrames !== false &&
        !body &&
        modal.endTime &&
        !/^ws/.test(modal.url)
      ) {
        tips = { url: modal.url };
        if (res.size < 5120) {
          tips.message = 'No response body';
        } else {
          raw += '(Response body exceeds display limit)';
          tips.message = 'Response body exceeds display limit';
        }
      }
      if (trailerStr) {
        raw += '\r\n\r\n' + trailerStr;
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

    var pluginsTab = btns[8];
    var tabs = dataCenter.getResTabs();
    var len = props.inComposer ? 0 : tabs.length;
    pluginsTab.hide = !len;
    if (len && len === 1) {
      pluginsTab.display = pluginsTab.title = tabs[0].name;
      pluginsTab.className = 'w-detail-custom-tab';
    } else {
      pluginsTab.display = undefined;
      pluginsTab.title = undefined;
      pluginsTab.className = undefined;
    }
    return (
      <div
        className={
          'fill v-box w-detail-ctn w-detail-res' +
          getHide(util.getBool(props.hide))
        }
      >
        <BtnGroup onClick={self.onClickBtn} btns={btns} />
        {state.initedRaw ? (
          <Textarea
            defaultName={defaultName}
            value={raw}
            headers={headersStr}
            base64={base64}
            session={modal}
            className="fill w-detail-res-raw"
            hide={name != btns[0].name}
          />
        ) : null}
        {state.initedHeaders ? (
          <div
            className={
              'fill w-detail-res-headers' +
              getHide(name != btns[1].name)
            }
          >
            <Properties modal={rawHeaders || headers} enableViewSource="1" />
          </div>
        ) : null}
        {state.initedPreview ? (
          <ImageView imgSrc={imgSrc} data={data} hide={!showImg} />
        ) : null}
        {state.initedTextView ? (
          <Textarea
            defaultName={defaultName}
            tips={tips}
            base64={base64}
            value={body}
            session={modal}
            className="fill w-detail-res-textview"
            hide={name != btns[3].name}
          />
        ) : null}
        {state.initedJSONView ? (
          <JSONViewer
            defaultName={defaultName}
            data={json}
            tips={tips}
            session={modal}
            hide={name != btns[4].name}
          />
        ) : null}
        {state.initedHexView ? (
          <Textarea
            defaultName={defaultName}
            isHexView="1"
            base64={base64}
            tips={tips}
            value={bin}
            session={modal}
            className="fill n-monospace w-detail-res-hex"
            hide={name != btns[5].name}
          />
        ) : null}
        {state.initedCookies ? (
          <div
            className={
              'fill w-detail-res-cookies' +
              getHide(name != btns[6].name)
            }
          >
            {cookies && cookies.length ? <Table head={COOKIE_HEADERS} modal={cookies} /> : (headers ? <Tips data={EMPTY_COOKIES} /> : null)}
          </div>
        ) : null}
        {state.initedTrailers ? (
          <div
            className={
              'fill w-detail-res-headers' +
              getHide(name != btns[7].name)
            }
          >
            <Properties modal={rawTrailers || trailers} enableViewSource="1" />
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

module.exports = ResDetail;
