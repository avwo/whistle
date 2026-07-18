var React = require('react');
var Select = require('./custom-select');
var util = require('./util');
var HelpIcon = require('./help-icon');
var ruleMixin = require('./rule-mixin');
var StatusSelect = require('./status-select');
var UrlInput = require('./url-input');
var HeaderSelect = require('./header-select');
var FormItem = require('./form-item');

var STATUS_CODE_ACTIONS = [
  { value: 'statusCode://', label: 'Direct Status Code' },
  { value: 'replaceStatus://', label: 'Replace Status Code'},
  '301 Permanent Redirect',
  '302 Temporary Redirect',
  '303 See Other',
  '307 Temporary Redirect',
  '308 Permanent Redirect',
  'Client Side Redirect'
];
var HEADER_ACTIONS = HeaderSelect.RES_HEADERS;
var BODY_ACTIONS = util.BODY_ACTIONS;
var getInjectValue = util.getInjectValue;
var getRandomKey = util.getRandomKey;
BODY_ACTIONS = [
  BODY_ACTIONS[0],
  'Prepend HTML To Body',
  'Prepend CSS To Body',
  'Prepend JS To Body',
  BODY_ACTIONS[1],
  'Replace Body With HTML',
  'Replace Body With CSS',
  'Replace Body With JS',
  BODY_ACTIONS[2],
  'Append HTML To Body',
  'Append CSS To Body',
  'Append JS To Body'
].concat(BODY_ACTIONS.slice(-3)).concat(['Modify Socket Frame Script']);

