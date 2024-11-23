require('./base-css.js');
require('../css/composer.css');
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var dataCenter = require('./data-center');
var util = require('./util');
var events = require('./events');
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

var METHODS = [
  'GET',
  'POST',
  'PUT',
  'HEAD',
  'TRACE',
  'DELETE',
  'SEARCH',
  'CONNECT',
  'UPGRADE',
  'WEBSOCKET',
  'PROPFIND',
  'PROPPATCH',
  'MKCOL',
  'COPY',
  'MOVE',
  'LOCK',
  'UNLOCK',
  'OPTIONS',
  'PURGE',
  'ACL',
  'BIND',
  'CHECKOUT',
  'LINK',
  'M-SEARCH',
  'MERGE',
  'MKACTIVITY',
  'MKCALENDAR',
  'NOTIFY',
  'PATCH',
  'PRI',
  'REBIND',
  'REPORT',
  'SOURCE',
  'SUBSCRIBE',
  'UNBIND',
  'UNLINK',
  'UNSUBSCRIBE'
];
var SEND_CTX_MENU = [
  { name: 'Send File', action: 'file' },
  { name: 'Repeat Times' },
  { name: 'Show History', action: 'history' }
];
var MAX_FILE_SIZE = 1024 * 1024 * 20;

var TYPES = {
  form: 'application/x-www-form-urlencoded',
  upload: 'multipart/form-data',
  text: 'text/plain',
  json: 'application/json',
  custom: ''
};
var TIPS = 'Requests cannot bring rules in strict mode';
var TYPE_CONF_RE = /;.+$/;
var WS_RE = /^wss?:\/\//i;
var WS_CONNNECT_RE = /^\s*connection\s*:\s*upgrade\s*$/im;
var WS_UPGRADE_RE = /^\s*upgrade\s*:\s*websocket\s*$/im;
var REV_TYPES = {};
var MAX_HEADERS_SIZE = 1024 * 128;
var MAX_BODY_SIZE = 1024 * 256;
var MAX_UPLOAD_SIZE = MAX_BODY_SIZE * 2;
var MAX_COUNT = 64;
var MAX_REPEAT_TIMES = 100;
var RULES_HEADER = 'x-whistle-rule-value';
Object.keys(TYPES).forEach(function (name) {
  REV_TYPES[TYPES[name]] = name;
});

function getString(str, len) {
  if (typeof str !== 'string') {
    return '';
  }
  len = len || MAX_BODY_SIZE;
  return str.length > len ? str.substring(0, len) : str;
}

function hasReqBody(method, url, headers) {
  if (method === 'CONNECT' || util.hasRequestBody(method) || WS_RE.test(url)) {
    return true;
  }
  return headers && WS_CONNNECT_RE.test(headers) && WS_UPGRADE_RE.test(headers);
}

function hexToStr(str) {
  str = util.getBase64FromHexText(str);
  return util.base64Decode(str);
}

function strToHex(str) {
  var base64 = util.toBase64(str);
  return util.getHexText(util.getHexFromBase64(base64));
}

function getType(headers) {
  var keys = Object.keys(headers);
  var type;
  for (var i = 0, len = keys.length; i < len; i++) {
    var name = keys[i];
    if (name.toLowerCase() === 'content-type') {
      if (type) {
        return 'custom';
      }
      var value = headers[name];
      if (!value || typeof value !== 'string') {
        return 'custom';
      }
      value = value.split(';')[0].trim().toLowerCase();
      type = REV_TYPES[value] || 'custom';
    }
  }
  return type || 'custom';
}

function isUpload(headers) {
  return headers === 'upload' || getType(headers) === 'upload';
}

function escapeRules(rules) {
  rules = rules.join('\n');
  return rules && encodeURIComponent(rules);
}

