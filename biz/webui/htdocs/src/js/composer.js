require('../css/composer.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var $ = require('jquery');
var dataCenter = require('./data-center');
var util = require('./util');
var storage = require('./storage');
var Divider = require('./divider');
var ResDetail = require('./res-detail');
var Properties = require('./properties');
var PropsEditor = require('./props-editor');
var message = require('./message');
var ContextMenu = require('./context-menu');
var CookiesDialog = require('./cookies-dialog');
var Dialog = require('./dialog');
var win = require('./win');
var HistoryData = require('./history-data');
var LazyInit = require('./lazy-init');
var Frames = require('./frames');
var Icon = require('./icon');
var ViewInspector = require('./view-inspector');
var UrlInput = require('./url-input');
var RulesMiniEditor = require('./rules-mini-editor');
var ReqType = require('./req-type');
var UploadForm = require('./upload-form');

var METHODS = util.METHODS;
var isStr = util.isStr;
var notEStr = util.notEStr;
var handleTab = util.handleTab;
var parseHeaders = util.parseHeaders;
var getBase64FromHexText = util.getBase64FromHexText;
var handleEditorKeydown = util.handleEditorKeydown;
var getHexFromBase64 = util.getHexFromBase64;
var getBody = util.getBody;
var getHexText = util.getHexText;
var trigger = util.trigger;
var addEvent = util.on;
var getHide = util.getHide;
var getRawHeaders = dataCenter.getRawHeaders;
var EXCEED_TIPS = util.EXCEED_TIPS + ' 20MB';
var SEND_CTX_MENU = [
  { name: 'Send Body Via File', action: 'file' },
  { name: 'Replay Times' },
  { name: 'Export' }
].concat(util.NETWORK_ACTIONS);
var MAX_FILE_SIZE = 1024 * 1024 * 20;
var MAX_RES_SIZE = 1024 * 1024 * 3;

var getType = ReqType.getType;
var isUpload = ReqType.isUpload;
var TIPS = 'Requests cannot bring rules in strict mode';
var WS_RE = /^wss?:\/\//i;
var WS_CONNNECT_RE = /^\s*connection\s*:\s*upgrade\s*$/im;
var WS_UPGRADE_RE = /^\s*upgrade\s*:\s*websocket\s*$/im;
var MAX_HEADERS_SIZE = 1024 * 128;
var MAX_BODY_SIZE = 1024 * 256;
var MAX_UPLOAD_SIZE = MAX_BODY_SIZE * 2;
var MAX_COUNT = 64;
var MAX_REPEAT_TIMES = 100;
var RULES_HEADER = 'x-whistle-rule-value';

var getTabClass = function (active) {
  return active ? 'w-tab-btn w-active' : 'w-tab-btn';
};

function getString(str, len) {
  return util.getString(str).substring(0, len || MAX_BODY_SIZE);
}

function hasReqBody(method, url, headers) {
  if (method === 'CONNECT' || util.hasRequestBody(method) || WS_RE.test(url)) {
    return true;
  }
  return headers && WS_CONNNECT_RE.test(headers) && WS_UPGRADE_RE.test(headers);
}

function hexToStr(str) {
  str = getBase64FromHexText(str);
  return util.base64Decode(str);
}

function strToHex(str) {
  var base64 = util.toBase64(str);
  return getHexText(getHexFromBase64(base64));
}

function getStatus(statusCode) {
  if (statusCode == 403) {
    return 'forbidden';
  }
  if (statusCode && (!/^\d+$/.test(statusCode) || statusCode >= 400)) {
    return 'error';
  }
  return '';
}

function parseValue(value) {
  if (util.isObj(value)) {
    value.data = util.base64ToByteArray(value.base64) || util.EMPTY_BUF;
    delete value.base64;
  }
}

function replaceCRLF(body) {
  return body && body.replace(/\r\n|\r|\n/g, '\r\n');
}

function getComposerTime(composerTime) {
  if (!composerTime || !composerTime.endTime) {
    return;
  }
  var time = composerTime.endTime - composerTime.startTime;
  return time >= 1000 ? (time / 1000) + 's' : time + 'ms';
}

var Composer = React.createClass({
  getInitialState: function () {
    var rules = storage.get('composerRules');
    var data = util.parseJSON(storage.get('composerData')) || {};
    var showPretty = storage.get('showPretty') == '1';
    var useH2 = storage.get('useH2InComposer') == '1';
    var disableComposerRules = storage.get('disableComposerRules') == '1';
    var method = data.method;
    var body = getString(data.body);
    if (body && body !== data.body) {
      message.warn('Body content limited to 256KB (excess will be truncated)');
    }
    var headers = parseHeaders(data.headers);
    var type = getType(headers);
    var self = this;
    if (data.base64 && isUpload(type)) {
      self.uploadBodyData = data.base64 && self.parseUploadModal({ headers: headers, base64: data.base64 });
    } else {
      var uploadBodyData = util.parseRawJson(storage.get('composerUploadBody'), true);
      if (uploadBodyData) {
        Object.keys(uploadBodyData).forEach(function(name) {
          var value = uploadBodyData[name];
          if (Array.isArray(value)) {
            value.forEach(parseValue);
          } else {
            parseValue(value);
          }
        });
        self.uploadBodyData = uploadBodyData;
      }
    }
    self._url = util.trimStr(data.url);

    return {
      loading: true,
      repeatTimes: 1,
      historyData: [],
      disableBody: !!storage.get('disableComposerBody'),
      enableProxyRules: storage.get('composerProxyRules') !== '',
      method: METHODS.indexOf(method) === -1 ? 'GET' : method,
      headers: getString(data.headers, MAX_HEADERS_SIZE),
      body: body,
      tabName: 'Request',
      showPretty: showPretty,
      useH2: useH2,
      rules: isStr(rules) ? rules : '',
      type: type,
      disableComposerRules: disableComposerRules,
      isHexText: !!storage.get('showHexTextBody'),
      isCRLF: !!storage.get('useCRLBody')
    };
  },
  componentDidMount: function () {
    var self = this;
    self.setUrl(self._url);
    self.update(self.props.modal);
    self.refs.uploadBody.update(self.uploadBodyData);
    self.hintElem = $(findDOMNode(self.refs.hints));
    dataCenter.onTakeTimeChange = function(time) {
      self.setState({ composerTime: time });
    };
    addEvent('_setComposerData', function(_, data) {
      if (data) {
        trigger('showComposerTab');
        self.onCompose(data);
      }
    });
    addEvent('setComposer', function () {
      if (self.state.pending || self.props.disabled) {
        return;
      }
      var activeItem = self.props.modal;
      if (!activeItem) {
        return;
      }
      self.setState({ reqData: activeItem });
      activeItem.frames && dataCenter.setComposerItem(activeItem);
      var body = getBody(activeItem.req);
      var updateComposer = function () {
        var headers = activeItem.req.headers;
        if (activeItem.h2Id) {
          headers = $.extend({}, headers);
          headers['x-whistle-alpn-protocol'] = activeItem.h2Id;
          activeItem = $.extend({}, activeItem);
          activeItem.req = $.extend({}, activeItem.req);
          activeItem.req.headers = headers;
        }
        var state = {
          useH2: activeItem.useH2,
          headers: headers,
          result: activeItem,
          type: getType(headers),
          method: activeItem.req.method,
          tabName: 'Request'
        };
        var body = getBody(activeItem.req);
        if (body) {
          state.disableBody = false;
          if (body.indexOf('\n') !== -1) {
            state.isCRLF = body.indexOf('\r\n') !== -1;
          }
        }
        storage.set('useCRLBody', state.isCRLF ? 1 : '');
        self.setState(state, function () {
          self.update(activeItem);
        });
        storage.set('useH2InComposer', activeItem.useH2 ? 1 : '');
      };
      if (body.length > MAX_BODY_SIZE) {
        win.confirm(
          'Request body exceeds limit and will be truncated. Continue?',
          function (allow) {
            if (allow) {
              updateComposer();
            }
          }
        );
      } else {
        updateComposer();
      }
    });
    addEvent('showFramesInComposer', function() {
      self.setState({ tabName: 'Frames' });
    });
    addEvent('updateStrictMode', function () {
      self.setState({});
    });
    self.updatePrettyData();
    $(document).on('click mousedown', function(e) {
      var target = $(e.target);
      if (!(target.closest('.w-com-history-data').length ||
        target.closest('.w-keep-history-data').length ||
        target.closest('.w-replay-count-dialog').length ||
        target.closest('.w-com-history-btn').length ||
        target.closest('.w-copy-text-with-tips').length ||
        target.closest('.w-ie-dialog').length ||
        target.closest('.w-service-dialog').length)) {
        self.hideHistory();
      }
    });
    trigger('composerDidMount');
  },
  repeatTimesChange: function (e) {
    var count = e.target.value.replace(/^\s*0*|[^\d]+/, '');
    var repeatTimes = count.slice(0, 3);
    if (repeatTimes > MAX_REPEAT_TIMES) {
      repeatTimes = MAX_REPEAT_TIMES;
    }
    this.setState({ repeatTimes: repeatTimes });
  },
  repeatRequest: function(e) {
    if (util.checkSubmit(e)) {
      return;
    }
    var self = this;
    var repeatTimes = self.state.repeatTimes;
    self.refs.setRepeatTimes.hide();
    if (self._isReplay) {
      self.onReplay(repeatTimes);
    } else {
      self.execute(null, repeatTimes);
    }
  },
  loadHistory: function () {
    var self = this;
    if (self.state.loading === 2) {
      return;
    }
    self.state.loading = 2;
    dataCenter.getHistory(function (data) {
      if (Array.isArray(data)) {
        self.setState({
          loading: 0,
          historyData: self.formatHistory(data)
        });
        return;
      }
      setTimeout(self.loadHistory, 6000);
    });
  },
  getMethod: function () {
    var curMethod = this.state.method || 'GET';
    var method = findDOMNode(this.refs.method).value || curMethod;
    return method === '+ Custom' ? method : curMethod;
  },
  updatePrettyData: function () {
    var self = this;
    if (!self.state.showPretty) {
      return;
    }
    var refs = self.refs;
    var headers = findDOMNode(refs.headers).value;
    var prettyHeaders = parseHeaders(headers);
    refs.prettyHeaders.update(prettyHeaders);
    var body = findDOMNode(refs.body).value;
    if (body && self.state.isHexText) {
      body = hexToStr(body);
    }
    body = util.parseQueryString(body, null, null, decodeURIComponent);
    refs.prettyBody.update(body);
  },
  update: function (item) {
    if (!item) {
      return;
    }
    var rulesHeaders = item.rulesHeaders;
    var rules = rulesHeaders && rulesHeaders[RULES_HEADER];
    var self = this;
    if (rules) {
      rulesHeaders = $.extend({}, rulesHeaders);
      delete rulesHeaders[RULES_HEADER];
      self.updateRules(rules);
    }
    var refs = self.refs;
    var req = item.req;
    self.setUrl(item.isHttps ? 'tunnel://' +item.url : item.url);
    findDOMNode(refs.method).value = req.method;
    findDOMNode(refs.headers).value = util.getOriginalReqHeaders(item, rulesHeaders);
    var bodyElem = findDOMNode(refs.body);
    if (req.method === 'GET') {
      bodyElem.value = '';
    } else {
      var body = self.state.isHexText
        ? getHexText(util.getHex(req))
        : getBody(req);
      var value = getString(body);
      bodyElem.value = value;
    }
    self.updatePrettyData();
    self.updateUploadForm(req);
  },
  parseUploadModal: function(req) {
    var fields = util.parseUploadBody(req);
    var uploadModal = {};
    fields &&
      fields.forEach(function (field) {
        var name = field.name;
        var list = uploadModal[name];
        if (list) {
          list.push(field);
        } else {
          uploadModal[name] = [field];
        }
      });
    return uploadModal;
  },
  updateUploadForm: function(req) {
    if (!isUpload(req.headers)) {
      return false;
    }
    this.refs.uploadBody.update(this.parseUploadModal(req));
    return true;
  },
  shouldComponentUpdate: util.scu,
  getComposerData: function() {
    var self = this;
    var refs = self.refs;
    var method = self.getMethod();
    var headers = findDOMNode(refs.headers).value;

    return {
      url: self._url,
      headers: headers,
      method: method,
      useH2: self.state.useH2 ? 1 : '',
      body: replaceCRLF(findDOMNode(refs.body).value)
    };
  },
  saveComposer: function () {
    var self = this;
    var data = self.getComposerData();
    self.state.headers = data.headers;
    storage.set('composerData', JSON.stringify(data));
    if (self.hasBody != hasReqBody(data.method, data.url, data.headers)) {
      self.setState({});
    }
    return data;
  },
  addHistory: function (params) {
    var self = this;
    var historyData = self.state.historyData;
    params.date = Date.now();
    for (var i = 0, len = historyData.length; i < len; i++) {
      var item = historyData[i];
      if (
        item.url === params.url &&
        item.method === params.method &&
        item.headers === params.headers &&
        item.body === params.body
      ) {
        params.selected = item.selected;
        historyData.splice(i, 1);
        break;
      }
    }
    historyData.unshift(params);
    var overflow = historyData.length - MAX_COUNT;
    if (overflow > 0) {
      historyData.splice(MAX_COUNT, overflow);
    }
    self.setState({ historyData: self.formatHistory(historyData) });
  },
  formatHistory: function (data) {
    var result = [];
    var histroyUrls = [];
    var groupList = [];
    var map = {};
    var hasSelected;
    data.forEach(function (item) {
      if (!notEStr(item.url)) {
        return;
      }
      if (histroyUrls.indexOf(item.url) === -1) {
        histroyUrls.push(item.url);
      }
      var opts = util.parseUrl(item.url);
      var host = opts ? opts.host : '';
      var group = map[host];
      if (!group) {
        group = { title: host, list: [] };
        groupList.push(group);
        map[host] = group;
      }
      if (item.selected) {
        if (hasSelected) {
          item.selected = false;
        } else {
          hasSelected = true;
        }
      }
      group.list.push(item);
      item.path = opts ? opts.path : item.url;
      item.protocol = opts ? opts.protocol.slice(0, -1) : 'HTTP';
      item.protocol = /^([\w.-]+):\/\//i.test(item.url) ? RegExp.$1.toUpperCase() : 'HTTP';
      item.body = item.body || '';
      result.push(item);
    });
    if (!hasSelected && result[0]) {
      result[0].selected = true;
    }
    result._groupList = groupList.reduce(function(list, group) {
      list.push({ title: group.title});
      group.list.forEach(function(item) {
        list.push(item);
      });
      return list;
    }, []);
    this._histroyUrls = histroyUrls;
    this.filterHints();
    return result;
  },
  onHexTextChange: function (e) {
    var self = this;
    var isHexText = e.target.checked;
    storage.set('showHexTextBody', isHexText ? 1 : '');
    var elem = findDOMNode(self.refs.body);
    var body = elem.value;
    if (body.trim()) {
      var isCRLF = self.state.isCRLF;
      if (isHexText) {
        if (self._preBody === body && (!self._isCRLF === !isCRLF)) {
          elem.value = self._preHex;
        } else {
          elem.value = strToHex(isCRLF ? replaceCRLF(body) : body);
        }
      } else {
        self._preBody = hexToStr(body);
        self._isCRLF = isCRLF;
        self._preHex = body;
        elem.value = self._preBody;
      }
    }
    self.setState({ isHexText: isHexText });
    self.saveComposer();
  },
  onCRLFChange: function (e) {
    var isCRLF = e.target.checked;
    storage.set('useCRLBody', isCRLF ? 1 : '');
    this.setState({ isCRLF: isCRLF });
  },
  updateRules: function(rules) {
    if (Array.isArray(rules)) {
      rules = rules.join('\n');
    }
    if (notEStr(rules)) {
      rules = util.decodeURIComponentSafe(rules);
      this.onRulesChange(rules);
      this.setRulesDisable(false);
    }
  },
  onCompose: function (item) {
    if (!item) {
      return;
    }
    var self = this;
    var state = self.state;
    state.tabName = 'Request';
    self.result = null;
    var refs = self.refs;
    var isHexText = !!item.isHexText;
    var headers = item.headers;
    var rules = [];
    if (notEStr(item.rules)) {
      rules.push(item.rules);
    }
    var req = { headers: {}, base64: item.base64 };
    self.handleFrames();
    if (notEStr(headers)) {
      headers = headers.trim().split(/[\r\n]+/).filter(function(line) {
        line = line.trim();
        var index = line.indexOf(':');
        var key = line;
        var value;
        if (index !== -1) {
          key = line.substring(0, index);
          value = line.substring(index + 1).trim();
        }
        key = key.toLowerCase();
        // 忽略重名的字段
        req.headers[key] = value;
        if (key === RULES_HEADER) {
          value && rules.push(value);
          return false;
        }
        return true;
      }).join('\r\n');
    }
    if (rules.length) {
      self.updateRules(rules.join('\n'));
    }
    self.setUrl(item.url);
    if (isStr(item.method)) {
      findDOMNode(refs.method).value = item.method;
      state.method = item.method;
    }
    if (isStr(headers)) {
      findDOMNode(refs.headers).value = headers;
      state.headers = headers;
    }
    if (!isHexText && !item.body && item.base64) {
      isHexText = true;
    }
    var body = isHexText && item.base64
      ? getHexText(getHexFromBase64(item.base64))
      : util.getText(item.body) || '';
    state.tabName = 'Request';
    state.result = '';
    state.isHexText = isHexText;
    state.useH2 = item.useH2;
    if (item.disableBody != null) {
      state.disableBody = !!item.disableBody;
    } else if (body) {
      state.disableBody = false;
    }
    if (item.isCRLF != null) {
      state.isCRLF = !!item.isCRLF;
      storage.set('useCRLBody', item.isCRLF ? 1 : '');
    }
    if (item.disableComposerRules != null) {
      self.setRulesDisable(item.disableComposerRules);
    }
    if (item.enableProxyRules != null) {
      state.enableProxyRules = !!item.enableProxyRules;
      storage.set('composerProxyRules', item.enableProxyRules ? 1 : '');
    }
    if (!self.updateUploadForm(req)) {
      findDOMNode(refs.body).value = body;
    }
    self.onComposerChange(true);
    storage.set('disableComposerBody', state.disableBody ? 1 : '');
    storage.set('useH2InComposer', item.useH2 ? 1 : '');
    storage.set('showHexTextBody', isHexText ? 1 : '');
  },
  onReplay: function (times) {
    var self = this;
    if (self._selectedItem) {
      self.sendRequest($.extend({}, self._selectedItem, { repeatCount: times || 1, needResponse: false }));
    }
  },
  onUrlChange: function(url) {
    var self = this;
    self._url = url;
    self.onComposerChange();
    clearTimeout(self._urlTimer);
    self._urlTimer = setTimeout(self.filterHints, 300);
  },
  onComposerChange: function (e) {
    var self = this;
    clearTimeout(self.composerTimer);
    self.composerTimer = setTimeout(self.saveComposer, 1000);
    var target = !e || e === true ? e : e && e.target;
    if (target) {
      if (target === true || target.nodeName === 'SELECT') {
        var method = findDOMNode(self.refs.method).value;
        self.setState({ method: method }, self.updatePrettyData);
      }
      if (target === true || target.name === 'headers') {
        clearTimeout(self.typeTimer);
        self.typeTimer = setTimeout(function () {
          var headers = findDOMNode(self.refs.headers).value;
          self.setState({
            type: getType(parseHeaders(headers))
          });
        }, 1000);
      }
    }
  },
  onTypeChange: function (e) {
    var target = e.target;
    if (target.nodeName !== 'INPUT') {
      return;
    }
    var type = util.attr(target, 'data-type');
    var self = this;
    if (type) {
      self.setState({ type: type });
      var elem = findDOMNode(self.refs.headers);
      elem.value = ReqType.setType(elem.value, ReqType.TYPES[type]);
      self.updatePrettyData();
      self.saveComposer();
    }
  },
  addHeader: function () {
    this.refs.prettyHeaders.onAdd();
  },
  addField: function () {
    this.refs.prettyBody.onAdd();
  },
  addUploadField: function () {
    this.refs.uploadBody.onAdd();
  },
  onHeaderChange: function (key, newKey) {
    var self = this;
    var refs = self.refs;
    var headers = refs.prettyHeaders.toString();
    findDOMNode(refs.headers).value = headers;
    self.saveComposer();
    if (
      key.toLowerCase() === 'content-type' ||
      (newKey && newKey.toLowerCase() === 'content-type')
    ) {
      self.setState({
        type: getType(parseHeaders(headers))
      });
    }
  },
  onFieldChange: function () {
    var self = this;
    var refs = self.refs;
    var body = refs.prettyBody.toString();
    if (body && self.state.isHexText) {
      body = strToHex(body);
    }
    findDOMNode(refs.body).value = body;
    self.saveComposer();
  },
  updateUploadData: function () {
    var fields = this.refs.uploadBody.getFields();
    var result = {};
    var maxLen = MAX_UPLOAD_SIZE;
    var getValue = function(field) {
      if (!field.data || field.data.length > maxLen) {
        return field.value;
      }
      maxLen -= field.data.length;
      return {
        value: field.value,
        type: field.type,
        base64: util.bytesToBase64(field.data)
      };
    };
    fields.forEach(function (field) {
      var value = result[field.name];
      var filedValue = getValue(field);
      if (Array.isArray(value)) {
        value.push(filedValue);
      } else {
        result[field.name] = value == null ? filedValue : [value, filedValue];
      }
    });
    storage.set('composerUploadBody', JSON.stringify(result));
  },
  onProxyRules: function (e) {
    var enable = e.target.checked;
    storage.set('composerProxyRules', enable ? 1 : '');
    this.setState({ enableProxyRules: enable });
  },
  onShowPretty: function (e) {
    var show = e.target.checked;
    storage.set('showPretty', show ? 1 : 0);
    this.setState({ showPretty: show }, this.updatePrettyData);
  },
  toggleH2: function (e) {
    var self = this;
    if (!dataCenter.supportH2) {
      win.confirm(
        'HTTP/2 requires Node.js LTS version v16+. Please upgrade',
        function (sure) {
          sure && window.open('https://nodejs.org/');
          self.setState({});
        }
      );
      return;
    }
    var useH2 = e.target.checked;
    storage.set('useH2InComposer', useH2 ? 1 : '');
    self.setState({ useH2: useH2 });
  },
  hideHistory: function() {
    if (this.state.showHistory) {
      this.setState({ showHistory: false });
    }
  },
  toggleHistory: function () {
    var showHistory = !this.state.showHistory;
    this.setState({ showHistory: showHistory });
    showHistory && this.loadHistory();
  },
  setRulesDisable: function (disableComposerRules) {
    storage.set('disableComposerRules', disableComposerRules ? 1 : 0);
    this.setState({ disableComposerRules: disableComposerRules });
  },
  onDisableChange: function (e) {
    this.setRulesDisable(!e.target.checked);
  },
  enableRules: function () {
    if (this.state.disableComposerRules) {
      this.setRulesDisable(false);
    }
  },
  handeHistoryReplay: function(item, repeatTimes) {
    this._selectedItem = item;
    if (repeatTimes) {
      this.showRepeatTimes(true);
    } else {
      this.onReplay();
    }
  },
  handleHistoryEdit: function(item) {
    this.onCompose(item);
    this.hideHistory();
  },
  showRepeatTimes: function(isReplay) {
    var self = this;
    var refs = self.refs;
    refs.setRepeatTimes.show();
    self._isReplay = isReplay;
    findDOMNode(refs.repeatBtn).innerHTML = isReplay ? 'Replay' : 'Send';
    setTimeout(function () {
      var input = findDOMNode(refs.repeatTimes);
      input.select();
      input.focus();
    }, 300);
  },
  execute: function (e, times) {
    times = times > 0 ? Math.min(MAX_REPEAT_TIMES, times) : undefined;
    if (e && !times && e.target.nodeName === 'INPUT' && e.keyCode !== 13) {
      return;
    }
    var self = this;
    var state = self.state;
    if (e && e.shiftKey) {
      return self.showRepeatTimes();
    }
    if (state.pending) {
      return;
    }
    var url = self._url;
    var refs = self.refs;
    if (!url || /^(?:https?|ws?|tunnel):\/\/$/.test(url)) {
      refs.urlInput.shake();
      return message.error('Request URL cannot be empty');
    }

    self.onComposerChange();
    self.setState({ tabName: 'Request' });
    var disableComposerRules =
      dataCenter.isStrictMode() || state.disableComposerRules;
    var headersStr = findDOMNode(refs.headers).value;
    var headers = headersStr;
    var method = self.getMethod();
    var body, base64, isHexText, contentType, contentLength;
    if (self.localFileBase64 != null) {
      if (hasReqBody(method, url, headersStr)) {
        base64 = self.localFileBase64;
      }
      self.localFileBase64 = null;
    } else if (!state.disableBody && hasReqBody(method, url, headersStr)) {
      if (state.type === 'upload') {
        var uploadData = util.getMultiBody(refs.uploadBody.getFields());
        var boundary = uploadData.boundary;
        contentLength = uploadData.length;
        base64 = uploadData.base64;
        contentType = 'multipart/form-data; boundary=' + boundary;
      } else {
        body = findDOMNode(refs.body).value;
        isHexText = state.isHexText;
        if (isHexText) {
          base64 = getBase64FromHexText(body);
          body = undefined;
        } else if (body && state.isCRLF) {
          body = replaceCRLF(body);
        }
      }
    }
    self.sendRequest({
      rules: disableComposerRules ? null : state.rules,
      boundary: boundary,
      contentType: contentType,
      contentLength: contentLength,
      useH2: state.useH2 ? 1 : '',
      needResponse: true,
      url: url.replace(/^\/\//, ''),
      headers: headers,
      method: method,
      body: body,
      base64: base64,
      repeatCount: times,
      isHexText: isHexText,
      enableProxyRules: state.enableProxyRules
    });
  },
  handleBody: function(res) {
    var self = this;
    var reqId = res && res.reqId;
    var preReqId = self._curDataId;
    preReqId && dataCenter.offComposeData(preReqId);
    self._curDataId = reqId;
    if (!reqId) {
      return;
    }
    var body;
    dataCenter.onComposeData(reqId, function(base64) {
      if (!base64) {
        return;
      }
      var result = self.state.result;
      var res = result && result.res;
      if (res) {
        body = util.joinBase64(body, base64);
        var data = {};
        Object.keys(res).forEach(function(key) {
          data[key] = res[key];
        });
        data.base64 = body;
        result.res = data;
        self.setState({});
      }
      if (body.length > MAX_RES_SIZE) {
        dataCenter.offComposeData(reqId);
      }
    });
  },
  handleFrames: function(res) {
    var headers = res && res.headers;
    var id = headers && headers['x-whistle-req-id'];
    var isFrames = headers && headers['x-whistle-frames-mode'] === '1';
    dataCenter.curComposerReqId = id;
    if (!id || !isFrames) {
      dataCenter.setComposerItem();
      this.setState({ reqData: null });
      return;
    }
    var reqData = {
      id: id,
      frames: []
    };
    dataCenter.setComposerItem(reqData);
    this.setState({ reqData: reqData });
    return true;
  },
  sendRequest: function(params) {
    var self = this;
    var index = (self._reqIndex || 0) + 1;
    var needResponse = params.needResponse;
    self._reqIndex = index;
    if (needResponse) {
      clearTimeout(self.comTimer);
      self.comTimer = setTimeout(function () {
        self.setState({ pending: false });
      }, 5000);
    }
    trigger('enableRecord');
    self.handleFrames();
    dataCenter.composeInner(params, function (data, xhr, em) {
      if (!needResponse || self._reqIndex !== index) {
        return;
      }
      clearTimeout(self.comTimer);
      var state = {
        pending: false,
        tabName: 'Response'
      };
      var res = data && data.res;
      if (self.handleFrames(res)) {
        data.frames = [];
        data.inComposer = true;
      }
      var reqId;
      self.handleBody(res);
      if (!data || data.ec !== 0) {
        if (data && data.ec === 2) {
          message.error(data.em || 'Error, please retry');
          self.refs.urlInput.shake();
          return self.setState({ pending: false });
        }
        var status = xhr && xhr.status;
        if (status) {
          em = status;
          util.showSysErr(xhr);
        } else if (!notEStr(em) || em === 'error') {
          em = 'Please check the proxy settings or whether whistle has been started';
        }
        state.result = { url: params.url, req: '', res: { statusCode: em } };
      } else {
        if (res) {
          reqId = res.headers && res.headers['x-whistle-req-id'];
          res.rawHeaders = getRawHeaders(res.headers, res.rawHeaderNames);
          res.rawTrailers = getRawHeaders(res.trailers, res.rawTrailerNames);
        } else {
          data.res = { statusCode: 200 };
        }
        data.url = params.url;
        data.req = '';
        state.result = data;
      }
      state.reqId = reqId;
      self.setState(state);
    });
    params.date = Date.now();
    params.body = params.body || '';
    needResponse && this.addHistory(params);
    trigger('autoRefreshNetwork');
    self.setState({ result: '', pending: needResponse, composerTime: null });
  },
  saveRules: function () {
    var self = this;
    var state = self.state;
    var rules = state.rules;
    state.rules = rules;
    storage.set('composerRules', rules);
    self.setState({});
  },
  formatJSON: function () {
    var body = findDOMNode(this.refs.body);
    if (!body.value.trim()) {
      return;
    }
    var data = util.parseRawJson(body.value);
    if (data) {
      body.value = util.stringify(data);
      this.saveComposer();
    }
  },
  inspectJSON: function() {
    var body = findDOMNode(this.refs.body).value;
    trigger('showJsonViewDialog', body.trim());
  },
  onRulesChange: function (rules) {
    var self = this;
    clearTimeout(self.rulesTimer);
    self.rulesTimer = setTimeout(self.saveRules, 600);
    self.setState({ rules: rules });
  },
  formatHeaders: function(e) {
    handleTab(e);
    handleEditorKeydown(e);
  },
  onFormat: function(e) {
    util.handleFormat(e, this.formatJSON);
    handleTab(e);
    handleEditorKeydown(e);
  },
  showCookiesDialog: function() {
    var self = this;
    var host = util.getHostname(self._url).toLowerCase();
    if (!/^[a-z.\d_-]+$/.test(host)) {
      return message.info('Cookies not found');
    }
    if (self._pending) {
      return;
    }
    self._pending = true;
    dataCenter.getCookies({ domain: host }, function (result, xhr) {
      self._pending = false;
      result = (result && result.cookies) || [];
      var maxCount = 30;
      if (result.length < maxCount) {
        var list = dataCenter.networkModal.getList();
        for (var i = list.length - 1; i >= 0; i--) {
          var item = list[i];
          if (util.getHostname(item.url) === host) {
            var cookie = item.req.headers.cookie;
            if (cookie && result.indexOf(cookie) === -1) {
              result.push(cookie);
              if (result.length >= maxCount) {
                break;
              }
            }
          }
        }
      }
      if (!result.length) {
        return message.info('Cookies not found');
      }
      if (result.length < maxCount) {
        var cookies = self._cacheCookies;
        if (cookies && cookies.domain === host) {
          for (var j = 0, len = cookies.cookies.length; j < len; j++) {
            var c = cookies.cookies[j];
            if (c && result.indexOf(c) === -1) {
              result.push(c);
              if (result.length >= maxCount) {
                break;
              }
            }
          }
        }
      }

      self._cacheCookies = {
        domain: host,
        cookies: result
      };
      self.refs.cookiesDialog.show(result);
    });
  },
  insertCookie: function(cookie) {
    var self = this;
    var elem = findDOMNode(self.refs.headers);
    var headers = parseHeaders(elem.value);
    headers.cookie = cookie;
    elem.value = util.objectToString(headers);
    if (self.state.showPretty) {
      self.refs.prettyHeaders.update(headers);
    }
    self.saveComposer();
  },
  setUrl: function(value) {
    this.refs.urlInput.setUrl(value);
  },
  clickHints: function(e) {
    var value = e.target.title;
    value && this.setUrl(value);
  },
  onTabChange: function (e) {
    var tabName = e.target.name || 'Request';
    if (tabName === this.state.tabName) {
      return;
    }
    this.setState({ tabName: tabName });
  },
  onContextMenu: function(e) {
    e.preventDefault();
    var data = util.getMenuPosition(e, 150);
    data.list = SEND_CTX_MENU;
    data.className = 'w-ctx-sub-left';
    this.refs.contextMenu.show(data);
  },
  filterHints: function() {
    var self = this;
    var list = self._histroyUrls;
    if (!list || !list.length) {
      return self.loadHistory();
    }
    var keyword = self._url.toLowerCase();
    var urlHints = keyword ? list.filter(function(url) {
      return url.toLowerCase().indexOf(keyword) !== -1;
    }) : list;
    if (urlHints.length === 1 && self._url === urlHints[0]) {
      urlHints = null;
    }
    self.setState({ urlHints: urlHints });
  },
  onClickContextMenu: function (action) {
    var self = this;
    switch (action) {
    case 'Replay Times':
      return self.showRepeatTimes();
    case 'history':
      return self.toggleHistory();
    case 'file':
      return self.uploadFile();
    case 'Export':
      return self.export();
    case 'createApiTest':
      return util.showService('createApiTest');
    }
  },
  uploadFile: function() {
    if (!this.reading) {
      this.refs.uploadForm.getInput().click();
    }
  },
  readLocalFile: function () {
    var self = this;
    var uploadForm = self.refs.uploadForm;
    var form = new FormData(uploadForm.getForm());
    var file = form.get('localFile');
    if (file.size > MAX_FILE_SIZE) {
      return win.alert(EXCEED_TIPS);
    }
    self.reading = true;
    util.readFile(file, function (data) {
      self.reading = false;
      self.localFileBase64 = util.bytesToBase64(data);
      self.execute();
    });
    uploadForm.getInput().value = '';
  },
  addRule: function(text) {
    var rules = this.state.rules;
    this.setState({ rules: text + (rules ? '\n\n' + rules : '') });
  },
  createRule: function() {
    trigger('showAddRulesDialog', [{ onSave: this.addRule }]);
  },
  import: function(e) {
    trigger('showImportDialog', 'composer');
  },
  copyAsCURL: function() {
    var state = this.state;
    var body = findDOMNode(this.refs.body).value;
    var base64 = '';
    if (state.isHexText) {
      base64 = getBase64FromHexText(body);
      body = '';
    }
    var text = util.asCURL({
      url: this._url || '',
      req: {
        method: state.method,
        headers: parseHeaders(state.headers),
        base64: base64,
        body: body
      }
    });
    util.copyText(text, true);
  },
  export: function() {
    var data = this.getComposerData();
    var state = this.state;
    data.disableBody = state.disableBody;
    data.rules = state.rules;
    data.disableComposerRules = state.disableComposerRules;
    data.isHexText = state.isHexText;
    data.isCRLF = state.isCRLF;
    data.type = 'setComposerData';
    data.enableProxyRules = state.enableProxyRules;
    trigger('showExportDialog', ['composer', data]);
  },
  onBodyStateChange: function (e) {
    var disableBody = !e.target.checked;
    this.setState({ disableBody: disableBody });
    storage.set('disableComposerBody', disableBody ? 1 : '');
  },
  focusEnableBody: function () {
    this.setState({ disableBody: false });
    storage.set('disableComposerBody', '');
  },
  shakeMethod: function() {
    if (!this.hasBody) {
      util.shakeElem($(findDOMNode(this.refs.method)));
    }
  },
  render: function () {
    var self = this;
    var state = self.state;
    var type = state.type;
    var rules = state.rules;
    var showPretty = state.showPretty;
    var useH2 = state.useH2;
    var pending = state.pending;
    var result = state.result || '';
    var tabName = state.tabName;
    var showRequest = tabName === 'Request';
    var showResponse = tabName === 'Response';
    var showFrames = tabName === 'Frames';
    var statusCode = result ? result.res && result.res.statusCode : '';
    var isForm = type === 'form';
    var method = state.method;
    var hasBody = hasReqBody(method, self._url, state.headers);
    var showPrettyBody = showPretty && isForm && hasBody;
    var showUpload = type === 'upload' && hasBody;
    var isStrictMode = dataCenter.isStrictMode();
    var disableComposerRules = isStrictMode || state.disableComposerRules;
    var isHexText = state.isHexText;
    var isCRLF = state.isCRLF;
    var disableBody = state.disableBody;
    var lockBody = pending || disableBody || !hasBody;
    var showHistory = state.showHistory;
    var urlHints = state.urlHints;
    var enableProxyRules = state.enableProxyRules;
    var reqData = state.reqData;
    var tips = hasBody ? null : method + ' method is not allowed to have a request body';
    var composerTime = state.composerTime;
    var onTabChange = self.onTabChange;
    var focusEnableBody = self.focusEnableBody;
    var onComposerChange = self.onComposerChange;
    var execute = self.execute;
    var shakeMethod = self.shakeMethod;
    var repeatTimes = state.repeatTimes;
    var resProps = {
      'Status Code': statusCode == null ? 'aborted' : statusCode,
      'Total Duration': getComposerTime(composerTime)
    };

    self.hasBody = hasBody;

    return (
      <div
        className={
          'fill box w-detail-ctn w-detail-com' +
          (showHistory ? ' w-show-history' : '') +
          getHide(self.props.hide)
        }
      >
        <div className="fill v-box">
          <div className="w-com-url box">
            <Icon name="dashboard" className="w-com-history-btn"
              title={(showHistory ? 'Hide' : 'Show') + ' history list'}
              onClick={self.toggleHistory}
            />
            <select
              disabled={pending}
              value={method}
              onChange={onComposerChange}
              ref="method"
              className="form-control w-com-method"
            >
              {METHODS.map(function (m) {
                return <option value={m}>{m}</option>;
              })}
            </select>
            <UrlInput ref="urlInput" hints={urlHints} disabled={pending} onChange={self.onUrlChange} />
            <button
              disabled={pending}
              onClick={execute}
              onContextMenu={self.onContextMenu}
              title={enableProxyRules ? null : 'Whistle Rules IGNORED'}
              className={'btn w-com-execute btn-' + (enableProxyRules ? 'primary' : 'info')}
            >
              <Icon name="send" />
            </button>
          </div>
          <Divider vertical="true" leftWidth="72">
            <div
              ref="rulesCon"
              onDoubleClick={self.enableRules}
              title={isStrictMode ? TIPS : undefined}
              className="v-box fill w-com-rules"
            >
              <div className="w-inspectors-title">
                <label className="w-com-rules-label">
                  <input
                    disabled={pending}
                    onChange={self.onDisableChange}
                    checked={!state.disableComposerRules}
                    type="checkbox"
                  />
                  Rules
                </label>
                <label className="w-com-proxy-rules" title="Whether to use the Rules in Whistle?">
                  <input
                    disabled={pending}
                    type="checkbox"
                    onChange={self.onProxyRules}
                    checked={enableProxyRules}
                  />
                  Whistle Rules
                </label>
                <label className="w-com-use-h2">
                  <input
                    disabled={pending}
                    type="checkbox"
                    onChange={self.toggleH2}
                    checked={dataCenter.supportH2 && useH2}
                  />
                  HTTP/2
                </label>
                <label className={'w-com-enable-body' + (hasBody ? '' : ' w-disabled')} title={tips} onClick={shakeMethod}>
                  <input
                    disabled={pending || !hasBody}
                    checked={!disableBody && hasBody}
                    type="checkbox"
                    onChange={self.onBodyStateChange}
                  />
                  Body
                </label>
                <div className="w-com-btns">
                  <a draggable="false" onClick={self.createRule}>+Rule</a>
                  <a draggable="false" onClick={self.import}>Import</a>
                  <a draggable="false" onClick={self.export}>Export</a>
                  <a draggable="false" onClick={self.copyAsCURL}>AsCURL</a>
                </div>
              </div>
              <RulesMiniEditor
                disabled={disableComposerRules || pending}
                value={rules}
                onKeyDown={handleTab}
                onChange={self.onRulesChange}
                onDoubleClick={self.enableRules}
              />
            </div>
            <div className="v-box fill">
              <div className="w-inspectors-title w-com-tabs">
                <button
                  onClick={onTabChange}
                  name="Request"
                  className={getTabClass(showRequest)}
                >
                  <Icon name="edit" />
                  Request
                </button>
                <button
                  title={result.url}
                  onClick={onTabChange}
                  name="Response"
                  style={{fontWeight: 'normal'}}
                  className={getTabClass(showResponse)}
                >
                  <Icon name="arrow-left" />
                  Response
                </button>
                <button
                  title={result.url}
                  id="whistleComposerFrames"
                  onClick={onTabChange}
                  name="Frames"
                  style={{fontWeight: 'normal'}}
                  className={getTabClass(showFrames)}
                >
                  <Icon name="menu-hamburger" />
                  Frames
                </button>
              </div>
              <Divider hide={!showRequest} vertical="true">
                <div className="fill v-box w-com-headers">
                  <div
                    className="w-com-bar"
                    onChange={self.onTypeChange}
                  >
                    <label>
                      <input
                        onChange={self.onShowPretty}
                        type="checkbox"
                        checked={showPretty}
                      />
                      Pretty
                    </label>
                    <ReqType value={type} disabled={pending} />
                    <button
                      disabled={pending}
                      className="btn btn-default"
                      onClick={self.showCookiesDialog}
                    >
                      Cookies
                    </button>
                    <button
                      disabled={pending}
                      className="btn btn-primary"
                      onClick={self.addHeader}
                    >
                      +Header
                    </button>
                  </div>
                  <textarea
                    readOnly={pending}
                    defaultValue={state.headers}
                    onChange={onComposerChange}
                    maxLength={MAX_HEADERS_SIZE}
                    onKeyDown={self.formatHeaders}
                    ref="headers"
                    placeholder="Enter headers"
                    name="headers"
                    className={
                      'fill v-box' + getHide(showPretty)
                    }
                  />
                  <PropsEditor
                    disabled={pending}
                    ref="prettyHeaders"
                    isHeader="1"
                    hide={!showPretty}
                    onChange={self.onHeaderChange}
                    callback={execute}
                  />
                </div>
                <div className={'fill v-box w-com-body' + (disableBody ? ' w-com-disable-body' : '')}>
                  <div className="w-com-bar">
                    <label className="w-com-label" onClick={shakeMethod}>
                      <input
                        disabled={pending || !hasBody}
                        checked={!disableBody && hasBody}
                        type="checkbox"
                        onChange={self.onBodyStateChange}
                      />
                      Body
                    </label>
                    <label
                      className={
                        'w-com-hex-text' +
                        (isHexText ? ' w-checked' : '') +
                        getHide(showUpload || showPrettyBody)
                      }
                      onDoubleClick={focusEnableBody}
                    >
                      <input
                        disabled={pending}
                        checked={isHexText}
                        type="checkbox"
                        onChange={self.onHexTextChange}
                      />
                      HexText
                    </label>
                    <label
                      className={
                        'w-com-crlf' +
                        getHide(isHexText || showPrettyBody || showUpload) +
                        (isCRLF ? ' w-checked' : '')
                      }
                      onDoubleClick={focusEnableBody}
                    >
                      <input
                        disabled={pending}
                        checked={isCRLF}
                        onChangeCapture={self.onCRLFChange}
                        type="checkbox"
                      />
                      \r\n
                    </label>
                    <button
                      disabled={pending}
                      className={
                        'btn btn-default' +
                        getHide(showPrettyBody || isHexText || showUpload)
                      }
                      onClick={self.formatJSON}
                    >
                      Format
                    </button>
                    <button
                      className={
                        'btn btn-primary' +
                        getHide(showPrettyBody || isHexText || showUpload)
                      }
                      onClick={self.inspectJSON}
                    >
                      Inspect
                    </button>
                    <button
                      disabled={lockBody}
                      className={
                        'btn btn-primary' +
                        getHide(!((showPrettyBody && !isHexText) || showUpload))
                      }
                      onClick={
                        showUpload ? self.addUploadField : self.addField
                      }
                    >
                      +Param
                    </button>
                  </div>
                  {tips && <div className="w-record-status" onClick={shakeMethod}>{tips}</div>}
                  <textarea
                    readOnly={lockBody}
                    defaultValue={state.body}
                    onChange={onComposerChange}
                    maxLength={MAX_BODY_SIZE}
                    onDoubleClick={focusEnableBody}
                    onClick={shakeMethod}
                    onKeyDown={self.onFormat}
                    ref="body"
                    placeholder={'Enter ' + (isHexText ? 'hex text' : 'body')}
                    className={'fill v-box' + getHide(showPrettyBody || showUpload) + (isHexText ? ' n-monospace' : '')}
                  />
                  <PropsEditor
                    onDoubleClick={focusEnableBody}
                    disabled={lockBody}
                    ref="prettyBody"
                    hide={!showPrettyBody || showUpload}
                    onChange={self.onFieldChange}
                    callback={execute}
                  />
                  <PropsEditor
                    onDoubleClick={focusEnableBody}
                    disabled={lockBody}
                    ref="uploadBody"
                    hide={!showUpload}
                    onChange={self.updateUploadData}
                    onUpdate={self.updateUploadData}
                    callback={execute}
                    allowUploadFile
                  />
                </div>
              </Divider>
              <LazyInit inited={showResponse}>
                <div
                  style={util.getHideStyle(!showResponse)}
                  className={'w-com-res w-com-res-' + getStatus(statusCode)}
                >
                  <button
                    onClick={onTabChange}
                    name="Request"
                    className="btn btn-default w-com-back-btn"
                    title="Back to Request"
                  >
                    <Icon name="menu-left" />
                  </button>
                  <Properties
                    modal={resProps}
                  />
                  <ViewInspector reqId={state.reqId} />
                </div>
              </LazyInit>
              <LazyInit inited={showResponse}>
                <ResDetail
                  inComposer="1"
                  modal={result}
                  hide={!showResponse}
                />
              </LazyInit>
              <LazyInit inited={showFrames}>
                <Frames hide={!showFrames} data={reqData} frames={reqData && reqData.frames} />
              </LazyInit>
            </div>
          </Divider>
        </div>
        <ContextMenu onClick={self.onClickContextMenu} ref="contextMenu" />
        <Dialog ref="setRepeatTimes" wstyle="w-replay-count-dialog">
          <div className="modal-body">
            <label>
              Times:
              <input
                ref="repeatTimes"
                placeholder={'<= ' + MAX_REPEAT_TIMES}
                onKeyDown={self.repeatRequest}
                onChange={self.repeatTimesChange}
                value={repeatTimes}
                className="form-control"
                maxLength="3"
              />
            </label>
            <button
              type="button"
              ref="repeatBtn"
              onKeyDown={self.repeatRequest}
              tabIndex="0"
              onMouseDown={util.preventBlur}
              className="btn btn-primary"
              onClick={self.repeatRequest}
              disabled={!repeatTimes}
            >
              Send
            </button>
          </div>
        </Dialog>
        <CookiesDialog onInsert={self.insertCookie} ref="cookiesDialog" />
        <HistoryData
          show={showHistory}
          data={state.historyData}
          onClose={self.hideHistory}
          onReplay={self.handeHistoryReplay}
          onEdit={self.handleHistoryEdit}
        />
        <UploadForm ref="uploadForm" onChange={self.readLocalFile} />
      </div>
    );
  }
});

module.exports = Composer;
