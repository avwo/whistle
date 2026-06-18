var React = require('react');
var UrlInput = require('./url-input');
var HelpIcon = require('./help-icon');
var util = require('./util');
var Select = require('./custom-select');
var MethodSelect = require('./method-select');
var StatusSelect = require('./status-select');
var ruleMixin = require('./rule-mixin');
var TypeSelect = require('./type-select');

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
    type = util.isString(type) && util.removeSpaces(type);
    if (type) {
      this.refs.responseType.createOption(type);
    }
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
  componentDidUpdate: function(prevProps) {
    var session = this.props.session;
    if (session !== prevProps.session) {
      this.setResType(session);
    }
  },
  onTypeChange: function(option) {
    this.setState({ type: option.value }, this.handleChange);
  },
  onResCorsChange: function(option) {
    this.setState({ resCors: option.value }, this.handleChange);
  },
  onStatusCodeChange: function(option) {
    this.setState({ statusCode: option.value }, this.handleChange);
  },
  onDisableCache: function(e) {
    this.setState({disabledCache: e.target.checked}, this.handleChange);
  },
  onMethodChange: function(option) {
    this.setState({ method: option.value }, this.handleChange);
  },
  onChange: function(url) {
    this.setState({ url: url }, this.handleChange);
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

    return (
      <div className={'w-rules-form' + (hide ? ' w-hide' : '')}>
        <div className="w-form-item">
          <label>
            <input type="checkbox" className="mr-10" checked={!disabled} data-name="disabled" onChange={self.onDisableCheckChange} />
            Mapping File/URL/(Value)
            <HelpIcon className="ml-10" docsUrl={self.getDocsUrl} />
          </label>
          <div className="w-form-value">
            <UrlInput ref="url" enableLocalFile enableTplFile onChange={self.onChange} disabled={disabled} session={props.session} />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label>
              <input type="checkbox" className="mr-10" checked={state.disabledCache} onChange={self.onDisableCache} />
              Disable Cache
              <HelpIcon docsUrl="rules/disable.html" className="ml-10" />
            </label>
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" checked={!disabledMethod} data-name="disabledMethod" onChange={self.onDisableCheckChange} />
              Modify Request Method
            </label>
            <MethodSelect disabled={disabledMethod} value={state.method}  onChange={self.onMethodChange} />
            <HelpIcon docsUrl="rules/method.html" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" checked={!disabledStatusCode} data-name="disabledStatusCode" onChange={self.onDisableCheckChange} />
              Set Status Code
            </label>
            <StatusSelect ref="statusCode" disabled={disabledStatusCode} value={state.statusCode} className="ml-10 w-300" onChange={self.onStatusCodeChange} />
            <HelpIcon docsUrl={'rules/' + (url ? 'replaceStatus' : 'statusCode') + '.html'} />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" checked={!disabledType} data-name="disabledType" onChange={self.onDisableCheckChange} />
              Set Response Type
            </label>
            <TypeSelect ref="responseType" disabled={disabledType} value={state.type} className="ml-10 w-300" onChange={self.onTypeChange} hidePlaceholder />
            <HelpIcon docsUrl="rules/resType.html" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" checked={!disabledResCors} data-name="disabledResCors" onChange={self.onDisableCheckChange} />
              Set Response CORS
            </label>
            <Select disabled={disabledResCors} value={state.resCors} className="ml-10 w-300" onChange={self.onResCorsChange} options={RES_CORS_OPTIONS} />
            <HelpIcon docsUrl="rules/resCors.html" />
          </div>
        </div>
      </div>
    );
  }
});

module.exports = NetworkRule;