function getUploadType(type, boundary) {
  if (type) {
    type = (type + '').replace(/;?\s*boundary=.*$/, '');
  }
  return (type || 'multipart/form-data') + '; boundary=' + boundary;
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
  if (value && typeof value === 'object') {
    value.data = util.base64ToByteArray(value.base64) || util.EMPTY_BUF;
    delete value.base64;
  }
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
      message.warn(
        'The length of the body cannot exceed 256k, and the excess will be truncated.'
      );
    }
    var headers = util.parseHeaders(data.headers);
    var type = getType(headers);
    if (data.base64 && isUpload(type)) {
      this.uploadBodyData = data.base64 && this.parseUploadModal({ headers: headers, base64: data.base64 });
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
        this.uploadBodyData = uploadBodyData;
      }
    }
    return {
      loading: true,
      repeatTimes: 1,
      historyData: [],
      disableBody: !!storage.get('disableComposerBody'),
      enableProxyRules: storage.get('composerProxyRules') !== '',
      url: data.url,
      method: METHODS.indexOf(method) === -1 ? 'GET' : method,
      headers: getString(data.headers, MAX_HEADERS_SIZE),
      body: body,
      tabName: 'Request',
      showPretty: showPretty,
      useH2: useH2,
      rules: typeof rules === 'string' ? rules : '',
      type: type,
      disableComposerRules: disableComposerRules,
      isHexText: !!storage.get('showHexTextBody'),
      isCRLF: !!storage.get('useCRLBody')
    };
  },
  componentDidMount: function () {
    var self = this;
    self.update(self.props.modal);
    this.refs.uploadBody.update(this.uploadBodyData);
    this.hintElem = $(ReactDOM.findDOMNode(this.refs.hints));
    events.on('_setComposerData', function(_, data) {
      if (!data) {
        return;
      }
      win.confirm('Are you sure to modify the data of composer?', function(sure) {
        if (sure) {
          self.onCompose(data);
        }
      });
    });
    events.on('setComposer', function () {
      if (self.state.pending || self.props.disabled) {
        return;
      }
      var activeItem = self.props.modal;
      if (!activeItem) {
        return;
      }
      var body = util.getBody(activeItem.req);
      var updateComposer = function () {
        var state = {
          useH2: activeItem.useH2,
          url: activeItem.url,
          headers: activeItem.headers,
          result: activeItem,
          type: getType(activeItem.req.headers),
          method: activeItem.req.method,
          tabName: 'Request'
        };
        var body = util.getBody(activeItem.req);
        if (body) {
          state.disableBody = false;
          if (body.indexOf('\n') !== -1) {
            state.isCRLF = body.indexOf('\r\n') !== -1;
          }
        }
        storage.set('useCRLBody', state.isCRLF ? 1 : '');
        self.setState(state, function () {
          self.update(activeItem);
          self.onComposerChange();
        });
        storage.set('useH2InComposer', activeItem.useH2 ? 1 : '');
      };
      if (body.length > MAX_BODY_SIZE) {
        win.confirm(
          'The request body is too long and will be truncated, continue?',
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
    events.on('updateStrictMode', function () {
      self.setState({});
    });
    self.updatePrettyData();
    $(document).on('click mousedown', function(e) {
      var target = $(e.target);
      if (!(target.closest('.w-composer-params').length ||
        target.closest('.w-composer-params-editor').length ||
        target.closest('.w-composer-dialog').length ||
        target.closest('.w-win-dialog').length ||
        target.closest('.w-context-menu').length)) {
        self.hideParams();
      }
      if (!(target.closest('.w-composer-history-data').length ||
        target.closest('.w-replay-count-dialog').length ||
        target.closest('.w-composer-history-btn').length ||
        target.closest('.w-copy-text-with-tips').length)) {
        self.hideHistory();
      }
    });
    events.trigger('composerDidMount');
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
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    this.refs.setRepeatTimes.hide();
    if (this._isReplay) {
      this.onReplay(this.state.repeatTimes);
    } else {
      this.execute(null, this.state.repeatTimes);
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
      setTimeout(this.loadHistory, 6000);
    });
  },
  getMethod: function () {
    var curMethod = this.state.method || 'GET';
    var method = ReactDOM.findDOMNode(this.refs.method).value || curMethod;
    return method === '+ Custom' ? method : curMethod;
  },
  updatePrettyData: function () {
    if (!this.state.showPretty) {
      return;
    }
    var headers = ReactDOM.findDOMNode(this.refs.headers).value;
    var prettyHeaders = util.parseHeaders(headers);
    this.refs.prettyHeaders.update(prettyHeaders);
    var body = ReactDOM.findDOMNode(this.refs.body).value;
    if (body && this.state.isHexText) {
      body = hexToStr(body);
    }
    body = util.parseQueryString(body, null, null, decodeURIComponent);
    this.refs.prettyBody.update(body);
  },
  update: function (item) {
    if (!item) {
      return;
    }
    var rulesHeaders = item.rulesHeaders;
    var rules = rulesHeaders && rulesHeaders[RULES_HEADER];
    if (rules) {
      rulesHeaders = $.extend({}, rulesHeaders);
      delete rulesHeaders[RULES_HEADER];
      this.updateRules(rules);
    }
    var refs = this.refs;
    var req = item.req;
    ReactDOM.findDOMNode(refs.url).value = item.url;
    ReactDOM.findDOMNode(refs.method).value = req.method;
    ReactDOM.findDOMNode(refs.headers).value = util.getOriginalReqHeaders(item, rulesHeaders);
    var bodyElem = ReactDOM.findDOMNode(refs.body);
    if (req.method === 'GET') {
      bodyElem.value = '';
    } else {
      var body = this.state.isHexText
        ? util.getHexText(util.getHex(req))
        : util.getBody(req);
      var value = getString(body);
      bodyElem.value = value;
    }
    this.updatePrettyData();
    this.updateUploadForm(req);
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
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  getComposerData: function() {
    var refs = this.refs;
    var method = this.getMethod();
    var url = ReactDOM.findDOMNode(this.refs.url).value.trim();
    var headers = ReactDOM.findDOMNode(this.refs.headers).value;

    return {
      url: url,
      headers: headers,
      method: method,
      useH2: this.state.useH2 ? 1 : '',
      body: ReactDOM.findDOMNode(refs.body).value.replace(/\r\n|\r|\n/g, '\r\n')
    };
  },
  saveComposer: function () {
    var data = this.getComposerData();
    this.state.url = data.url;
    this.state.headers = data.headers;
    storage.set('composerData', JSON.stringify(data));
    if (this.hasBody != hasReqBody(data.method, data.url, data.headers)) {
      this.setState({});
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
      if (!item.url || typeof item.url !== 'string') {
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
    if (this.state.showHints) {
      this.showHints();
    }
    return result;
  },
  onHexTextChange: function (e) {
    var isHexText = e.target.checked;
    storage.set('showHexTextBody', isHexText ? 1 : '');
    var elem = ReactDOM.findDOMNode(this.refs.body);
    var body = elem.value;
    if (body.trim()) {
      if (isHexText) {
        if (this._preBody === body) {
          elem.value = this._preHex;
        } else {
          elem.value = strToHex(body);
        }
      } else {
        this._preBody = hexToStr(body);
        this._preHex = body;
        elem.value = this._preBody;
      }
    }
    this.setState({ isHexText: isHexText });
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
    if (rules && typeof rules === 'string') {
      rules = util.decodeURIComponentSafe(rules);
      ReactDOM.findDOMNode(this.refs.composerRules).value = rules;
      this.setState({ rules: rules });
      this.onRulesChange();
      this.setRulesDisable(false);
    }
  },
  onCompose: function (item) {
    if (!item) {
      return;
    }
    this.state.tabName = 'Request';
    this.result = null;
    var refs = this.refs;
    var isHexText = !!item.isHexText;
    var headers = item.headers;
    var rules = [];
    if (util.notEStr(item.rules)) {
      rules.push(item.rules);
    }
    var req = { headers: {}, base64: item.base64 };
    if (util.notEStr(headers)) {
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
      this.updateRules(rules.join('\n'));
    }
    if (util.isString(item.url)) {
      ReactDOM.findDOMNode(refs.url).value = item.url;
      this.state.url = item.url;
    }
    if (util.isString(item.method)) {
      ReactDOM.findDOMNode(refs.method).value = item.method;
      this.state.method = item.method;
    }
    if (util.isString(headers)) {
      ReactDOM.findDOMNode(refs.headers).value = headers;
      this.state.headers = headers;
    }
    if (!isHexText && !item.body && item.base64) {
      isHexText = true;
    }
    var body = isHexText && item.base64
      ? util.getHexText(util.getHexFromBase64(item.base64))
      : item.body || '';
    this.state.tabName = 'Request';
    this.state.result = '';
    this.state.isHexText = isHexText;
    this.state.useH2 = item.useH2;
    if (item.disableBody != null) {
      this.state.disableBody = !!item.disableBody;
    } else if (body) {
      this.state.disableBody = false;
    }
    if (item.isCRLF != null) {
      this.state.isCRLF = !!item.isCRLF;
      storage.set('useCRLBody', item.isCRLF ? 1 : '');
    }
    if (item.disableComposerRules != null) {
      this.setRulesDisable(item.disableComposerRules);
    }
    if (item.enableProxyRules != null) {
      this.state.enableProxyRules = !!item.enableProxyRules;
      storage.set('composerProxyRules', item.enableProxyRules ? 1 : '');
    }
    if (!this.updateUploadForm(req)) {
      ReactDOM.findDOMNode(refs.body).value = body;
    }
    this.onComposerChange(true);
    storage.set('disableComposerBody', this.state.disableBody ? 1 : '');
    storage.set('useH2InComposer', item.useH2 ? 1 : '');
    storage.set('showHexTextBody', isHexText ? 1 : '');
  },
  onReplay: function (times) {
    if (this._selectedItem) {
      this.sendRequest($.extend({}, this._selectedItem, { repeatCount: times || 1 }));
    }
  },
  handleUrlKeyUp: function(e) {
    if (e.keyCode === 27) {
      this.hideHints();
    }
  },
  onUrlChange: function(e) {
    this.onComposerChange(e);
    clearTimeout(this._urlTimer);
    this._urlTimer = setTimeout(this.showHints, 300);
  },
  onComposerChange: function (e) {
    var self = this;
    clearTimeout(self.composerTimer);
    self.composerTimer = setTimeout(self.saveComposer, 1000);
    var target = e === true ? e : e && e.target;
    if (target) {
      if (target === true || target.nodeName === 'SELECT') {
        var method = ReactDOM.findDOMNode(self.refs.method).value;
        self.setState({ method: method }, self.updatePrettyData);
      }
      if (target === true || target.name === 'headers') {
        clearTimeout(self.typeTimer);
        self.typeTimer = setTimeout(function () {
          var headers = ReactDOM.findDOMNode(self.refs.headers).value;
          self.setState({
            type: getType(util.parseHeaders(headers))
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
    var type = target.getAttribute('data-type');
    if (type) {
      this.setState({ type: type });
      type = TYPES[type];
      var elem = ReactDOM.findDOMNode(this.refs.headers);
      var headers = util.parseHeaders(elem.value);
      Object.keys(headers).forEach(function (name) {
        if (name.toLowerCase() === 'content-type') {
          if (type) {
            var addon = TYPE_CONF_RE.test(headers[name]) ? RegExp['$&'] : '';
            headers[name] = type + addon;
            type = null;
          } else {
            delete headers[name];
          }
        }
      });
      if (type) {
        headers['Content-Type'] = type;
      }
      elem.value = util.objectToString(headers);
      this.updatePrettyData();
      this.saveComposer();
    }
  },
  addHeader: function () {
    this.refs.prettyHeaders.onAdd();
  },
  addField: function () {
    this.refs.prettyBody.onAdd();
  },
  addUploadFiled: function () {
    this.refs.uploadBody.onAdd();
  },
  onHeaderChange: function (key, newKey) {
    var refs = this.refs;
    var headers = refs.prettyHeaders.toString();
    ReactDOM.findDOMNode(refs.headers).value = headers;
    this.saveComposer();
    if (
      key.toLowerCase() === 'content-type' ||
      (newKey && newKey.toLowerCase() === 'content-type')
    ) {
      this.setState({
        type: getType(util.parseHeaders(headers))
      });
    }
  },
  onFieldChange: function () {
    var refs = this.refs;
    var body = refs.prettyBody.toString();
    if (body && this.state.isHexText) {
      body = strToHex(body);
    }
    ReactDOM.findDOMNode(refs.body).value = body;
    this.saveComposer();
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
      if (Array.isArray(value)) {
        value.push(getValue(field));
      } else {
        result[field.name] = value == null ? getValue(field) : [value, getValue(field)];
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
        'The current version of Node.js cannot support HTTP/2.\nPlease upgrade to the latest LTS version.',
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
    this.hideHints();
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
    self.refs.setRepeatTimes.show();
    self._isReplay = isReplay;
    ReactDOM.findDOMNode(self.refs.repeatBtn).innerHTML = isReplay ? 'Replay' : 'Send';
    setTimeout(function () {
      var input = ReactDOM.findDOMNode(self.refs.repeatTimes);
      input.select();
      input.focus();
    }, 300);
  },
  execute: function (e, times) {
    times = times > 0 ? Math.min(MAX_REPEAT_TIMES, times) : undefined;
    if (e && !times && e.target.nodeName === 'INPUT' && e.keyCode !== 13) {
      return;
    }
    if (e && e.shiftKey) {
      return this.showRepeatTimes();
    }
    var refs = this.refs;
    var url = ReactDOM.findDOMNode(refs.url).value.trim();
    if (!url || this.state.pending) {
      return;
    }
    this.onComposerChange();
    this.setState({ tabName: 'Request' });
    var disableComposerRules =
      dataCenter.isStrictMode() || this.state.disableComposerRules;
    var rules = disableComposerRules ? null : this.state.rules;
    var headersStr = ReactDOM.findDOMNode(refs.headers).value;
    var headers = headersStr;
    if (typeof rules === 'string' && (rules = rules.trim())) {
      var obj = util.parseJSON(headers);
      var result = [];
      var customRules;
      rules = [rules];
      if (obj) {
        Object.keys(obj).forEach(function (key) {
          if (key.toLowerCase() === RULES_HEADER) {
            var value = obj[key];
            try {
              value =
                typeof value === 'string' ? decodeURIComponent(value) : '';
            } catch (e) {}
            value && rules.push(value);
            delete obj[key];
          }
        });
        customRules = escapeRules(rules);
        if (customRules) {
          obj[RULES_HEADER] = customRules;
        }
        headers = JSON.stringify(obj);
      } else {
        headers.split(/\r\n|\r|\n/).forEach(function (line) {
          var index = line.indexOf(': ');
          if (index === -1) {
            index = line.indexOf(':');
          }
          var key = index === -1 ? line : line.substring(0, index);
          key = key.toLowerCase();
          if (key === RULES_HEADER) {
            var value = line.substring(index + 1).trim();
            try {
              value = decodeURIComponent(value);
            } catch (e) {}
            rules.push(value);
          } else {
            result.push(line);
          }
        });
        customRules = escapeRules(rules);
        if (customRules) {
          result.push(RULES_HEADER + ': ' + customRules);
        }
        headers = result.join('\n');
      }
    }
    var self = this;
    var method = self.getMethod();
    var body, base64, isHexText;
    if (self.localFileBase64 != null) {
      if (hasReqBody(method, url, headersStr)) {
        base64 = self.localFileBase64;
      }
      self.localFileBase64 = null;
    } else if (!self.state.disableBody && hasReqBody(method, url, headersStr)) {
      if (self.state.type === 'upload') {
        var uploadData = util.getMultiBody(this.refs.uploadBody.getFields());
        var boundary = uploadData.boundary;
        var ctnLen = uploadData.length;
        base64 = uploadData.base64;
        var obj2 = util.parseJSON(headers);
        var type;
        if (obj2) {
          Object.keys(obj2).forEach(function (key) {
            key = key.toLowerCase();
            if (key === 'content-type') {
              type = type || obj2[key];
              delete obj2[key];
            } else if (key === 'content-length') {
              delete obj2[key];
            }
          });
          obj2['Content-Type'] = getUploadType(type, boundary);
          obj2['Content-Length'] = ctnLen;
          headers = JSON.stringify(obj2);
        } else {
          var list = [];
          headers.split(/\r\n|\r|\n/).forEach(function (line) {
            var index = line.indexOf(': ');
            if (index === -1) {
              index = line.indexOf(':');
            }
            var key = index === -1 ? line : line.substring(0, index);
            key = key.toLowerCase();
            if (key === 'content-type') {
              type = type || line.substring(index + 1).trim();
            } else if (key !== 'content-length') {
              list.push(line);
            }
          });
          list.push('Content-Type: ' + getUploadType(type, boundary));
          list.push('Content-Length: ' + ctnLen);
          headers = list.join('\n');
        }
      } else {
        body = ReactDOM.findDOMNode(refs.body).value;
        isHexText = this.state.isHexText;
        if (isHexText) {
          base64 = util.getBase64FromHexText(body);
          body = undefined;
        } else if (body && this.state.isCRLF) {
          body = body.replace(/\r\n|\r|\n/g, '\r\n');
        }
      }
    }
    this.sendRequest({
      useH2: this.state.useH2 ? 1 : '',
      needResponse: true,
      url: url.replace(/^\/\//, ''),
      headers: headers,
      method: method,
      body: body,
      base64: base64,
      repeatCount: times,
      isHexText: isHexText,
      enableProxyRules: this.state.enableProxyRules
    });
  },
  sendRequest: function(params) {
    var self = this;
    clearTimeout(self.comTimer);
    self.comTimer = setTimeout(function () {
      self.setState({ pending: false });
    }, 3000);
    events.trigger('enableRecord');
    dataCenter.composer(
      JSON.stringify(params),
      function (data, xhr, em) {
        clearTimeout(self.comTimer);
        var state = {
          pending: false,
          tabName: 'Response',
          initedResponse: true
        };
        if (!data || data.ec !== 0) {
          var status = xhr && xhr.status;
          if (status) {
            em = status;
            util.showSystemError(xhr);
          } else if (!em || typeof em !== 'string' || em === 'error') {
            em = 'Please check the proxy settings or whether whistle has been started.';
          }
          state.result = { url: params.url, req: '', res: { statusCode: em } };
        } else {
          var res = data.res;
          if (res) {
            res.rawHeaders = dataCenter.getRawHeaders(
              res.headers,
              res.rawHeaderNames
            );
            res.rawTrailers = dataCenter.getRawHeaders(
              res.trailers,
              res.rawTrailerNames
            );
          } else {
            data.res = { statusCode: 200 };
          }
          data.url = params.url;
          data.req = '';
          state.result = data;
        }
        self.setState(state);
      },
      {
        contentType: 'application/json',
        processData: false
      }
    );
    params.date = Date.now();
    params.body = params.body || '';
    this.addHistory(params);
    events.trigger('executeComposer');
    self.setState({ result: '', pending: true });
  },
  selectAll: function (e) {
    e.target.select();
    this.showHints();
  },
  saveRules: function () {
    var rules = ReactDOM.findDOMNode(this.refs.composerRules).value;
    this.state.rules = rules;
    storage.set('composerRules', rules);
    this.setState({});
  },
  formatJSON: function () {
    var body = ReactDOM.findDOMNode(this.refs.body);
    if (!body.value.trim()) {
      return;
    }
    var data = util.parseRawJson(body.value);
    if (data) {
      body.value = JSON.stringify(data, null, '  ');
      this.saveComposer();
    }
  },
  onRulesChange: function () {
    clearTimeout(this.rulesTimer);
    this.rulesTimer = setTimeout(this.saveRules, 600);
  },
  onKeyDown: function (e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.keyCode == 68) {
        e.target.value = '';
        e.preventDefault();
        e.stopPropagation();
      } else if (e.keyCode == 88) {
        e.stopPropagation();
      }
    }
  },
  showCookiesDialog: function() {
    var self = this;
    var url = ReactDOM.findDOMNode(self.refs.url).value;
    var host = util.getHostname(url).toLowerCase();
    if (!/^[a-z.\d_-]+$/.test(host)) {
      return message.warn('No cookies');
    }
    if (self._pending) {
      return;
    }
    self._pending = true;
    dataCenter.getCookies({ domain: host }, function (result, xhr) {
      self._pending = false;
      if (!result) {
        return util.showSystemError(xhr);
      }
      result = result.cookies || [];
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
        return message.warn('No cookies');
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
    var elem = ReactDOM.findDOMNode(this.refs.headers);
    var headers = util.parseHeaders(elem.value);
    headers.cookie = cookie;
    elem.value = util.objectToString(headers);
    if (this.state.showPretty) {
      this.refs.prettyHeaders.update(headers);
    }
    this.saveComposer();
  },
  setUrl: function(value) {
    ReactDOM.findDOMNode(this.refs.url).value = value || '';
    this.hideHints();
    this.onComposerChange();
  },
  clickHints: function(e) {
    var value = e.target.title;
    value && this.setUrl(value);
  },
  onUrlKeyDown: function(e) {
    var elem;
    if (e.keyCode === 38) {
      // up
      elem = this.hintElem.find('.w-active');
      if (!this.state.showHints) {
        this.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.prev('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = this.hintElem.find('li:last');
        elem.addClass('w-active');
      }
      util.ensureVisible(elem, this.hintElem);
      e.preventDefault();
    } else if (e.keyCode === 40) {
      // down
      elem = this.hintElem.find('.w-active');
      if (!this.state.showHints) {
        this.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.next('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = this.hintElem.find('li:first');
        elem.addClass('w-active');
      }
      util.ensureVisible(elem, this.hintElem);
      e.preventDefault();
    } else if (e.keyCode === 13) {
      elem = this.hintElem.find('.w-active');
      var value = elem.attr('title');
      value && this.setUrl(value);
    } else {
      var curUrl = e.target.value;
      this.onKeyDown(e);
      if (curUrl && !e.target.value) {
        this.showHints();
        this.setUrl();
      }
    }
  },
  onTabChange: function (e) {
    var tabName = e.target.name || 'Request';
    if (tabName === this.state.tabName) {
      return;
    }
    this.setState({ tabName: tabName, initedResponse: true });
  },
  onContextMenu: function(e) {
    e.preventDefault();
    var data = util.getMenuPosition(e, 125);
    data.list = SEND_CTX_MENU;
    SEND_CTX_MENU[2].name = this.state.showHistory ? 'Hide History' : 'Show History';
    this.refs.contextMenu.show(data);
    this.hideHints();
  },
  showHints: function() {
    var list = this._histroyUrls;
    if (!list || !list.length) {
      this.state.showHints = true;
      return this.loadHistory();
    }
    var curUrl = ReactDOM.findDOMNode(this.refs.url).value.trim();
    var keyword = curUrl.toLowerCase();
    var urlHints = keyword ? list.filter(function(url) {
      return url.toLowerCase().indexOf(keyword) !== -1;
    }) : list;
    if (urlHints.length === 1 && curUrl === urlHints[0]) {
      urlHints = null;
    }
    this.setState({ showHints: true, urlHints: urlHints });
  },
  hideHints: function() {
    if (this.state.showHints) {
      $(this.refs.hints).find('.w-active').removeClass('w-active');
    }
    this.setState({ showHints: false });
  },
  showParams: function() {
    var url = ReactDOM.findDOMNode(this.refs.url).value.replace(/#.*$/, '');
    var index = url.indexOf('?');
    var hasQuery = index !== -1;
    var query = hasQuery ? url.substring(index + 1) : '';
    var params = util.parseQueryString(query, null, null, decodeURIComponent);
    this.refs.paramsEditor.update(params);
    if (this.state.showParams) {
      this.setState({ hasQuery: hasQuery });
    } else {
      this.setState({ showParams: true, hasQuery: hasQuery });
    }
  },
  hideParams: function() {
    if (this.state.showParams) {
      this.setState({ showParams: false });
    }
  },
  toggleParams: function() {
    if (this.state.showParams) {
      this.hideParams();
    } else {
      this.showParams();
    }
  },
  clearQuery: function() {
    var self = this;
    win.confirm('Are you sure to delete all params?', function(sure) {
      if (sure) {
        self.refs.paramsEditor.clear();
        self.hideParams();
      }
    });
  },
  addQueryParam: function() {
    this.refs.paramsEditor.onAdd();
  },
  onParamsChange: function () {
    var query = this.refs.paramsEditor.toString();
    var elem = ReactDOM.findDOMNode(this.refs.url);
    elem.value = util.replacQuery(elem.value, query);
    this.saveComposer();
    this.setState({ hasQuery: !!query });
  },
  onClickContextMenu: function (action) {
    switch (action) {
    case 'Repeat Times':
      return this.showRepeatTimes();
    case 'history':
      return this.toggleHistory();
    case 'file':
      this.uploadFile();
    }
  },
  uploadFile: function() {
    if (!this.reading) {
      ReactDOM.findDOMNode(this.refs.readLocalFile).click();
    }
  },
  readLocalFile: function () {
    var form = new FormData(ReactDOM.findDOMNode(this.refs.readLocalFileForm));
    var file = form.get('localFile');
    if (file.size > MAX_FILE_SIZE) {
      return win.alert('The size of all files cannot exceed 20m.');
    }
    var modal = this.state.modal || '';
    var size = file.size;
    Object.keys(modal).forEach(function (key) {
      size += modal[key].size;
    });
    if (size > MAX_FILE_SIZE) {
      return win.alert('The size of all files cannot exceed 20m.');
    }
    var self = this;
    self.reading = true;
    util.readFile(file, function (data) {
      self.reading = false;
      self.localFileBase64 = util.bytesToBase64(data);
      self.execute();
    });
    ReactDOM.findDOMNode(this.refs.readLocalFile).value = '';
  },
  import: function(e) {
    events.trigger('importSessions', e);
  },
  copyAsCURL: function() {
    var state = this.state;
    var body = ReactDOM.findDOMNode(this.refs.body).value;
    var base64 = '';
    if (state.isHexText) {
      base64 = util.getBase64FromHexText(body);
      body = '';
    }
    var text = util.asCURL({
      url: state.url || '',
      req: {
        method: state.method,
        headers: util.parseHeaders(state.headers),
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
    events.trigger('download', {
      name: 'composer_' + Date.now() + '.txt',
      value: JSON.stringify(data, null, '  ')
    });
  },
  onBodyStateChange: function (e) {
    var disableBody = !e.target.checked;
    this.setState({ disableBody: disableBody });
    storage.set('disableComposerBody', disableBody ? 1 : '');
    if (!disableBody) {
      this.setState({ tabName: 'Request' });
    }
  },
  focusEnableBody: function () {
    this.setState({ disableBody: false });
    storage.set('disableComposerBody', '');
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
    var showParams = state.showParams;
    var showRequest = tabName === 'Request';
    var showResponse = tabName === 'Response';
    var statusCode = result ? result.res && result.res.statusCode : '';
    var isForm = type === 'form';
    var method = state.method;
    var hasBody = hasReqBody(method, state.url, state.headers);
    var showPrettyBody = showPretty && isForm && hasBody;
    var showUpload = type === 'upload' && hasBody;
    var isStrictMode = dataCenter.isStrictMode();
    var disableComposerRules = isStrictMode || state.disableComposerRules;
    var isHexText = state.isHexText;
    var isCRLF = state.isCRLF;
    var disableBody = state.disableBody;
    var lockBody = pending || disableBody;
    var showHistory = state.showHistory;
    var urlHints = state.urlHints;
    var hasQuery = state.hasQuery;
    var enableProxyRules = state.enableProxyRules;
    self.hasBody = hasBody;

    return (
      <div
        className={
          'fill box w-detail-content w-detail-composer' +
          (showHistory ? ' w-show-history' : '') +
          (util.getBoolean(self.props.hide) ? ' hide' : '')
        }
      >
        <div className="fill orient-vertical-box">
          <div className="w-composer-url box">
            <span className={'glyphicon glyphicon-time w-status-' +
              (showHistory ? 'show' : 'hide') + ' w-composer-history-btn'}
              title={(showHistory ? 'Hide' : 'Show') + ' history list'}
              onClick={this.toggleHistory}
            />
            <select
              disabled={pending}
              value={method}
              onChange={this.onComposerChange}
              ref="method"
              className="form-control w-composer-method"
            >
              {METHODS.map(function (m) {
                return <option value={m}>{m}</option>;
              })}
            </select>
            <input
              readOnly={pending}
              defaultValue={state.url}
              onChange={this.onUrlChange}
              onKeyUp={this.handleUrlKeyUp}
              onKeyDown={this.onUrlKeyDown}
              onFocus={this.selectAll}
              onDoubleClick={this.showHints}
              onBlur={this.hideHints}
              ref="url"
              type="text"
              maxLength="8192"
              placeholder="Input the url"
              className="fill w-composer-input"
            />
            <button
              className="btn btn-default w-composer-params"
              onClick={self.toggleParams}
            >
              Params
            </button>
            <button
              disabled={pending}
              onClick={this.execute}
              onContextMenu={self.onContextMenu}
              className="btn btn-primary w-composer-execute"
            >
              <span className="glyphicon glyphicon-send" />
            </button>
            <div
              className="w-filter-hint"
              style={{ display: state.showHints && urlHints && urlHints.length ? '' : 'none' }}
              onMouseDown={util.preventBlur}
            >
              <div className="w-filter-bar">
                <a onClick={this.toggleHistory}>
                  {showHistory ? 'Hide' : 'Show'} history
                </a>
                <span onClick={self.hideHints} aria-hidden="true">
                  &times;
                </span>
              </div>
              <ul ref="hints" onClick={this.clickHints}>
                {
                  urlHints ? urlHints.map(function(item) {
                    return <li title={item}>{item}</li>;
                  }) : null
                }
              </ul>
            </div>
          </div>
          <div
            className={'w-layer w-composer-params-editor orient-vertical-box' + (showParams ? '' : ' hide')}
          >
            <div className="w-filter-bar">
              <span onClick={self.hideParams} aria-hidden="true">
                &times;
              </span>
              <a style={{display: hasQuery ? null : 'none'}} className="w-params-clear-btn" onClick={this.clearQuery}>
                <span className="glyphicon glyphicon-trash" />Clear
              </a>
              <a onClick={this.addQueryParam}>
                +Param
              </a>
            </div>
            <PropsEditor
              ref="paramsEditor"
              onChange={this.onParamsChange}
              callback={this.execute}
            />
          </div>
          <Divider vertical="true" leftWidth="90">
            <div
              ref="rulesCon"
              onDoubleClick={this.enableRules}
              title={isStrictMode ? TIPS : undefined}
              className="orient-vertical-box fill w-composer-rules"
            >
              <div className="w-detail-inspectors-title">
                <label className="w-composer-rules-label">
                  <input
                    disabled={pending}
                    onChange={this.onDisableChange}
                    checked={!state.disableComposerRules}
                    type="checkbox"
                  />
                  Rules
                </label>
                +
                <label className="w-composer-proxy-rules" title="Whether to use the Rules in Whistle?">
                  <input
                    disabled={pending}
                    type="checkbox"
                    onChange={this.onProxyRules}
                    checked={enableProxyRules}
                  />
                  Whistle Rules
                </label>
                <label className="w-composer-pretty">
                  <input
                    onChange={this.onShowPretty}
                    type="checkbox"
                    checked={showPretty}
                  />
                  Pretty
                </label>
                <label className="w-composer-enable-body">
                  <input
                    disabled={pending}
                    checked={!disableBody}
                    type="checkbox"
                    onChange={this.onBodyStateChange}
                  />
                  Body
                </label>
                <label className="w-composer-use-h2">
                  <input
                    disabled={pending}
                    type="checkbox"
                    onChange={this.toggleH2}
                    checked={dataCenter.supportH2 && useH2}
                  />
                  HTTP/2
                </label>
                <div className="w-composer-btns">
                  <a draggable="false" onClick={self.import}>Import</a>
                  <a draggable="false" onClick={self.export}>Export</a>
                  <a draggable="false" onClick={self.copyAsCURL}>CopyAsCURL</a>
                </div>
              </div>
              <textarea
                readOnly={disableComposerRules || pending}
                defaultValue={rules}
                ref="composerRules"
                onChange={this.onRulesChange}
                onDoubleClick={this.enableRules}
                style={{
                  background:
                    !disableComposerRules && rules ? 'lightyellow' : undefined
                }}
                maxLength="8192"
                className="fill orient-vertical-box w-composer-rules"
                placeholder={'Input the rules (' + (enableProxyRules ? 'Use the' : 'The') +
                  ' Rules in Whistle' + (enableProxyRules ? ' first' : ' ignored') + ')'}
              />
            </div>
            <div className="orient-vertical-box fill">
              <div className="w-detail-inspectors-title w-composer-tabs">
                <button
                  onClick={this.onTabChange}
                  name="Request"
                  className={showRequest ? 'w-tab-btn w-active' : 'w-tab-btn'}
                >
                  Request
                </button>
                <button
                  title={result.url}
                  onClick={this.onTabChange}
                  name="Response"
                  className={showResponse ? 'w-tab-btn w-active' : 'w-tab-btn'}
                >
                  Response
                </button>
              </div>
              <Divider hide={!showRequest} vertical="true">
                <div className="fill orient-vertical-box w-composer-headers">
                  <div
                    className="w-composer-bar"
                    onChange={this.onTypeChange}
                  >
                    <label>
                      <input
                        onChange={this.onShowPretty}
                        type="checkbox"
                        checked={showPretty}
                      />
                      Pretty
                    </label>
                    <label className="w-composer-label">Type:</label>
                    <label>
                      <input
                        disabled={pending}
                        data-type="form"
                        name="type"
                        type="radio"
                        checked={isForm}
                      />
                      Form
                    </label>
                    <label>
                      <input
                        disabled={pending}
                        data-type="upload"
                        name="type"
                        type="radio"
                        checked={type === 'upload'}
                      />
                      Upload
                    </label>
                    <label>
                      <input
                        disabled={pending}
                        data-type="json"
                        name="type"
                        type="radio"
                        checked={type === 'json'}
                      />
                      JSON
                    </label>
                    <label>
                      <input
                        disabled={pending}
                        data-type="text"
                        name="type"
                        type="radio"
                        checked={type === 'text'}
                      />
                      Text
                    </label>
                    <label>
                      <input
                        data-type="custom"
                        name="type"
                        type="radio"
                        checked={type === 'custom'}
                      />
                      Raw
                    </label>
                    <button
                      disabled={pending}
                      className={
                        'w-composer-add-header btn btn-primary' + (showPretty ? '' : ' hide')
                      }
                      onClick={this.addHeader}
                    >
                      +Header
                    </button>
                    <button
                      disabled={pending}
                      className="btn btn-default"
                      onClick={this.showCookiesDialog}
                    >
                      Cookies
                    </button>
                  </div>
                  <textarea
                    readOnly={pending}
                    defaultValue={state.headers}
                    onChange={this.onComposerChange}
                    maxLength={MAX_HEADERS_SIZE}
                    onKeyDown={this.onKeyDown}
                    ref="headers"
                    placeholder="Input the headers"
                    name="headers"
                    className={
                      'fill orient-vertical-box' + (showPretty ? ' hide' : '')
                    }
                  />
                  <PropsEditor
                    disabled={pending}
                    ref="prettyHeaders"
                    isHeader="1"
                    hide={!showPretty}
                    onChange={this.onHeaderChange}
                    callback={this.execute}
                  />
                </div>
                <div className="fill orient-vertical-box w-composer-body">
                  <div className="w-composer-bar">
                    <label className="w-composer-label">
                      <input
                        disabled={pending}
                        checked={!disableBody}
                        type="checkbox"
                        onChange={this.onBodyStateChange}
                      />
                      Body
                    </label>
                    <label
                      className={
                        'w-composer-hex-text' +
                        (isHexText ? ' w-checked' : '') +
                        (showUpload || showPrettyBody ? ' hide' : '')
                      }
                      onDoubleClick={this.focusEnableBody}
                    >
                      <input
                        disabled={lockBody}
                        checked={isHexText}
                        type="checkbox"
                        onChange={this.onHexTextChange}
                      />
                      HexText
                    </label>
                    <label
                      className={
                        'w-composer-crlf' +
                        (isHexText || showPrettyBody || showUpload ? ' hide' : '') +
                        (isCRLF ? ' w-checked' : '')
                      }
                      onDoubleClick={this.focusEnableBody}
                    >
                      <input
                        disabled={lockBody}
                        checked={isCRLF}
                        onChangeCapture={this.onCRLFChange}
                        type="checkbox"
                      />
                      \r\n
                    </label>
                    <button
                      disabled={lockBody}
                      className={
                        'btn btn-default' +
                        (showPrettyBody || isHexText || showUpload
                          ? ' hide'
                          : '')
                      }
                      onClick={this.formatJSON}
                    >
                      Format
                    </button>
                    <button
                      disabled={lockBody}
                      className={
                        'btn btn-primary' +
                        ((showPrettyBody && !isHexText) || showUpload
                          ? ''
                          : ' hide')
                      }
                      onClick={
                        showUpload ? this.addUploadFiled : this.addField
                      }
                    >
                      +Param
                    </button>
                  </div>
                  <textarea
                    readOnly={lockBody}
                    defaultValue={state.body}
                    onChange={this.onComposerChange}
                    maxLength={MAX_BODY_SIZE}
                    onDoubleClick={this.focusEnableBody}
                    style={{
                      background:
                        hasBody && !disableBody ? 'lightyellow' : undefined,
                      fontFamily: isHexText ? 'monospace' : undefined
                    }}
                    onKeyDown={this.onKeyDown}
                    ref="body"
                    placeholder={
                      hasBody
                        ? 'Input the ' + (isHexText ? 'hex text' : 'body')
                        : method + ' operations cannot have a request body'
                    }
                    title={
                      hasBody
                        ? undefined
                        : method + ' operations cannot have a request body'
                    }
                    className={
                      'fill orient-vertical-box' +
                      (showPrettyBody  || showUpload
                        ? ' hide'
                        : '')
                    }
                  />
                  <PropsEditor
                    onDoubleClick={this.focusEnableBody}
                    disabled={lockBody}
                    ref="prettyBody"
                    hide={!showPrettyBody || showUpload}
                    onChange={this.onFieldChange}
                    callback={this.execute}
                  />
                  <PropsEditor
                    onDoubleClick={this.focusEnableBody}
                    disabled={lockBody}
                    ref="uploadBody"
                    hide={!showUpload}
                    onChange={this.updateUploadData}
                    onUpdate={this.updateUploadData}
                    callback={this.execute}
                    allowUploadFile
                    title={
                      hasBody
                        ? undefined
                        : method + ' operations cannot have a request body'
                    }
                  />
                </div>
              </Divider>
              {state.initedResponse ? (
                <div
                  style={{ display: showResponse ? undefined : 'none' }}
                  className={'w-composer-res w-composer-res-' + getStatus(statusCode)}
                >
                  <button
                    onClick={this.onTabChange}
                    name="Request"
                    className="btn btn-default w-composer-back-btn"
                    title="Back to Request"
                  >
                    <span className="glyphicon glyphicon-menu-left"></span>
                  </button>
                  <Properties
                    modal={{
                      'Status Code':
                        statusCode == null ? 'aborted' : statusCode
                    }}
                  />
                </div>
              ) : undefined}
              {state.initedResponse ? (
                <ResDetail
                  inComposer="1"
                  modal={result}
                  hide={!showResponse}
                />
              ) : undefined}
            </div>
          </Divider>
        </div>
        <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
        <Dialog ref="setRepeatTimes" wstyle="w-replay-count-dialog">
          <div className="modal-body">
            <label>
              Times:
              <input
                ref="repeatTimes"
                placeholder={'<= ' + MAX_REPEAT_TIMES}
                onKeyDown={this.repeatRequest}
                onChange={this.repeatTimesChange}
                value={state.repeatTimes}
                className="form-control"
                maxLength="3"
              />
            </label>
            <button
              type="button"
              ref="repeatBtn"
              onKeyDown={this.repeatRequest}
              tabIndex="0"
              onMouseDown={util.preventBlur}
              className="btn btn-primary"
              onClick={this.repeatRequest}
              disabled={!state.repeatTimes}
            >
              Send
            </button>
          </div>
        </Dialog>
        <CookiesDialog onInsert={this.insertCookie} ref="cookiesDialog" />
        <HistoryData
          show={showHistory}
          data={state.historyData}
          onClose={this.hideHistory}
          onReplay={this.handeHistoryReplay}
          onEdit={this.handleHistoryEdit}
        />
        <form
          ref="readLocalFileForm"
          encType="multipart/form-data"
          style={{ display: 'none' }}
        >
          <input
            ref="readLocalFile"
            onChange={this.readLocalFile}
            type="file"
            name="localFile"
          />
        </form>
      </div>
    );
  }
});

module.exports = Composer;
