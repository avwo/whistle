var React = require('react');
var UrlInput = require('./url-input');
var HelpIcon = require('./help-icon');
var util = require('./util');
var Select = require('./custom-select');
var MethodSelect = require('./method-select');
var StatusSelect = require('./status-select');
var ruleMixin = require('./rule-mixin');
var TypeSelect = require('./type-select');
var FormItem = require('./form-item');

var RES_CORS_OPTIONS = ['*', 'credentials'];

var NetworkRule = React.createClass({
  mixins: [ruleMixin],
  getInitialState: function() {
    return {
      disabled: false,
      disabledMethod: true,
      disabledType: true,
      disabledStatusCode: true,
      disabledResCors: true,
      statusCode: '200',
      disabledCache: false,
      method: util.METHODS[0],
      url: '',
      type: '',
      resCors: RES_CORS_OPTIONS[0]
    };
  },
  setResType: function(session) {
    var type = session && session.res;
    type = type && type.headers;
    if (!type) {
      return;
    }
    type = type['content-type'];
    type = util.isStr(type) && util.removeSpaces(type);
    if (type) {
      this.refs.responseType.createOption(type);
    }
  },
  shouldComponentUpdate: util.scu,
  componentDidUpdate: function(prevProps) {
    var session = this.props.session;
    if (session !== prevProps.session) {
      this.setResType(session);
    }
  },
  onTypeChange: function(option) {
    this.onStateChange('type', option.value);
  },
  onResCorsChange: function(option) {
    this.onStateChange('resCors', option.value);
  },
  onStatusCodeChange: function(option) {
    this.onStateChange('statusCode', option.value);
  },
  onDisableCache: function(e) {
    this.onStateChange('disabledCache', e.target.checked);
  },
  onMethodChange: function(option) {
    this.onStateChange('method', option.value);
  },
  onChange: function(url) {
    this.onStateChange('url', url);
  },
  handleChange: function() {
    var self = this;
    var state = self.state;
    var url = state.disabled ? '' : state.url;
    var resType = state.disabledType ? '' : state.type;
    var method = state.disabledMethod ? '' : state.method;
    var statusCode = state.disabledStatusCode ? '' : state.statusCode;
    var resCors = state.disabledResCors ? '' : state.resCors;
    var rules = [];
    if (url) {
      rules.push(url);
    }
    if (state.disabledCache) {
      rules.push('disable://cache');
    }
    if (method) {
      rules.push('method://' + method);
    }
    if (statusCode) {
      rules.push((url ? 'replaceStatus://' : 'statusCode://') + statusCode);
    }
    if (resType) {
      rules.push('resType://' + resType);
    }
    if (resCors) {
      rules.push('resCors://' + resCors);
    }
    rules = rules.join(' ');
    if (self._curRules !== rules) {
      self._curRules = rules;
      self.props.onChange(rules);
    }
  },
  getDocsUrl: function() {
    return 'rules/' + this.refs.url.getProtocol() + '.html';
  },
  render: function() {
    var self = this;
    var props = self.props;
    var state = self.state;
    var hide = props.hide;
    var disabled = state.disabled;
    var disabledType = state.disabledType;
    var disabledMethod = state.disabledMethod;
    var disabledStatusCode = state.disabledStatusCode;
    var disabledResCors = state.disabledResCors;
    var url = disabled ? '' : state.url;
    var renderBox = self.renderBox;

    return (
      <div className={'w-rules-form' + (hide ? ' w-hide' : '')}>
        <div className="w-form-item">
          <label>
            {renderBox(!disabled, 'disabled')}
            Mapping File/URL/(Value)
            <HelpIcon className="ml-10" docsUrl={self.getDocsUrl} />
          </label>
          <div className="w-form-value">
            <UrlInput ref="url" enableFile enableTplFile onChange={self.onChange} disabled={disabled} session={props.session} />
          </div>
        </div>
        <FormItem>
          <label>
            {renderBox(state.disabledCache, null, self.onDisableCache)}
            Disable Cache
            <HelpIcon docsUrl="rules/disable.html" className="ml-10" />
          </label>
        </FormItem>
        <FormItem>
          <label className="w-175">
            {renderBox(!disabledMethod, 'disabledMethod')}
            Modify Request Method
          </label>
          <MethodSelect disabled={disabledMethod} value={state.method}  onChange={self.onMethodChange} />
          <HelpIcon docsUrl="rules/method.html" />
        </FormItem>
        <FormItem>
          <label className="w-175">
            {renderBox(!disabledStatusCode, 'disabledStatusCode')}
            Set Status Code
          </label>
          <StatusSelect ref="statusCode" disabled={disabledStatusCode} value={state.statusCode} className="ml-10 w-300" onChange={self.onStatusCodeChange} />
          <HelpIcon docsUrl={'rules/' + (url ? 'replaceStatus' : 'statusCode') + '.html'} />
        </FormItem>
        <FormItem>
          <label className="w-175">
            {renderBox(!disabledType, 'disabledType')}
            Set Response Type
          </label>
          <TypeSelect ref="responseType" disabled={disabledType} value={state.type} className="ml-10 w-300" onChange={self.onTypeChange} hidePlaceholder />
          <HelpIcon docsUrl="rules/resType.html" />
        </FormItem>
        <FormItem>
          <label className="w-175">
            {renderBox(!disabledResCors, 'disabledResCors')}
            Set Response CORS
          </label>
          <Select disabled={disabledResCors} value={state.resCors} className="ml-10 w-300" onChange={self.onResCorsChange} options={RES_CORS_OPTIONS} />
          <HelpIcon docsUrl="rules/resCors.html" />
        </FormItem>
      </div>
    );
  }
});

module.exports = NetworkRule;
