var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var Dialog = require('./dialog');
var CopyBtn = require('./copy-btn');
var util = require('./util');
var dataCenter = require('./data-center');
var getSortedRules = require('./protocols').getSortedRules;
var win = require('./win');
var message = require('./message');
var events = require('./events');
var PropsEditor = require('./props-editor');

var MAX_LEN = 64;
var fakeIframe = 'javascript:"<style>html,body{padding:0;margin:0}</style><textarea></textarea>"';
var HIDE_STYLE = { display: 'none' };
var iframeStyle = {
  padding: 0,
  border: 'none',
  width: 840,
  height: 360,
  margin: 0,
  verticalAlign: 'top'
};
var VAL_SEP_RE = /^\s*?`{3,}\s*?$/mg;
var INLINE_PROTOCOLS = ['http://', 'https://', 'ws://', 'wss://', 'tunnel://', 'redirect://', 'statusCode://', 'style://',
'pipe://', 'host://', 'xhost://', 'proxy://', 'xproxy://', 'http-proxy://', 'xhttp-proxy://', 'https-proxy://', 'xhttps-proxy://',
'socks://', 'xsocks://', 'pac://', 'weinre://', 'log://', 'excludeFilter://', 'includeFilter://', 'ignore://', 'skip://', 'enable://',
'disable://', 'delete://', 'method://', 'replaceStatus://', 'referer://', 'auth://', 'ua://', 'cache://', 'attachment://', 'forwardedFor://',
'responseFor://', 'reqDelay://', 'resDelay://', 'reqSpeed://', 'resSpeed://', 'reqType://', 'resType://', 'reqCharset://', 'resCharset://', 
'reqWrite://', 'resWrite://', 'reqWriteRaw://', 'resWriteRaw://', 'cipher://', 'sniCallback://', 'lineProps://'];

function trim(str) {
  return str ? str.trim() : '';
}

function wrapValue(name, sep, str) {
  return '\n' + sep + ' ' + name + '\n' + str + '\n' + sep;
}

function getInlineValue(name, str) {
  name = trim(name);
  if (!name || !str) {
    return '';
  }
  var sep = '```';
  if(str.indexOf(sep) === -1) {
    return wrapValue(name, sep, str);
  }
  var list = str.match(VAL_SEP_RE).map(trim);
  for (var i = 0; i < 11; i++) {
    if (list.indexOf(sep) === -1) {
      return wrapValue(name, sep, str);
    }
    sep += '`';
  }

  return wrapValue(name, '````````````', str);
}

function getValue(item, key) {
  var req = item.req;
  var res = item.res || '';
  switch(key) {
  case 'blank':
    return '';
  case 'url':
    return item.url;
  case 'method':
    return req.method;
  case 'reqHeaders':
    return JSON.stringify(req.headers, null, '  ');
  case 'resHeaders':
    return item.res.headers ? JSON.stringify(res.headers, null, '  ') : '';
  case 'reqBody':
    return util.getBody(req, true);
  case 'resBody':
    return util.getBody(res);
  case 'reqJson':
    return util.getJsonStr(req, true, decodeURIComponent);
  case 'resJson':
    return util.getJsonStr(res);
  case 'reqRaw':
    return util.objectToString(req.headers, req.rawHeaderNames) + '\r\n\r\n' + util.getBody(req, true);
  case 'resRaw':
    return util.objectToString(res.headers, res.rawHeaderNames) + '\r\n\r\n' + util.getBody(res);
  case 'statusCode':
    return res.statusCode;
  }
  return '';
}

function isValue(str) {
  return str[0] === '(' && str[str.length - 1] === ')';
}

