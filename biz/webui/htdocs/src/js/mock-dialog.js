var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var CopyBtn = require('./copy-btn');
var util = require('./util');
var dataCenter = require('./data-center');
var getAllRules = require('./protocols').getAllRules;
var RulesDialog = require('./rules-dialog');
var win = require('./win');
var message = require('./message');
var events = require('./events');

var MAX_LEN = 64;
var fakeIframe = 'javascript:"<style>html,body{padding:0;margin:0}</style><textarea></textarea>"';
var HIDE_STYLE = { display: 'none' };
var iframeStyle = {
  padding: 0,
  border: 'none',
  width: 840,
  height: 320,
  margin: 0,
  verticalAlign: 'top'
};
var VAL_SEP_RE = /^\s*?`{3,}\s*?$/mg;

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
      showKeyValue: true,
      protocol: 'file://',
      inlineValue: ''
    };
  },
  show: function (item, dataSrc) {
    if (!item) {
      return;
    }
    var headers = item.res.headers;
    var type = util.getContentType(headers);
    dataSrc = dataSrc || 'resBody';
    type = type ? type.toLowerCase() : '';
    if (type === 'img') {
      type = headers['content-type'];
      type = type.split('/')[1].split(';')[0].trim().toLowerCase();
    } else if (type === 'text') {
      type = 'txt';
    }
    this.refs.mockDialog.show();
    this.setState({
      hasChanged: false,
      item: item,
      pattern: item.url,
      dataSrc: dataSrc,
      showKeyValue: true,
      keyName: (util.getFilename(item, true) || '').substring(0, MAX_LEN),
      inlineKey: 'mock_' + util.getTempName() + (type ? '.' + type : ''),
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
      showKeyValue: value === 'key'
    }, this.updateRules);
  },
  onProtoChange: function(e) {
    this.setState({
      protocol: e.target.value
    }, this.updateRules);
  },
  isValuesKey: function(dataSrc) {
    return (dataSrc || this.state.dataSrc)[0] === '{';
  },
  updateRules: function() {
    var state = this.state;
    var pattern = trim(state.pattern);
    if (!pattern) {
      return this.setState({ rules: '' });
    }
    var protocol = state.protocol || 'file://';
    var rules = pattern + ' ' + protocol;
    if (state.showKeyValue) {
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
      }
    };
    iframe.onload = initTextArea;
    initTextArea();
    events.on('hideMockDialog', function() {
      self.refs.mockDialog.hide();
    });
  },
  removeRules: function() {
    var self = this;
    win.confirm('Are you sure to delete the rules?', function(sure) {
      sure && self.setState({ pattern: '' }, self.updateRules);
    });
  },
  save: function() {
    var self = this;
    var rules = self.state.rules;
    var keyName = self.getKeyName();
    var showKeyValue = self.state.showKeyValue;
    var next = function(sure) {
      if (!sure) {
        return;
      }
      if (rules) {
        return self.refs.rulesDialog.show(rules, showKeyValue ? {
          name: keyName,
          value: self._textarea.value
        } : undefined);
      }
      self.saveValue();
    };
    if (showKeyValue) {
      if (!keyName) {
        ReactDOM.findDOMNode(self.refs.keyName).focus();
        return message.error('Input the key name.');
      }
      if (!this.valueNotChanged() && dataCenter.getValuesModal().getItem(keyName)) {
        return win.confirm('The name `' + keyName + '`  already exists, whether to overwrite it?', next);
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
  toValue: function() {
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
    return this.isValuesKey() ? !this.state.hasChanged : !this.state.showKeyValue;
  },
  render: function () {
    var state = this.state;
    var showKeyValue = state.showKeyValue;
    var inlineValue = state.inlineValue;
    var rules = state.rules;
    var dataSrc = state.dataSrc || '';
    var preStyle = rules ? null : HIDE_STYLE;
    var hideStyle = showKeyValue ? null : HIDE_STYLE;
    var protoList = getAllRules();
    var valuesModal = dataCenter.getValuesModal();

    return (
      <Dialog ref="mockDialog" wstyle="w-mock-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div className="w-mock-row">
              <span>
                <a className="glyphicon glyphicon-question-sign" href="https://avwo.github.io/whistle/webui/mock.html" target="_blank" />
                URL Pattern:
              </span>
              <input ref="url" onChange={this.onPatternChange} placeholder="Input the url pattern"
                value={state.pattern} className="form-control w-url-pattern" maxLength="1200" />
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
            <select onChange={this.onValueTypeChange} value={showKeyValue ? 'key' : 'inline'} className="form-control w-mock-value-options">
              <option value="inline">Inline</option>
              <option value="key">Key-Value</option>
            </select>
            <textarea onChange={this.onInlineValueChange} className="w-mock-inline" placeholder="Input the rule value"
              style={{display: showKeyValue ? 'none' : null}} maxLength="3200" value={inlineValue} />
            <div style={{display: showKeyValue || !inlineValue ? 'none' : null}} className="w-mock-inline-action">
                <a onClick={this.toValue} style={/\s/.test(inlineValue) || isValue(inlineValue) ? HIDE_STYLE : null}>ToValue</a>
                <a onClick={this.trimInline} style={/^\s|\s$/.test(inlineValue) ? null : HIDE_STYLE}>Trim</a>
                <a onClick={this.clearInline}>Clear</a>
              </div>
            <input ref="keyName" onChange={this.onKeyNameChange} placeholder="Input the key name" value={this.isValuesKey() ? dataSrc.slice(1, -1) : state.keyName}
              readOnly={this.isValuesKey()} className="form-control w-mock-key-name" style={hideStyle} maxLength={MAX_LEN} />
            <select className="form-control w-mock-value-type" onChange={this.onSourceChange} value={dataSrc} style={hideStyle} title={dataSrc}>
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
          </div>
          <div className="w-mock-row" style={showKeyValue ? null : HIDE_STYLE}>
            <span>
              Value:
            </span>
            <iframe ref="iframe" src={fakeIframe} style={iframeStyle}/>
          </div>
          <div className="w-mock-row" style={preStyle}>
              <span>
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
            className="btn btn-primary"
            onClick={this.save}
            disabled={!rules && this.valueNotChanged()}
          >
            {rules ? 'Select Rules File' : 'Save'}
          </button>
        </div>
        <RulesDialog ref="rulesDialog" />
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
