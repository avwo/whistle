require('./base-css.js');
require('../css/composer.css');
var React = require('react');
var ReactDOM = require('react-dom');
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
var Dialog = require('./dialog');
var win = require('./win');

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
  { name: 'Repeat Times' },
  { name: 'Show History', action: 'history' }
];
var HISTORY_CTX_MENU = [
  { name: 'Replay' },
  { name: 'Replay Times' },
  { name: 'Compose' }
];
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
var MAX_HEADERS_SIZE = 1024 * 64;
var MAX_BODY_SIZE = 1024 * 128;
var MAX_COUNT = 64;
var ONE_MINS = 1000 * 60;
var MAX_REPEAT_TIMES = 100;
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

function removeDuplicateRules(rules) {
  rules = rules.join('\n').split(/\r\n|\r|\n/g);
  var map = {};
  rules = rules
    .filter(function (line) {
      line = line.replace(/#.*$/, '').trim();
      if (!line || map[line]) {
        return false;
      }
      map[line] = 1;
      return true;
    })
    .join('\n');
  return encodeURIComponent(rules);
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

var Composer = React.createClass({
  getInitialState: function () {
    var rules = storage.get('composerRules');
    var data = util.parseJSON(storage.get('composerData')) || {};
    var showPretty = storage.get('showPretty') == '1';
    var useH2 = storage.get('useH2InComposer') == '1';
    var disableComposerRules = storage.get('disableComposerRules') == '1';
    var method = data.method;
    var body = getString(data.body);
    this.uploadBodyData = util.parseJSON(storage.get('composerUploadBody'));
    if (body && body !== data.body) {
      message.warn(
        'The length of the body cannot exceed 128k, and the excess will be truncated.'
      );
    }
    return {
      loading: true,
      repeatTimes: 1,
      historyData: [],
      showHistory: !!storage.get('showHistory'),
      disableBody: !!storage.get('disableComposerBody'),
      url: data.url,
      method: METHODS.indexOf(method) === -1 ? 'GET' : method,
      headers: getString(data.headers, MAX_HEADERS_SIZE),
      body: body,
      tabName: 'Request',
      showPretty: showPretty,
      useH2: useH2,
      rules: typeof rules === 'string' ? rules : '',
      type: getType(util.parseHeaders(data.headers)),
      disableComposerRules: disableComposerRules,
      isHexText: !!storage.get('showHexTextBody'),
      isCRLF: !!storage.get('useCRLBody')
    };
  },
  componentDidMount: function () {
    var self = this;
    self.update(self.props.modal);
    this.refs.uploadBody.update(this.uploadBodyData);
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
    self.state.showHistory && self.loadHistory();
  },
  repeatTimesChange: function (e) {
    var count = e.target.value.replace(/^\s*0*|[^\d]+/, '');
    var repeatTimes = count.slice(0, 3);
    if (repeatTimes > MAX_REPEAT_TIMES) {
      repeatTimes = MAX_REPEAT_TIMES;
    }
    this.setState({ repeatTimes: repeatTimes });
  },
  sendRepeat: function(e) {
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
    body = util.parseQueryString(body, null, null, decodeURIComponent);
    this.refs.prettyBody.update(body);
  },
  update: function (item) {
    if (!item) {
      return;
    }
    var refs = this.refs;
    var req = item.req;
    ReactDOM.findDOMNode(refs.url).value = item.url;
    ReactDOM.findDOMNode(refs.method).value = req.method;
    ReactDOM.findDOMNode(refs.headers).value = util.getOriginalReqHeaders(item);
    var bodyElem = ReactDOM.findDOMNode(refs.body);
    if (req.method === 'GET') {
      bodyElem.value = '';
    } else {
      var body = this.state.isHexText
        ? util.getHexText(util.getHex(req))
        : util.getBody(req);
      var value = getString(body);
      bodyElem.value = value;
      if (value !== body) {
        message.warn(
          'The length of request body > 128k, and has been truncated.'
        );
      }
    }
    this.updatePrettyData();
    if (util.isUploadForm(req)) {
      var fields = util.parseUploadBody(req);
      var uploadModal = {};
      var result = {};
      fields &&
        fields.forEach(function (field) {
          var name = field.name;
          var list = uploadModal[name];
          if (list) {
            list.push(field);
            result[name].push(field.value);
          } else {
            uploadModal[name] = [field];
            result[name] = [field.value];
          }
        });
      this.refs.uploadBody.update(uploadModal);
      storage.set('composerUploadBody', JSON.stringify(result));
    }
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  saveComposer: function () {
    var refs = this.refs;
    var method = this.getMethod();
    var url = ReactDOM.findDOMNode(this.refs.url).value.trim();
    var headers = ReactDOM.findDOMNode(this.refs.headers).value;
    this.state.url = url;
    this.state.headers = headers;
    var params = {
      url: url,
      headers: headers,
      method: method,
      useH2: this.state.useH2 ? 1 : '',
      body: ReactDOM.findDOMNode(refs.body).value.replace(/\r\n|\r|\n/g, '\r\n')
    };
    storage.set('composerData', JSON.stringify(params));
    if (this.hasBody != hasReqBody(method, url, headers)) {
      this.setState({});
    }
    return params;
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
        if (item.selected) {
          self._selectedItem = item;
          params.selected = true;
        }
        historyData.splice(i, 1);
        break;
      }
    }
    historyData.unshift(params);
    var overflow = historyData.length - MAX_COUNT;
    if (overflow > 0) {
      historyData.splice(MAX_COUNT, overflow);
      self._selectedItem = null;
      historyData.forEach(function (item) {
        if (item.selected) {
          self._selectedItem = item;
        }
      });
    }
    self.setState({ historyData: self.formatHistory(historyData) });
  },
  formatHistory: function (historyData) {
    var result = [];
    var curHours;
    historyData.forEach(function (item) {
      if (!item.url) {
        return;
      }
      var time = Math.floor(item.date / ONE_MINS);
      if (curHours !== time) {
        curHours = time;
        var date = new Date(item.date);
        result.push({
          title:
            date.getFullYear() +
            '-' +
            util.padding(date.getMonth() + 1) +
            '-' +
            util.padding(date.getDate()) +
            ' ' +
            util.padding(date.getHours()) +
            ':' +
            util.padding(date.getMinutes()),
          time: curHours
        });
      }
      if (!item.title) {
        var title = [
          item.method + ' ' + item.url + ' HTTP/' + (item.useH2 ? '2.0' : '1.1')
        ];
        item.body = item.body || '';
        item.headers && title.push(item.headers);
        title.push('\n', item.body);
        item.title = title.join('\n');
      }
      result.push(item);
    });
    return result;
  },
  onHexTextChange: function (e) {
    var isHexText = e.target.checked;
    storage.set('showHexTextBody', isHexText ? 1 : '');
    this.setState({ isHexText: isHexText });
    var body = ReactDOM.findDOMNode(this.refs.body).value;
    if (isHexText && util.getBase64FromHexText(body, true) === false) {
      message.error('The hex text cannot be converted to binary data.');
    }
  },
  onCRLFChange: function (e) {
    var isCRLF = e.target.checked;
    storage.set('useCRLBody', isCRLF ? 1 : '');
    this.setState({ isCRLF: isCRLF });
  },
  onCompose: function () {
    var item = this._selectedItem;
    if (!item) {
      return;
    }
    var refs = this.refs;
    var isHexText = !!item.isHexText;
    ReactDOM.findDOMNode(refs.url).value = item.url;
    ReactDOM.findDOMNode(refs.method).value = item.method;
    ReactDOM.findDOMNode(refs.headers).value = item.headers;
    var body = isHexText
      ? util.getHexText(util.getHexFromBase64(item.base64))
      : item.body || '';
    ReactDOM.findDOMNode(refs.body).value = body;
    this.state.tabName = 'Request';
    this.state.result = '';
    this.state.isHexText = isHexText;
    this.state.url = item.url;
    this.state.useH2 = item.useH2;
    this.state.headers = item.headers;
    this.state.method = item.method;
    if (body) {
      this.state.disableBody = false;
    }
    this.onComposerChange(true);
    storage.set('useH2InComposer', item.useH2 ? 1 : '');
  },
  onReplay: function (times) {
    this.onCompose();
    if (this._selectedItem) {
      this.execute(null, times);
      ReactDOM.findDOMNode(this.refs.historyList).scrollTop = 0;
    }
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
      if ((type = TYPES[type])) {
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
    ReactDOM.findDOMNode(refs.body).value = refs.prettyBody.toString();
    this.saveComposer();
  },
  onUploadFieldChange: function () {
    var fields = this.refs.uploadBody.getFields();
    var result = {};
    fields.forEach(function (field) {
      var value = result[field.name];
      if (value == null) {
        result[field.name] = field.value;
      } else if (Array.isArray(value)) {
        value.push(field.value);
      } else {
        result[field.name] = [value, field.value];
      }
    });
    storage.set('composerUploadBody', JSON.stringify(result));
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
  toggleHistory: function () {
    var showHistory = !this.state.showHistory;
    this.setState({ showHistory: showHistory });
    storage.set('showHistory', showHistory ? '1' : '');
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
          if (key.toLowerCase() === 'x-whistle-rule-value') {
            var value = obj[key];
            try {
              value =
                typeof value === 'string' ? decodeURIComponent(value) : '';
            } catch (e) {}
            value && rules.push(value);
            delete obj[key];
          }
        });
        customRules = removeDuplicateRules(rules);
        if (customRules) {
          obj['x-whistle-rule-value'] = customRules;
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
          if (key === 'x-whistle-rule-value') {
            var value = line.substring(index + 1).trim();
            try {
              value = decodeURIComponent(value);
            } catch (e) {}
            rules.push(value);
          } else {
            result.push(line);
          }
        });
        customRules = removeDuplicateRules(rules);
        if (customRules) {
          result.push('x-whistle-rule-value: ' + customRules);
        }
        headers = result.join('\n');
      }
    }
    var self = this;
    var method = self.getMethod();
    var body, base64, isHexText;
    if (!self.state.disableBody && hasReqBody(method, url, headersStr)) {
      if (self.state.type === 'upload') {
        var fields = this.refs.uploadBody.getFields();
        var uploadData = util.getMultiBody(fields);
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
          if (base64 === false) {
            win.alert(
              'The hex text cannot be converted to binary data.\nPlease uncheck the checkbox of HexText option.'
            );
            return;
          }
          body = undefined;
        } else if (body && this.state.isCRLF) {
          body = body.replace(/\r\n|\r|\n/g, '\r\n');
        }
      }
    }
    var params = {
      useH2: this.state.useH2 ? 1 : '',
      needResponse: true,
      url: url.replace(/^\/\//, ''),
      headers: headers,
      method: method,
      body: body,
      base64: base64,
      repeatCount: times,
      isHexText: isHexText
    };
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
            em =
              'Please check the proxy settings or whether whistle has been started.';
          }
          state.result = { url: url, req: '', res: { statusCode: em } };
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
          data.url = url;
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
    SEND_CTX_MENU[1].name = this.state.showHistory ? 'Hide History' : 'Show History';
    this.refs.contextMenu.show(data);
  },
  showHistoryMenu: function(e) {
    e.preventDefault();
    if (this.state.pending) {
      return;
    }
    var data = util.getMenuPosition(e, 120, 96);
    data.list = HISTORY_CTX_MENU;
    this.refs.contextMenu.show(data);
  },
  onClickContextMenu: function (action) {
    switch (action) {
    case 'Repeat Times':
      return this.showRepeatTimes();
    case 'history':
      return this.toggleHistory();
    case 'Replay':
      return this.onReplay();
    case 'Replay Times':
      return this.showRepeatTimes(true);
    case 'Compose':
      return this.onCompose();
    }
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
  selectItem: function (item) {
    if (item.selected) {
      return;
    }
    this.state.historyData.forEach(function (item) {
      item.selected = false;
    });
    item.selected = true;
    this._selectedItem = item;
    this.setState({});
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
    var historyData = state.historyData;
    self.hasBody = hasBody;

    return (
      <div
        className={
          'fill box w-detail-content w-detail-composer' +
          (showHistory ? ' w-show-history' : '') +
          (util.getBoolean(self.props.hide) ? ' hide' : '')
        }
      >
        <Divider hideLeft={!showHistory} leftWidth="150">
          <div
            className="fill orient-vertical-box w-history-data"
            onMouseDown={util.preventBlur}
          >
            {historyData.length ? null : (
              <div className="w-tips">
                {state.loading ? 'Loading' : 'No history data'}
              </div>
            )}
            <div className="fill w-history-list" ref="historyList">
              {historyData.map(function (item) {
                if (!item.url) {
                  return <p>{item.title}</p>;
                }
                return (
                  <div
                    onClick={function () {
                      self.selectItem(item);
                    }}
                    onDoubleClick={self.showHistoryMenu}
                    onContextMenu={function(e) {
                      self.selectItem(item);
                      self.showHistoryMenu(e);
                    }}
                    title={item.title}
                    className={item.selected ? 'w-selected' : null}
                  >
                    {item.method} {item.url}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="fill orient-vertical-box">
            <div className="w-composer-url box">
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
                onKeyUp={this.execute}
                onChange={this.onComposerChange}
                onKeyDown={this.onKeyDown}
                onFocus={this.selectAll}
                ref="url"
                type="text"
                maxLength="8192"
                placeholder="Input the url"
                className="fill w-composer-input"
              />
              <button
                disabled={pending}
                onClick={this.execute}
                onContextMenu={self.onContextMenu}
                className="btn btn-primary w-composer-execute"
              >
                <span className="glyphicon glyphicon-send" />
              </button>
            </div>
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
              <label className="w-composer-enable-body">
                <input
                  disabled={pending}
                  checked={!disableBody}
                  type="checkbox"
                  onChange={this.onBodyStateChange}
                />
                Body
              </label>
              <label className="w-composer-enable-rules">
                <input
                  disabled={pending}
                  onChange={this.onDisableChange}
                  checked={!state.disableComposerRules}
                  type="checkbox"
                />
                Rules
              </label>
              <label className="w-composer-use-h2">
                <input
                  disabled={pending}
                  type="checkbox"
                  onChange={this.toggleH2}
                  checked={dataCenter.supportH2 && useH2}
                />
                Use H2
              </label>
              <label className="w-composer-history">
                <input
                  disabled={pending}
                  type="checkbox"
                  onChange={this.toggleHistory}
                  checked={showHistory}
                />
                History
              </label>
            </div>
            <Divider vertical="true" rightWidth="120">
              <div className="orient-vertical-box fill">
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
                      <label
                        className="w-custom-type"
                        title="Directly modify Content-Type in the headers"
                      >
                        <input
                          data-type="custom"
                          name="type"
                          type="radio"
                          checked={type === 'custom'}
                          disabled
                        />
                        Custom
                      </label>
                      <button
                        disabled={pending}
                        className={
                          'btn btn-primary' + (showPretty ? '' : ' hide')
                        }
                        onClick={this.addHeader}
                      >
                        Add header
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
                          (showUpload ? ' hide' : '')
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
                          (isHexText || showUpload ? ' hide' : '') +
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
                        Format JSON
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
                        Add field
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
                        ((showPrettyBody && !isHexText) || showUpload
                          ? ' hide'
                          : '')
                      }
                    />
                    <PropsEditor
                      onDoubleClick={this.focusEnableBody}
                      disabled={lockBody}
                      ref="prettyBody"
                      hide={!showPrettyBody || isHexText || showUpload}
                      onChange={this.onFieldChange}
                    />
                    <PropsEditor
                      onDoubleClick={this.focusEnableBody}
                      disabled={lockBody}
                      ref="uploadBody"
                      hide={!showUpload}
                      onChange={this.onUploadFieldChange}
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
                    className={'w-composer-res-' + getStatus(statusCode)}
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
              <div
                ref="rulesCon"
                onDoubleClick={this.enableRules}
                title={isStrictMode ? TIPS : undefined}
                className="orient-vertical-box fill w-composer-rules"
              >
                <div className="w-detail-inspectors-title">
                  <label>
                    <input
                      disabled={pending}
                      onChange={this.onDisableChange}
                      checked={!state.disableComposerRules}
                      type="checkbox"
                    />
                    Rules
                  </label>
                </div>
                <textarea
                  disabled={disableComposerRules || pending}
                  defaultValue={rules}
                  ref="composerRules"
                  onChange={this.onRulesChange}
                  style={{
                    background:
                      !disableComposerRules && rules ? 'lightyellow' : undefined
                  }}
                  maxLength="8192"
                  className="fill orient-vertical-box w-composer-rules"
                  placeholder="Input the rules"
                />
              </div>
            </Divider>
          </div>
        </Divider>
        <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
        <Dialog ref="setRepeatTimes" wstyle="w-replay-count-dialog">
          <div className="modal-body">
            <label>
              Times:
              <input
                ref="repeatTimes"
                placeholder={'<= ' + MAX_REPEAT_TIMES}
                onKeyDown={this.sendRepeat}
                onChange={this.repeatTimesChange}
                value={state.repeatTimes}
                className="form-control"
                maxLength="3"
              />
            </label>
            <button
              type="button"
              ref="repeatBtn"
              onKeyDown={this.sendRepeat}
              tabIndex="0"
              onMouseDown={util.preventBlur}
              className="btn btn-primary"
              onClick={this.sendRepeat}
              disabled={!state.repeatTimes}
            >
              Send
            </button>
          </div>
        </Dialog>
      </div>
    );
  }
});

module.exports = Composer;
