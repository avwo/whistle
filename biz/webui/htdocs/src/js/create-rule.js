require('../css/create-rule.css');
var React = require('react');
var Dialog = require('./dialog');
var CloseBtn = require('./close-btn');
var events = require('./events');
var UrlInput = require('./url-input');
var CopyBtn = require('./copy-btn');
var NetworkRule = require('./network-rule');
var MappingRule = require('./mapping-rule');
var RequestRule = require('./request-rule');
var ResponseRule = require('./response-rule');
var DebugRule = require('./debug-rule');
var FiltersRule = require('./filters-rule');
var Icon = require('./icon');
var HelpIcon = require('./help-icon');
var Select = require('./custom-select');
var util = require('./util');

var getHideStyle = util.getHideStyle;
var TYPE_OPTIONS = [
  { value: 'Mapping', label: 'Modify Mapping' },
  { value: 'Network', label: 'Modify Network' },
  { value: 'Request', label: 'Modify Request' },
  { value: 'Response', label: 'Modify Response' },
  { value: 'Debug', label: 'Debug Tools' }
];
var PATTERN_OPTIONS = [
  { value: 'url', label: 'URL Fragment (p://host*/path)' },
  { value: 'wildcard', label: 'Wildcard (^p://host*/path*)' },
  { value: 'regexp', label: 'RegExp (/regexp/i)' }
];
var PATTERN_TIPS = {
  url: 'Enter URL e.g. http://example.com/path or *.example.com',
  wildcard: 'Enter wildcard, e.g. ^https://**.example.com/path/index.*.js',
  regexp: 'Enter regular expression, e.g. cmdname=Query(List|UserInfo)'
};

