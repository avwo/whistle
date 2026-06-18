var React = require('react');
var Select = require('./custom-select');
var HelpIcon = require('./help-icon');
var util = require('./util');
var ruleMixin = require('./rule-mixin');
var HeaderSelect = require('./header-select');
var Dialog = require('./dialog');
var CloseBtn = require('./close-btn');
var MethodSelect = require('./method-select');

var HTTP_VERSION_OPTIONS = ['HTTP/1.1', 'HTTP/2.0'];
var URL_ACTIONS = ['Set Param', 'Delete Param', 'Modify Path (path/to?query)'];
var HEADER_ACTIONS = HeaderSelect.REQ_HEADERS;
var BODY_ACTIONS = util.BODY_ACTIONS;
var getRandomKey = util.getRandomKey;
var getInjectValue = util.getInjectValue;
var getFilepath = util.getFilepath;

var RequestRule = React.createClass({
  mixins: [ruleMixin],
  getInitialState: function() {
    var self = this;
    return {
      disabledMethod: true,
      disabledVersion: true,
      disabledUrl: true,
      disabledHeader: true,
      disabledBody: true,
      method: util.METHODS[0],
      version: HTTP_VERSION_OPTIONS[0],
      urlActions: [self.createAction(URL_ACTIONS[0])],
      headerActions: [self.createAction(HEADER_ACTIONS[1])],
      bodyActions: [self.createAction(BODY_ACTIONS[0])]
    };
  },
  handleChange: function() {
    var self = this;
    var state = self.state;
    var rules = [];
    var values = [];
    if (!state.disabledMethod) {
      rules.push('method://' + state.method);
    }
    if (!state.disabledVersion) {
      if (state.version === HTTP_VERSION_OPTIONS[0]) {
        rules.push('disable://http2');
      } else {
        rules.push('enable://http2');
      }
    }
    var addRules = function(item) {
      if (item) {
        rules.push(item.rules);
        if (item.values) {
          values.push(item.values);
        }
      }
    };
    addRules(self.getUrlRules());
    addRules(self.getHeaderRules(true));
    addRules(self.getBodyRules());
    rules = rules.join(' ');
    if (self._curRules !== rules) {
      self._curRules = rules;
      self.props.onChange(rules, values.join('\n\n'));
    }
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
  onMethodChange: function(option) {
    this.setState({ method: option.value }, this.handleChange);
  },
  onVersionChange: function(option) {
    this.setState({ version: option.value }, this.handleChange);
  },
  showCorsSettings: function(e) {
    this._curHeaderAction = this.getData(e);
    this.refs.corsSettings.show();
  },
  getUrlRules: function() {
    var state = this.state;
    if (state.disabledUrl) {
      return;
    }
    var rules = [];
    var params;
    var paramsKey;
    state.urlActions.forEach(function(action) {
      var key = action.key && action.key.trim();
      if (!key) {
        return;
      }
      var value = (action.value || '').trim();
      switch(action.type) {
      case URL_ACTIONS[0]:
        if (!params) {
          params = {};
          paramsKey = getRandomKey('urlParams_');
          rules.push('urlParams://{' + paramsKey + '}');
        }
        if (params[key] == null) {
          params[key] = value;
        }
        break;
      case URL_ACTIONS[1]:
        rules.push('delete://urlParams.' + util.removeSpaces(key));
        break;
      default:
        var data = {};
        data[util.removeSpaces(key)] = util.removeSpaces(value);
        rules.push('pathReplace://(' + JSON.stringify(data) + ')');
      }
    });
    rules = rules.join(' ');
    return rules && {
      rules: rules,
      values: getInjectValue(paramsKey, params)
    };
  },
  getBodyRules: function() {
    var state = this.state;
    if (state.disabledBody) {
      return;
    }
    var rules = [];
    var reqReplace;
    var reqReplaceKey;
    var values = [];
    state.bodyActions.forEach(function(action) {
      var key = (action.key || '').trim();
      var value = (action.value || '').trim();
      switch(action.type) {
      case BODY_ACTIONS[0]:
        if (value) {
          rules.push('reqPrepend://' + getFilepath(value));
        }
        break;
      case BODY_ACTIONS[1]:
        if (value) {
          rules.push('reqBody://' + getFilepath(value));
        }
        break;
      case BODY_ACTIONS[2]:
        if (value) {
          rules.push('reqAppend://' + getFilepath(value));
        }
        break;
      case BODY_ACTIONS[3]:
        if (key) {
          if (!reqReplace) {
            reqReplace = {};
            reqReplaceKey =  getRandomKey('reqReplace_');
            rules.push('reqReplace://{' + reqReplaceKey + '}');
          }
          if (reqReplace[key] == null) {
            reqReplace[key] = value;
          }
        }
        break;
      case BODY_ACTIONS[4]:
        if (value) {
          if (/\s/.test(value)) {
            var reqMergeKey =  getRandomKey('reqMerge_');
            rules.push('reqMerge://{' + reqMergeKey + '}');
            values.push(getInjectValue(reqMergeKey, value));
          } else {
            rules.push('reqMerge://(' + value + ')');
          }
        }
        break;
      case BODY_ACTIONS[5]:
        if (key) {
          rules.push('delete://reqBody.' + key.replace(/\s/g, '\\s'));
        }
        break;
      }
    });
    rules = rules.join(' ');
    if (!rules) {
      return;
    }
    if (reqReplace) {
      values.unshift(getInjectValue(reqReplaceKey, reqReplace));
    }
    return { rules: rules, values: values.join('\n\n') };
  },
  renderUrlAction: function(action, disabled) {
    if (action.type === URL_ACTIONS[1]) {
      return this.renderKey(action.key, 'Enter param name to delete', disabled);
    }
    var isParam = action.type === URL_ACTIONS[0];
    var keyPlaceholder = isParam ? 'Enter param name' : 'Enter keyword or regexp';
    var valuePlaceholder = isParam ? 'Enter param value' : 'Enter replacement value';
    return this.renderKV(action, keyPlaceholder, valuePlaceholder, disabled, isParam, isParam);
  },
  render: function() {
    var self = this;
    var hide = self.props.hide;
    var state = self.state;
    var version = state.version;
    var disabledMethod = state.disabledMethod;
    var disabledVersion = state.disabledVersion;
    var disabledUrl = state.disabledUrl;
    var disabledHeader = state.disabledHeader;
    var disabledBody = state.disabledBody;
    var urlActions = state.urlActions;
    var headerActions = state.headerActions;
    var bodyActions = state.bodyActions;
    var urlActionCount = urlActions.length;
    var headerActionCount = headerActions.length;
    var bodyActionCount = bodyActions.length;

    return (
      <div className={'w-rules-form' + (hide ? ' w-hide' : '')}>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" data-name="disabledMethod" className="mr-10" checked={!disabledMethod} onChange={self.onDisableCheckChange} />
              Modify Request Method
            </label>
            <MethodSelect disabled={disabledMethod} value={state.method}  onChange={self.onMethodChange} />
            <HelpIcon docsUrl="rules/method.html" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" data-name="disabledVersion" checked={!disabledVersion} onChange={self.onDisableCheckChange} />
              Modify HTTP Version
            </label>
            <Select disabled={disabledVersion} className="mx-10 w-300" options={HTTP_VERSION_OPTIONS} value={version} onChange={self.onVersionChange} />
            <HelpIcon docsUrl={'rules/' + (version === HTTP_VERSION_OPTIONS[0] ? 'disable' : 'enable') + '.html'} />
          </div>
        </div>
        <div className="w-form-item">
          <label>
            <input type="checkbox" className="mr-10" data-name="disabledUrl" checked={!disabledUrl} onChange={self.onDisableCheckChange} />
            Modify Request URL
            <HelpIcon className="ml-10" docsUrl="rules/urlParams.html#related" />
          </label>
          {
            urlActions.map(function(action) {
              return (
                <div data-name="urlActions" className="w-form-value" data-index={action.index} key={action.index}>
                  <Select className="w-190" disabled={disabledUrl} value={action.type} data={action} options={URL_ACTIONS}
                    onChange={self.onActionChange} key={action.index} />
                  {self.renderUrlAction(action, disabledUrl)}
                  {self.renderButtons(action, disabledUrl, urlActionCount)}
                </div>
              );
            })
          }
        </div>
        <div className="w-form-item">
          <label>
            <input type="checkbox" className="mr-10" data-name="disabledHeader" checked={!disabledHeader} onChange={self.onDisableCheckChange} />
            Modify Request Headers
            <HelpIcon className="ml-10" docsUrl="rules/reqHeaders.html#related" />
          </label>
            {
              headerActions.map(function(action) {
                return (
                  <div data-name="headerActions" className="w-form-value" data-index={action.index} key={action.index}>
                    {self.renderHeaders(action, disabledHeader, true, 'w-190')}
                    {self.renderHeaderAction(action, disabledHeader, true)}
                    {self.renderButtons(action, disabledHeader, headerActionCount)}
                  </div>
                );
              })
            }
        </div>
        <div className="w-form-item">
          <label>
            <input type="checkbox" className="mr-10" data-name="disabledBody" checked={!disabledBody} onChange={self.onDisableCheckChange} />
            Modify Request Body
            <HelpIcon className="ml-10" docsUrl="rules/reqBody.html#related" />
          </label>
          {
            bodyActions.map(function(action) {
              return (
                <div data-name="bodyActions" className="w-form-value" data-index={action.index} key={action.index}>
                  <Select className="w-190" disabled={disabledBody} value={action.type} data={action} options={BODY_ACTIONS}
                    onChange={self.onActionChange} key={action.index} />
                  {self.renderBodyAction(action, disabledBody, BODY_ACTIONS)}
                  {self.renderButtons(action, disabledBody, bodyActionCount)}
                </div>
              );
            })
          }
        </div>
        <Dialog ref="corsSettings" wstyle="w-cors-settings-dialog">
        <div className="modal-header">
            Request CORS Settings
            <CloseBtn />
          </div>
          <div className="modal-body">
            <div className="w-form-item">
              <label>Origin</label>
              <input type="text" className="form-control w-form-value" placeholder="Enter origin, e.g. * or https://example.com" />
            </div>
            <div className="w-form-item">
              <label>Access-Control-Request-Method</label>
              <input type="text" className="form-control w-form-value" placeholder="Enter request method, e.g. GET or POST" />
            </div>
            <div className="w-form-item">
              <label>Access-Control-Request-Headers</label>
              <input type="text" className="form-control w-form-value" placeholder="Enter request headers, e.g. Content-Type, X-Custom-Header" />
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
            <button
              type="button"
              className="btn btn-primary"
            >
              Confirm
            </button>
          </div>
        </Dialog>
      </div>
    );
  }
});

module.exports = RequestRule;