var ResponseRule = React.createClass({
  mixins: [ruleMixin],
  getInitialState: function() {
    return {
      disabledStatusCode: true,
      disabledHeader: true,
      disabledBody: true,
      statusCodeAction: STATUS_CODE_ACTIONS[0].value,
      statusCode: '200',
      headerActions: [this.createAction(HEADER_ACTIONS[1])],
      bodyActions: [this.createAction(BODY_ACTIONS[0])],
      redirectUrl: ''
    };
  },
  handleChange: function() {
    var rules = [];
    var values = [];
    var self = this;
    var state = self.state;
    if (!state.disabledStatusCode) {
      var action = state.statusCodeAction;
      var isLoc = action[0] === 'C';
      if (isLoc || action[0] === '3') {
        var redirectUrl = state.redirectUrl;
        if (redirectUrl) {
          if (isLoc) {
            rules.push('locationHref://' + redirectUrl);
          } else {
            action = action.substring(0, 3);
            rules.push('redirect://' + redirectUrl);
            if (action !== '302') {
              rules.push('replaceStatus://' + action);
            }
          }
        }
      } else {
        rules.push(action + state.statusCode);
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
    addRules(self.getHeaderRules());
    addRules(self.getBodyRules());
    rules = rules.join(' ');
    if (self._curRules !== rules) {
      self._curRules = rules;
      self.props.onChange(rules, values.join('\n\n'));
    }
  },
  shouldComponentUpdate: util.scu,
  onStatusCodeActionChange: function(option) {
    this.onStateChange('statusCodeAction', option.value);
  },
  onStatusCodeChange: function(option) {
    this.onStateChange('statusCode', option.value);
  },
  onUrlChange: function(url) {
    this.onStateChange('redirectUrl', url);
  },
  getStatusProtocol: function(statusCodeAction) {
    if (statusCodeAction[0] === 'C') {
      return 'locationHref';
    }
    if (statusCodeAction[0] === '3') {
      return 'redirect';
    }
    return statusCodeAction === STATUS_CODE_ACTIONS[0].value ? 'statusCode' : 'replaceStatus';
  },
  getBodyRules: function() {
    var state = this.state;
    if (state.disabledBody) {
      return;
    }
    var rules = [];
    var resReplace;
    var resReplaceKey;
    var values = [];
    var addRule = function(p, val) {
      if (val) {
        rules.push(p + '://' + util.getFilepath(val));
      }
    };
    state.bodyActions.forEach(function(action) {
      var key = (action.key || '').trim();
      var value = (action.value || '').trim();
      switch(action.type) {
      case BODY_ACTIONS[0]:
        addRule('resPrepend', value);
        break;
      case BODY_ACTIONS[1]:
        addRule('htmlPrepend', value);
        break;
      case BODY_ACTIONS[2]:
        addRule('cssPrepend', value);
        break;
      case BODY_ACTIONS[3]:
        addRule('jsPrepend', value);
        break;
      case BODY_ACTIONS[4]:
        addRule('resBody', value);
        break;
      case BODY_ACTIONS[5]:
        addRule('htmlBody', value);
        break;
      case BODY_ACTIONS[6]:
        addRule('cssBody', value);
        break;
      case BODY_ACTIONS[7]:
        addRule('jsBody', value);
        break;
      case BODY_ACTIONS[8]:
        addRule('resAppend', value);
        break;
      case BODY_ACTIONS[9]:
        addRule('htmlAppend', value);
        break;
      case BODY_ACTIONS[10]:
        addRule('cssAppend', value);
        break;
      case BODY_ACTIONS[11]:
        addRule('jsAppend', value);
        break;
      case BODY_ACTIONS[12]:
        if (key) {
          if (!resReplace) {
            resReplace = {};
            resReplaceKey = getRandomKey('resReplace_');
            rules.push('resReplace://{' + resReplaceKey + '}');
          }
          if (resReplace[key] == null) {
            resReplace[key] = value;
          }
        }
        break;
      case BODY_ACTIONS[13]:
        if (value) {
          if (/\s/.test(value)) {
            var resMergeKey =  getRandomKey('resMerge_');
            rules.push('resMerge://{' + resMergeKey + '}');
            values.push(getInjectValue(resMergeKey, value));
          } else {
            rules.push('resMerge://(' + value + ')');
          }
        }
        break;
      case BODY_ACTIONS[14]:
        if (key) {
          rules.push('delete://resBody.' + key.replace(/\s/g, '\\s'));
        }
        break;
      case BODY_ACTIONS[15]:
        addRule('frameScript', value);
        break;
      }
    });
    rules = rules.join(' ');
    if (!rules) {
      return;
    }
    if (resReplace) {
      values.unshift(getInjectValue(resReplaceKey, resReplace));
    }
    return { rules: rules, values: values.join('\n\n') };
  },
  render: function() {
    var self = this;
    var hide = self.props.hide;
    var state = self.state;
    var disabledStatusCode = state.disabledStatusCode;
    var disabledHeader = state.disabledHeader;
    var disabledBody = state.disabledBody;
    var statusCodeAction = state.statusCodeAction;
    var headerActions = state.headerActions;
    var bodyActions = state.bodyActions;
    var headerCount = headerActions.length;
    var bodyCount = bodyActions.length;
    var isRedirect = statusCodeAction[0] === '3' || statusCodeAction[0] === 'C';
    var renderBox = self.renderBox;

    return (
      <div className={'w-rules-form' + (hide ? ' w-hide' : '')}>
        <FormItem>
          {renderBox(!disabledStatusCode, 'disabledStatusCode')}
          <Select value={statusCodeAction} disabled={disabledStatusCode} className="w-175" options={STATUS_CODE_ACTIONS}
            onChange={self.onStatusCodeActionChange} />
          <StatusSelect value={state.statusCode} className={isRedirect ? 'w-hide' : null} disabled={disabledStatusCode} onChange={self.onStatusCodeChange} />
          <UrlInput isRedirect className={'mr-10' + (isRedirect ? '' : ' w-hide')} disabled={disabledStatusCode} onChange={self.onUrlChange} />
          <HelpIcon docsUrl={'rules/' + self.getStatusProtocol(statusCodeAction) + '.html'} />
        </FormItem>
        <div className="w-form-item">
          <label>
            {renderBox(!disabledHeader, 'disabledHeader')}
            Modify Response Headers
            <HelpIcon className="ml-10" docsUrl="rules/resHeaders.html#related" />
          </label>
            {
              headerActions.map(function(action) {
                return (
                  <div data-name="headerActions" className="w-form-value" data-index={action.index} key={action.index}>
                    {self.renderHeaders(action, disabledHeader, false, 'w-190')}
                    {self.renderHeaderAction(action, disabledHeader)}
                    {self.renderButtons(action, disabledHeader, headerCount)}
                  </div>
                );
              })
            }
        </div>
        <div className="w-form-item">
          <label>
            {renderBox(!disabledBody, 'disabledBody')}
            Modify Response Body
            <HelpIcon className="ml-10" docsUrl="rules/resBody.html#related" />
          </label>
            {
              bodyActions.map(function(action) {
                return (
                  <div data-name="bodyActions" className="w-form-value" data-index={action.index} key={action.index}>
                    <Select className="w-190" disabled={disabledBody} value={action.type} data={action} options={BODY_ACTIONS}
                      onChange={self.onActionChange} key={action.index} />
                    {self.renderBodyAction(action, disabledBody, BODY_ACTIONS, 1)}
                    {self.renderButtons(action, disabledBody, bodyCount)}
                  </div>
                );
              })
            }
        </div>
        {self.renderCookieDialog()}
      </div>
    );
  }
});

module.exports = ResponseRule;
