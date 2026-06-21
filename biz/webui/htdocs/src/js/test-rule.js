require('../css/test-rule.css');
var React = require('react');
var Dialog = require('./dialog');
var CloseBtn = require('./close-btn');
var Icon = require('./icon');
var UrlInput = require('./url-input');
var RulesMiniEditor = require('./rules-mini-editor');
var CopyBtn = require('./copy-btn');
var MatchedRule = require('./matched-rule');
var HelpIcon = require('./help-icon');
var util = require('./util');
var dataCenter = require('./data-center');
var ReqType = require('./req-type');
var message = require('./message');
var StatusSelect = require('./status-select');
var win = require('./win');

var MAX_HEADERS_SIZE = 1024 * 128;
var MAX_BODY_SIZE = 1024 * 256;
var MAX_RULE_SIZE = 1024 * 32;

var TestRule = React.createClass({
  getInitialState: function() {
    return {
      disabledHeaders: false,
      disabledBody: false,
      disabledMock: true,
      rules: '',
      url: '',
      type: 'custom',
      method: 'GET',
      statusCode: '200',
      matchedRules: null
    };
  },
  getRules: function(data) {
    var result = { rules: '', rawRules: '' };
    if (data.ruleText) {
      result.rules = data.ruleText;
    } else  if (data.ruleItem) {
      var rulesText = data.ruleItem.value;
      if (rulesText.length > MAX_RULE_SIZE) {
        result.rawRules = rulesText;
        win.alert('Rules too long (max 32k chars). Click \'Raw Rules\' to select');
      } else {
        result.rawRules = '';
        result.rules = rulesText;
      }
    } else {
      var rules = data.session && data.session.rules;
      if (rules) {
        var list = [];
        var rawList = [];
        var addRule = function(rule) {
          var raw = rule.raw;
          if (rawList.indexOf(raw) === -1) {
            rawList.push(raw);
          }
          raw = rule.rawPattern + ' ' + rule.rawMatcher;
          if (list.indexOf(raw) === -1) {
            list.push(raw);
          }
        };
        Object.keys(rules).forEach(function (name) {
          var rule = rules[name];
          if (rule.list) {
            rule.list.forEach(addRule);
          } else {
            addRule(rule);
          }
        });
        result.rules = list.join('\n');
        result.rawRules = rawList.join('\n');
      }
    }
    return result;
  },
  getReqData: function(data) {
    var session = data.session;
    var result = {};
    if (session) {
      var req = session.req;
      var headers = {};
      Object.keys(req.headers).forEach(function(name) {
        if (name !== 'x-whistle-rule-value') {
          headers[name] = req.headers[name];
        }
      });
      result.disabledHeaders = false;
      result.disabledBody = false;
      result.method = req.method;
      result.url = session.url;
      result.headers = util.objectToString(headers, req.rawHeaderNames).substring(0, MAX_HEADERS_SIZE);
      result.body = util.getBody(req, true).substring(0, MAX_BODY_SIZE);
    }
    return result;
  },
  handleType: function(headers) {
    if (!headers) {
      return 'custom';
    }
    if (this._headers === headers) {
      return this.state.type;
    }
  },
  show: function(data) {
    var self = this;
    var state = self.getReqData(data);
    var rules = self.getRules(data);
    state.rules = rules.rules;
    state.rawRules = rules.rawRules;
    self.setState(state);
    self.refs.testRules.show();
  },
  hide: function() {
    this.refs.testRules.hide();
  },
  onRulesChange: function(rules) {
    this.setState({ rules: rules });
  },
  onUrlChange: function(url) {
    this.setState({ url: url });
  },
  onMethodChange: function(e) {
    this.setState({method: e.target.value});
  },
  onTypeChange: function(e) {
    var type = e.target.getAttribute('data-type');
    var headers = ReqType.setType(this.state.headers, ReqType.TYPES[type], true);
    this.setState({ type: type, headers: headers });
  },
  onStatusCodeChange: function(e) {
    this.setState({ statusCode: e.target.value });
  },
  onMockChange: function(e) {
    this.setState({ disabledMock: !e.target.checked });
  },
  updateType: function() {
    var self = this;
    var state = self.state;
    if (state.headers === self._headers) {
      return;
    }
    clearTimeout(self._typeTimer);
    self._headers = state.headers;
    self._typeTimer = setTimeout(function() {
      var type = ReqType.getType(util.parseHeaders(state.headers));
      if (type !== state.type) {
        self.setState({ type: type });
      }
    }, 100);
  },
  onHeadersChange: function(e) {
    this.setState({ headers: e.target.value });
  },
  onBodyChange: function(e) {
    this.setState({ body: e.target.value });
  },
  onTestRule: function() {
    var self = this;
    var state = self.state;
    var rules = state.rules;
    if (!state.disabledMock) {
      rules = '* statusCode://' + state.statusCode + (rules ? '\n' + rules : '');
    }
    dataCenter.compose({
      needResponse: true,
      url: state.url,
      headers: state.disabledHeaders ? '' : state.headers,
      method: state.method,
      body: state.disabledBody ? '' : state.body,
      rules: rules,
      isTest: true
    }, function(data, xhr) {
      if (!data) {
        return util.showSysErr(xhr);
      }
      var testId = data.res && data.res.testId;
      if (!testId) {
        return message.error(data.em || 'Error, please retry');
      }
      dataCenter.getMatchedRules({ testId: testId }, function(matchedRules, xhr2) {
        if (!matchedRules) {
          return util.showSysErr(xhr2);
        }
        self.setState({ matchedRules: matchedRules });
        self.refs.matchedRule.show();
      });
    });
  },
  onDisableHeadersChange: function(e) {
    this.setState({ disabledHeaders: !e.target.checked });
  },
  onDisableBodyChange: function(e) {
    this.setState({ disabledBody: !e.target.checked });
  },
  showRawRules: function() {
    this.refs.rulesEditor.showRules(this.state.rawRules);
  },
  render: function() {
    var self = this;
    var state = self.state;
    var rules = state.rules;
    var url = state.url;
    var disabledHeaders = state.disabledHeaders;
    var disabledBody = state.disabledBody;

    self.updateType();

    return (
      <Dialog ref="testRules" wstyle="w-test-rule-dialog">
        <div className="modal-body">
          <div className="modal-header">
            <h4>
              Test Rules Matching
            </h4>
            <CloseBtn onClick={self.hide} />
          </div>
          <div className="w-test-rule">
            <div className="w-rules-form">
              <label>
                <Icon name="list" className="mr-10" />
                Rules
                {rules ? <CopyBtn value={rules} className="btn btn-default w-copy-rules" /> : null}
                {state.rawRules ? <a className="btn btn-default w-copy-rules" onClick={self.showRawRules}>Raw Rules</a>  : null}
              </label>
              <RulesMiniEditor
                ref="rulesEditor"
                value={rules}
                onChange={self.onRulesChange}
                placeholder="Enter rules for testing"
              />
              <label className="mt-10">
                <input type="checkbox" checked={!state.disabledMock} onChange={self.onMockChange} className="mr-10" />
                Mock Response Status Code
                <StatusSelect disabled={state.disabledMock} value={state.statusCode} onChange={self.onStatusCodeChange} />
              </label>
            </div>
            <div className="w-rules-form">
              <label>
                <Icon name="link" className="mr-10" />
                Request URL
              </label>
              <div className="box w-com-url">
                <select
                  value={state.method}
                  onChange={self.onMethodChange}
                  className="form-control w-com-method"
                >
                  {util.METHODS.map(function (m) {
                    return <option value={m}>{m}</option>;
                  })}
                </select>
                <UrlInput value={url} onChange={self.onUrlChange} hideCustom />
                <button className="btn w-com-execute btn-primary" onClick={self.onTestRule} disabled={!url}>Test</button>
                <HelpIcon docsUrl="rules/test-rules.html" className="mr-0 ml-10" />
              </div>
            </div>
            <div className="w-rules-form">
              <label>
                <input type="checkbox" checked={!disabledHeaders} onChange={self.onDisableHeadersChange} className="mr-10" />
                Request Headers
              </label>
              <ReqType disabled={disabledHeaders} value={state.type} onChange={self.onTypeChange} className="w-test-rule-type" />
              <textarea value={state.headers} disabled={disabledHeaders} className="form-control w-form-value" maxLength={MAX_HEADERS_SIZE}
                onChange={self.onHeadersChange} placeholder="Enter request headers" />
            </div>
            <div className="w-rules-form">
              <label>
                <input type="checkbox" checked={!disabledBody} onChange={self.onDisableBodyChange} className="mr-10" />
                Request Body
              </label>
              <textarea value={state.body} disabled={disabledBody} className="form-control w-form-value" maxLength={MAX_BODY_SIZE}
                onChange={self.onBodyChange} placeholder="Enter request body" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Close
          </button>
        </div>
        <Dialog ref="matchedRule" wstyle="w-test-rule-dialog">
          <div className="modal-header">
            <h4>Matched Rules</h4>
            <CloseBtn />
          </div>
          <MatchedRule modal={state.matchedRules} showOnlyMatchRules={true} noSource />
        </Dialog>
      </Dialog>
    );
  }
});

module.exports = TestRule;