var MockDialog = React.createClass({
  getInitialState: function () {
    return {
      rules: '',
      dataSrc: 'resBody',
      valueType: 'file',
      protocol: 'file://',
      inlineValue: '',
      comment: ''
    };
  },
  show: function (item, dataSrc) {
    if (!item) {
      return;
    }
    var headers = item.res.headers;
    var type = util.getContentType(headers);
    var keyName = util.getFilename(item, true) || '';
    dataSrc = dataSrc || 'resBody';
    type = type ? type.toLowerCase() : '';
    if (type === 'img') {
      type = headers['content-type'];
      type = type.split('/')[1].split(';')[0].trim().toLowerCase().replace(/^x-/i, '');
    } else if (type === 'text') {
      type = 'txt';
    } else if (!type && /\.([\w-]+)$/.test(keyName)) {
      type = RegExp.$1;
    }
    type = type ? '.' + type : '';
    this.refs.mockDialog.show();
    this.setState({
      hasChanged: false,
      item: item,
      pattern: item.url,
      dataSrc: dataSrc,
      suffixType: type,
      valueType: 'file',
      keyName: keyName.substring(0, MAX_LEN),
      inlineKey: 'mock_' + util.getTempName() + type,
      protocol: 'file://'
    }, this.updateRules);
    var url = ReactDOM.findDOMNode(this.refs.url);
    setTimeout(function() {
      url.select();
      url.focus();
    }, 600);
    this._textarea.value = getValue(item, dataSrc);
  },
  onValueTypeChange: function(e) {
    var value = e.target.value;
    this.setState({
      valueType: value
    }, this.updateRules);
  },
  onProtoChange: function(e) {
    this.setState({
      protocol: e.target.value
    }, this.updateRules);
  },
  getValues: function() {
    var valueType = this.getValueType();
    var isFile = valueType === 'file';
    if (!isFile && valueType !== 'key') {
      return;
    }
    var values = {
      isFile: isFile,
      name: this.getKeyName()
    };
    var value = this._textarea.value;
    var dataSrc = this.state.dataSrc;
    var item = this.state.item;
    if (isFile && value === getValue(item, dataSrc)) {
      if (dataSrc === 'reqBody') {
        values.base64 = item.req.base64;
      } else if (dataSrc === 'resBody') {
        values.base64 = item.res.base64;
      }
    }
    if (!values.base64) {
      values.value = value;
    }
    return values;
  },
  export: function() {
    var data = [this.wrapComment()];
    var values = this.getValues();
    if (values) {
      data.push(values);
    }
    ReactDOM.findDOMNode(this.refs.content).value = JSON.stringify(data);
    ReactDOM.findDOMNode(this.refs.downloadForm).submit();
  },
  isValuesKey: function(dataSrc) {
    return (dataSrc || this.state.dataSrc)[0] === '{';
  },
  selectAllText: function(e) {
    e.target.select();
  },
  updateRules: function() {
    var state = this.state;
    var pattern = trim(state.pattern);
    if (!pattern) {
      return this.setState({ rules: '' });
    }
    var protocol = state.protocol || 'file://';
    var rules = pattern + ' ' + protocol;
    var valueType = this.getValueType();
    var suffixType = state.suffixType;
    if (valueType === 'file') {
      rules += 'temp/current_file_hash_placeholder' + (suffixType || '');
    } else if (valueType === 'key') {
      rules += this.isValuesKey() ? state.dataSrc : (state.keyName ? '{' + state.keyName + '}' : '');
    } else {
      var inlineValue = state.inlineValue;
      if (!/\s/.test(inlineValue)) {
        rules += inlineValue;
      } else {
        inlineValue = getInlineValue(state.inlineKey, inlineValue);
        rules += (inlineValue ? '{' + state.inlineKey + '}' : '') + inlineValue;
      }
    }
    this.setState({ rules: rules });
  },
  onPatternChange: function(e) {
    var pattern = e.target.value.replace(/\s+/g, '');
    this.setState({ pattern: pattern }, this.updateRules);
  },
  onInlineValueChange: function(e) {
    var inlineValue = e.target.value;
    this.setState({ inlineValue: inlineValue }, this.updateRules);
  },
  onKeyNameChange: function(e) {
    var keyName = e.target.value.replace(/\s+/g, '');
    this.setState({ keyName: keyName }, this.updateRules);
  },
  onSourceChange: function(e) {
    var self = this;
    var dataSrc = e.target.value;
    var updateValue = function() {
      self.setState({ dataSrc: dataSrc }, self.updateRules);
      if (self.isValuesKey(dataSrc)) {
        var valuesModal = dataCenter.valuesModal;
        var item = valuesModal.getItem(dataSrc.slice(1, -1));
        self._textarea.value = item && item.value || '';
      } else {
        self._textarea.value = getValue(self.state.item, dataSrc);
      }
    };
    if (!self.state.hasChanged) {
      return updateValue();
    }
    win.confirm('Switching values will cause the changed content to be lost, continue?', function(sure) {
      if (sure) {
        updateValue();
        self.setState({ hasChanged: false });
      }
    });
  },
  componentDidMount: function() {
    var self = this;
    var iframe = ReactDOM.findDOMNode(self.refs.iframe);
    var initTextArea = function() {
      var textarea = iframe.contentWindow.document.querySelector('textarea');
      var style = textarea && textarea.style;
      self._textarea = textarea;
      if (style) {
        style.resize = 'none';
        style.border = 'none';
        style.width = iframeStyle.width + 'px';
        style.height = iframeStyle.height + 'px';
        style.padding = '5px';
        style.border = '1px solid #ccc';
        style.borderRadius = '3px';
        textarea.maxLength = 1024 * 1024 * 3;
        textarea.placeholder='Input the value';
        textarea.addEventListener('input', function() {
          self.setState({ hasChanged: true });
        });
        textarea.addEventListener('focus', self.hideParams);
      }
    };
    iframe.onload = initTextArea;
    initTextArea();
    events.on('hideMockDialog', function() {
      self.refs.mockDialog.hide();
    });
    events.on('addMockRulesSuccess', function() {
      if (self.getValueType() === 'file') {
        self.state.comment = '';
      }
    });
    $(document).on('click mousedown', function(e) {
      var target = $(e.target);
      if (!(target.closest('.w-composer-params').length ||
        target.closest('.w-composer-params-editor').length ||
        target.closest('.w-composer-dialog').length ||
        target.closest('.w-win-dialog').length)) {
        self.hideParams();
      }
    });
  },
  formatValue: function() {
    var textarea = this._textarea;
    try {
      var val = textarea.value.trim();
      if (val[0] === '{' || val[0] === '[') {
        var formattedVal = JSON.stringify(JSON.parse(val), null, '  ');
        if (textarea.value !== formattedVal) {
          textarea.value = formattedVal;
          this.setState({ hasChanged: true });
        }
      }
    } catch (e) {
      message.error(e.message);
    }
  },
  clearValue: function() {
    this._textarea.value = '';
  },
  removeRules: function() {
    var self = this;
    win.confirm('Are you sure to delete the rules?', function(sure) {
      sure && self.setState({ pattern: '' }, self.updateRules);
    });
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
      sure && self.refs.paramsEditor.clear();
    });
  },
  addQueryParam: function() {
    this.refs.paramsEditor.onAdd();
  },
  onParamsChange: function () {
    var query = this.refs.paramsEditor.toString();
    var elem = ReactDOM.findDOMNode(this.refs.url);
    this.setState({
      hasQuery: !!query,
      pattern: util.replacQuery(elem.value, query)
    }, this.updateRules);
  },
  getValueType: function() {
    var valueType = this.state.valueType;
    if (valueType !== 'file') {
      return valueType;
    }
    var protocol = this.state.protocol;
    return INLINE_PROTOCOLS.indexOf(protocol) === -1 ? valueType : 'inline';
  },
  save: function(force) {
    var self = this;
    var rules = self.state.rules;
    var keyName = self.getKeyName();
    var valueType = self.getValueType();
    var showKeyValue = valueType === 'key';
    var next = function(sure) {
      if (!sure) {
        return;
      }
      if (rules && force !== true) {
        return events.trigger('showRulesDialog', {
          rules: self.wrapComment(),
          values: self.getValues()
        });
      }
      self.saveValue();
    };
    if (showKeyValue) {
      if (!keyName) {
        ReactDOM.findDOMNode(self.refs.keyName).focus();
        return message.error('Input the key name.');
      }
      if (force === true) {
        var item = dataCenter.getValuesModal().getItem(keyName);
        if (item && item.value !== self._textarea.value) {
          return win.confirm('The name `' + keyName + '`  already exists, whether to overwrite it?', next);
        }
      }
    }
    next(true);
  },
  getKeyName: function() {
    var state = this.state;
    if (this.isValuesKey()) {
      return state.dataSrc.slice(1, -1);
    }
    return state.keyName;
  },
  saveValueOnly: function() {
    this.save(true);
  },
  saveValue: function() {
    var self = this;
    var value = self._textarea.value;
    var filename = self.getKeyName();
    dataCenter.values.add({
      name: filename,
      value: value
    }, function (result, xhr) {
      if (result && result.ec === 0) {
        events.trigger('addNewValuesFile', {
          filename: filename,
          data: value
        });
        self.refs.mockDialog.hide();
      } else {
        util.showSystemError(xhr);
      }
    }
    );
  },
  trimInline: function() {
    var inlineValue = this.state.inlineValue;
    this.setState({
      inlineValue: inlineValue.trim()
    }, this.updateRules);
  },
  clearInline: function() {
    this.setState({ inlineValue: '' }, this.updateRules);
  },
  asValue: function() {
    var inlineValue = this.state.inlineValue;
    if (/\s/.test(inlineValue)) {
      return;
    }
    if (!isValue(inlineValue)) {
      inlineValue = '(' + inlineValue + ')';
    }
    this.setState({ inlineValue: inlineValue }, this.updateRules);
  },
  valueNotChanged: function() {
    return this.isValuesKey() ? !this.state.hasChanged : this.getValueType() !== 'key';
  },
  onComment: function(e) {
    this.setState({ comment: e.target.value });
  },
  wrapComment: function() {
    var state = this.state;
    var rules = state.rules;
    if (!rules || this.getValueType() !== 'file') {
      return rules;
    }
    var comment = state.comment.trim();
    return comment ? '# ' + comment + '\n' + rules : rules;
  },
  render: function () {
    var state = this.state;
    var valueType = this.getValueType();
    var isFile = valueType === 'file';
    var showKeyValue = valueType !== 'inline';
    var inlineValue = state.inlineValue;
    var rules = state.rules;
    var showParams = state.showParams;
    var hasQuery = state.hasQuery;
    var dataSrc = state.dataSrc || '';
    var preStyle = rules ? null : HIDE_STYLE;
    var protoList = getSortedRules();
    var valuesModal = dataCenter.getValuesModal();
    rules = this.wrapComment();

    return (
      <Dialog ref="mockDialog" wstyle="w-mock-dialog">
        <div className={'modal-body' + (isFile ? ' w-mock-file' : '')}>
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div className="w-mock-row">
              <span>
                <a className="glyphicon glyphicon-question-sign" href="https://avwo.github.io/whistle/webui/mock.html" target="_blank" />
                URL Pattern:
              </span>
              <input ref="url" onChange={this.onPatternChange} onFocus={this.selectAllText} placeholder="Input the url pattern"
                value={state.pattern} className="form-control w-url-pattern" maxLength="1200" />
                <button
                  className="btn btn-default w-composer-params"
                  onClick={this.toggleParams}
                >
                  Params
                </button>
          </div>
          <div className="w-mock-row">
            <span>Operation:</span>
            <select className="form-control w-mock-protocol" onChange={this.onProtoChange} value={state.protocol}>
              {protoList.map(function(proto) {
                if (proto === 'includeFilter://' || proto === 'excludeFilter://') {
                  return;
                }
                return <option value={proto}>{proto}</option>;
              })}
            </select>
            <select onChange={this.onValueTypeChange} value={valueType} className="form-control w-mock-value-options">
            <option value="file">System File</option>
              <option value="key">Key Value</option>
              <option value="inline">Inline Value</option>
            </select>
            <select className="form-control w-mock-value-type" onChange={this.onSourceChange} value={dataSrc} style={showKeyValue ? null : HIDE_STYLE} title={dataSrc}>
              <option value="blank">Blank</option>
              <option value="url">URL</option>
              <option value="method">Method</option>
              <option value="statusCode">Status Code</option>
              <option value="reqHeaders">Request Headers</option>
              <option value="resHeaders">Response Headers</option>
              <option value="reqBody">Request Body</option>
              <option value="resBody">Response Body</option>
              <option value="reqJson">Request JSON</option>
              <option value="resJson">Response JSON</option>
              <option value="reqRaw">Request Raw</option>
              <option value="resRaw">Response Raw</option>
              {
                valuesModal.list.map(function(key) {
                  key = '{' + key + '}';
                  return <option value={key}>{key}</option>;
                })
              }
            </select>
            <label className="w-mock-comment">
              # Comment:
              <input
                className="form-control"
                placeholder="Input the comment of rules"
                value={state.comment}
                onChange={this.onComment}
                maxLength={32}
              />
            </label>
            <textarea onChange={this.onInlineValueChange} className="w-mock-inline" placeholder="Input the rule value"
              style={{display: showKeyValue ? 'none' : null}} maxLength="1200" value={inlineValue} />
            <div style={{display: showKeyValue || !inlineValue ? 'none' : null}} className="w-mock-inline-action">
              <a onClick={this.asValue} style={/\s/.test(inlineValue) || isValue(inlineValue) ? HIDE_STYLE : null}>AsValue</a>
              <a onClick={this.trimInline} style={/^\s|\s$/.test(inlineValue) ? null : HIDE_STYLE}>Trim</a>
              <a onClick={this.clearInline}>Clear</a>
            </div>
            <input ref="keyName" onChange={this.onKeyNameChange} placeholder="Input the key name"
              value={this.isValuesKey() ? dataSrc.slice(1, -1) : state.keyName}
              readOnly={this.isValuesKey()} onFocus={this.selectAllText} className="form-control w-mock-key-name"
              style={showKeyValue && !isFile ? null : HIDE_STYLE} maxLength={MAX_LEN} />
          </div>
          <div className="w-mock-row" style={showKeyValue ? null : HIDE_STYLE}>
            <span>
              Value:
            </span>
            <iframe ref="iframe" src={fakeIframe} style={iframeStyle}/>
            <div style={{display: showKeyValue ? null : 'none'}} className="w-mock-inline-action">
              <a onClick={this.formatValue}>Format</a>
              <a onClick={this.clearValue}>Clear</a>
            </div>
          </div>
          <div className="w-mock-row" style={preStyle}>
              <span style={{marginTop: 8}}>
                Rules:
              </span>
              <pre className="w-mock-preview">
                {rules}
              </pre>
              <span className="glyphicon glyphicon-trash" onClick={this.removeRules} />
              <div className="w-mock-rules-action">
                <CopyBtn value={rules} />
              </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-info"
            onClick={this.export}
            disabled={!rules}
          >
            Export
          </button>
          {
            rules && showKeyValue && !isFile ? <button
              type="button"
              className="btn btn-default"
              onClick={this.saveValueOnly}
              disabled={this.valueNotChanged()}
            >
              Save As Values
            </button> : null
          }
          {
          isFile ?
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.save}
              disabled={!rules}
            >
              Save As Rules
            </button> : <button
              type="button"
              className="btn btn-primary"
              onClick={this.save}
              disabled={!rules && this.valueNotChanged()}
            >
              {rules ? 'Save As Rules' + (!showKeyValue || this.valueNotChanged()  ? '' : ' & Values') : 'Save As Values'}
            </button>
          }
        </div>
        <div
            className={'w-layer w-composer-params-editor orient-vertical-box' + (showParams ? '' : ' hide')}
          >
            <div className="w-filter-bar">
              <span onClick={this.hideParams} aria-hidden="true">
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
            />
          </div>
          <form
            ref="downloadForm"
            action="cgi-bin/download"
            style={{ display: 'none' }}
            method="post"
            target="downloadTargetFrame"
          >
            <input ref="type" name="type" value="mock" type="hidden" />
            <input ref="content" name="content" type="hidden" />
          </form>
      </Dialog>
    );
  }
});

var MockDialogWrap = React.createClass({
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (text, dataSrc) {
    this.refs.mockDialog.show(text, dataSrc);
  },
  render: function () {
    return <MockDialog ref="mockDialog" />;
  }
});

module.exports = MockDialogWrap;