var CreateRuleDialog = React.createClass({
  getInitialState: function() {
    return {
      type: 'Mapping',
      patternType: 'url',
      regexp: ''
    };
  },
  show: function (data, filename) {
    this._hideDialog = false;
    this.refs.addRules.show();
    var session = data && data.session;
    if (session) {
      this.state.patternType = 'url';
      this.refs.urlInput.setUrl(session.url);
    }
    this.setState({
      type: (data && data.type) || this.state.type,
      filename: filename,
      session: session
    });
  },
  showEditor: function() {
    events.trigger('showEditorDialog', {
      session: this.state.session || null
    });
  },
  hide: function () {
    this.refs.addRules.hide();
    this._hideDialog = true;
  },
  onTypeChange: function(option) {
    this.setState({ type: option.value });
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  componentDidMount: function() {
    events.on('hideRulesDialog', this.hide);
  },
  saveRules: function() {
    var state = this.state;
    var rules = this.getRules();
    var values = rules._values || '';
    events.trigger('showRulesDialog', {
      filename: state.filename,
      rules: this.formatRules(rules) + values
    });
  },
  formatRules: function(rules) {
    if (!rules) {
      return '';
    }
    return rules.length > 4 ? 'line`\n' + rules.join('\n') + '\n`' : rules.join(' ');
  },
  getRules: function() {
    var state = this.state;
    var pattern = state.pattern;
    if (!pattern) {
      return '';
    }
    var rule = '';
    var values = '';
    switch (state.type) {
    case 'Mapping':
      rule = state.mappingRule;
      break;
    case 'Network':
      rule = state.networkRule;
      break;
    case 'Request':
      rule = state.requestRule;
      values = state.requestValues;
      break;
    case 'Response':
      rule = state.responseRule;
      values = state.responseValues;
      break;
    case 'Debug':
      rule = state.debugRule;
      break;
    }
    if (!rule) {
      return '';
    }
    var rules = [pattern].concat(rule.split(' '));
    var filters = state.filters;
    if (filters) {
      rules = rules.concat(filters.split(' '));
    }
    rules._values = values ? '\n\n' + values : '';
    return rules;
  },
  onPatternTypeChange: function(option) {
    this.state.patternType = option.value;
    this.handlePatternChange();
  },
  onPatternUrlChange: function(url) {
    this.state.patternUrl = url;
    this.handlePatternChange();
  },
  onRegExpChange: function(e) {
    this.state.regexp = e.target.value.replace(/[\s#]+/g, '');
    this.handlePatternChange();
  },
  onIgnoreCaseChange: function(e) {
    this.state.ignoreCase = e.target.checked;
    this.handlePatternChange();
  },
  onFullMatchChange: function(e) {
    this.state.fullMatch = e.target.checked;
    this.handlePatternChange();
  },
  handlePatternChange: function() {
    var state = this.state;
    var patternType = state.patternType;
    if (patternType === 'regexp') {
      var regexp = state.regexp || '';
      var result = /^\/(.*)\/(?:i?)$/.exec(regexp);
      if (result) {
        state.pattern = result[1] ? result[0] : '';
      } else {
        var endTag;
        if (regexp[0] === '/') {
          regexp = regexp.substring(1);
          if ((result = /(\\*)\/(?:i?)$/.exec(regexp)) && !result[1]) {
            regexp = regexp.substring(0, result.index);
            endTag = result[0];
          }
        }
        endTag = endTag || '/' + (state.ignoreCase ? 'i' : '');
        state.pattern = regexp ? '/' + regexp + endTag : '';
      }
    } else {
      var url = state.patternUrl || '';
      if (url) {
        var fullMatch = state.fullMatch ? '$' : '';
        if (patternType === 'wildcard') {
          state.pattern = url.replace(/^\^*/, '^') + fullMatch;
        } else {
          state.pattern = fullMatch + url;
        }
      } else {
        state.pattern = '';
      }
    }
    this.setState({});
  },
  onMappingChange: function(rule) {
    this.setState({ mappingRule: rule });
  },
  onNetworkChange: function(rule) {
    this.setState({ networkRule: rule });
  },
  onRequestChange: function(rule, values) {
    this.setState({ requestRule: rule, requestValues: values });
  },
  onResponseChange: function(rule, values) {
    this.setState({ responseRule: rule, responseValues: values });
  },
  onDebugChange: function(rule) {
    this.setState({ debugRule: rule });
  },
  onFiltersChange: function(filters) {
    this.setState({ filters: filters });
  },
  renderHeader: function() {
    var state = this.state;

    return (
      <div className="modal-header">
        <h4>
        Create Rule
        <Select className="ml-10" value={state.type} onChange={this.onTypeChange} options={TYPE_OPTIONS} />
        </h4>
        <CloseBtn onClick={this.hide} />
      </div>
    );
  },
  renderPattern: function() {
    var state = this.state;
    var patternType = state.patternType;
    var session = state.session;
    var placeholder = PATTERN_TIPS[patternType];
    var isRegExp = patternType === 'regexp';
    var urlInputStyle = getHideStyle(isRegExp);
    var regExpStyle = getHideStyle(!isRegExp);
    var wildcardStyle = getHideStyle(patternType !== 'wildcard');

    return (
      <div className="w-form-item w-rules-form">
        <label>
          <Icon name="link" />
          URL Pattern
          <HelpIcon className="ml-10" docsUrl={'rules/pattern.html#' + patternType} />
        </label>
        <div className="w-form-value">
          <Select className="w-200" value={patternType} onChange={this.onPatternTypeChange} options={PATTERN_OPTIONS} />
          <span className="w-wildcard-symbol" style={wildcardStyle}>^</span>
          <UrlInput ref="urlInput" style={urlInputStyle} placeholder={placeholder} session={session} onChange={this.onPatternUrlChange} />
          <span className="w-regexp-symbol" style={regExpStyle}>/</span>
          <input className="form-control mx-2" type="text" placeholder={placeholder} maxLength="1024"
            value={state.regexp} onChange={this.onRegExpChange} style={regExpStyle} />
          <span className="w-regexp-symbol" style={regExpStyle}>/{state.ignoreCase ? 'i' : null}</span>
          <label className="ml-10" style={regExpStyle}>
            <input type="checkbox" className="mr-5" checked={state.ignoreCase} onChange={this.onIgnoreCaseChange} /> Case-insensitive
          </label>
          <label className="ml-10" style={urlInputStyle}>
            <input type="checkbox" className="mr-5" checked={state.fullMatch} onChange={this.onFullMatchChange} /> Full-match
          </label>
        </div>
      </div>
    );
  },
  renderRules: function(rules) {
    // 这里不能用 Editor，用了会出现预览内容不更新，Copy 功能失效等诡异问题
    var isMulti;
    var text = this.formatRules(rules);
    var values;
    if (rules) {
      values = rules._values || null;
      rules = rules.map(function(rule, i) {
        var className = i ? 'w-pr-' + util.getProtocol(rule) : (util.isSpecPattern(rule) || util.isWildcard(rule) ? 'w-pr-REGEXP' : null);
        return <span className={className}>{rule}</span>;
      });
      if (rules.length > 4) {
        isMulti = true;
        rules = [<span className="w-pr-line">line`</span>].concat(rules).concat([<span className="w-pr-line">`</span>]);
      }
    }
    return (
      <div className="w-form-item">
        <label>
          <Icon name="eye-open" />
          Preview Rules
          {text ? <CopyBtn value={text} className="btn btn-default w-copy-rules" /> : null}
        </label>
        <pre className={'w-preview-rules ' + (isMulti ? ' w-preview-rules-multi' : '')}>
          {rules}
          {values}
        </pre>
      </div>
    );
  },
  render: function() {
    var state = this.state;
    var type = state.type;
    var rules = this.getRules();

    return (
      <Dialog ref="addRules" wstyle="w-create-rule">
        {this.renderHeader()}
        <div className="modal-body">
          {this.renderPattern()}
          <MappingRule hide={type !== 'Mapping'} onChange={this.onMappingChange} session={state.session} />
          <NetworkRule hide={type !== 'Network'} onChange={this.onNetworkChange} session={state.session} />
          <RequestRule hide={type !== 'Request'} onChange={this.onRequestChange} session={state.session} />
          <ResponseRule hide={type !== 'Response'} onChange={this.onResponseChange} session={state.session} />
          <DebugRule hide={type !== 'Debug'} onChange={this.onDebugChange} session={state.session} />
          <FiltersRule onChange={this.onFiltersChange} session={state.session} />
          {this.renderRules(rules)}
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
            disabled={!rules}
            type="button"
            className="btn btn-primary"
            onClick={this.saveRules}
          >
            Save As Rules
          </button>
        </div>
      </Dialog>
      );
  }
});

module.exports = CreateRuleDialog;
