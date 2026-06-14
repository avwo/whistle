var React = require('react');
var $ = require('jquery');
var Icon = require('./icon');
var win = require('./win');
var util = require('./util');
var UrlInput = require('./url-input');
var JSONEditor = require('./json-editor');
var HeaderSelect = require('./header-select');
var TypeSelect = require('./type-select');
var Dialog = require('./dialog');
var CloseBtn = require('./close-btn');

var getInjectValue = util.getInjectValue;
var getRandomKey = util.getRandomKey;
var MAX_COUNT = 20;
var keyIndex = 0;
var removeSpaces = util.removeSpaces;
var PLACEHOLDER_PREFIX = 'Enter cookie ';
var COOKIE_OPTIONS = [
  {
    label: 'Name',
    placeholder: PLACEHOLDER_PREFIX + 'name'
  },
  {
    label: 'Value',
    placeholder: PLACEHOLDER_PREFIX + 'value'
  },
  {
    label: 'Domain',
    placeholder: PLACEHOLDER_PREFIX + 'domain'
  },
  {
    label: 'Path',
    placeholder: PLACEHOLDER_PREFIX + 'path'
  },
  {
    label: 'Max-Age',
    maxLength: 15,
    placeholder: PLACEHOLDER_PREFIX + 'max-age in seconds, e.g. 3600'
  },
  {
    label: 'SameSite'
  }
];
var COOKIE_ATTRS = ['Secure', 'HttpOnly', 'Partitioned'];

function getElemValue(e) {
  if (util.isString(e.value)) {
    return e.value;
  }
  var target = e.target;
  return target.getAttribute('data-keep-space') ? target.value : removeSpaces(target.value);
}

function getValue(value, keepSpace) {
  return keepSpace ? value : removeSpaces(value);
}

module.exports = {
  createAction: function(action) {
    return { type: action, label: action, value: '', index: keyIndex++ };
  },
  getData: function(e) {
    var key =  e.target.getAttribute('data-key') || 'key';
    var target = $(e.target).closest('.w-form-value');
    var index = +target.data('index');
    var list = this.state[target.data('name')];
    var result = {index: 0 , list: list, key: key};
    for (var i = 0, len = list.length; i < len; i++) {
      if (list[i].index === index) {
        result.index = i;
        return result;
      }
    }
    return result;
  },
  getHeaderRules: function(isReq) {
    var state = this.state;
    if (state.disabledHeader) {
      return;
    }
    var rules = [];
    var values = [];
    var cookies;
    var headers;
    var cookiesKey;
    var headersKey;
    var flag = isReq ? 'q' : 's';
    var allActions = isReq ? HeaderSelect.REQ_HEADERS : HeaderSelect.RES_HEADERS;
    state.headerActions.forEach(function(action) {
      var key = (action.key || '').trim();
      var value = (action.value || '').trim();
      if (!key && !value) {
        return;
      }
      var type = action.type;
      switch(action.type) {
      case allActions[1]:
        key && rules.push('delete://re' + flag + 'Headers.' + key);
        break;
      case allActions[2]:
        key && rules.push('delete://re' + flag + 'Cookies.' + key);
        break;
      default:
        var innerKey;
        if (isReq) {
          if (/^authorization$/i.test(type)) {
            innerKey = getRandomKey('auth_');
            rules.push('auth://{' + innerKey + '}');
            values.push(getInjectValue(innerKey, {
              username: key,
              password: value
            }));
            return;
          }
          if (/^proxy-authorization$/i.test(type)) {
            innerKey = getRandomKey('proxyAuth_');
            rules.push('auth://{' + innerKey + '}');
            values.push(getInjectValue(innerKey, {
              proxy: true,
              username: key,
              password: value
            }));
            return;
          }
          if (/^cookie$/i.test(type)) {
            if (!cookies) {
              cookiesKey = getRandomKey('reqCookies_');
              cookies = {};
              rules.push('reqCookies://{' + cookiesKey + '}');
            }
            if (cookies[key] == null) {
              cookies[key] = value;
            }
            return;
          }
        } else if (/^set-cookie$/i.test(type)) {
          key = key && util.parseRawJson(key);
          if (key) {
            if (!cookies) {
              cookiesKey = getRandomKey('resCookies_');
              cookies = {};
              rules.push('resCookies://{' + cookiesKey + '}');
            }
            var keyName = key.Name || '';
            if (cookies[keyName] == null) {
              cookies[keyName] = key;
              key.value = key.Value || '';
              delete key.Value;
              delete key.Name;
            }
          }
          return;
        }
        if (key) {
          if (!headers) {
            headersKey = getRandomKey('re' + flag + 'Headers_');
            headers = {};
            rules.push('re' + flag + 'Headers://{' + headersKey + '}');
          }
          if (headers[type] == null) {
            headers[type] = key;
          }
        }
      }
    });
    rules = rules.join(' ');
    if (!rules) {
      return;
    }
    if (cookies) {
      values.unshift(getInjectValue(cookiesKey, cookies));
    }
    if (headers) {
      values.unshift(getInjectValue(headersKey, headers));
    }
    return { rules: rules, values: values.join('\n\n') };
  },
  onAdd: function(e) {
    var data = this.getData(e);
    var index = data.index;
    var type = data.list[index].type;
    data.list.splice(index + 1, 0, this.createAction(type));
    this.setState({});
  },
  onRemove: function(e) {
    var self = this;
    var data = self.getData(e);
    var index = data.index;
    var actions = data.list;
    var action = actions[index];
    var remove = function(sure) {
      if (sure) {
        if (actions.length <= 1) {
          actions[0].value = '';
        } else {
          actions.splice(index, 1);
        }
        self.setState({}, self.handleChange);
      }
    };
    if (action.value) {
      win.confirm('Do you confirm the deletion of this item?', remove);
    } else {
      remove(true);
    }
  },
  onDisableCheckChange: function(e) {
    var name = e.target.getAttribute('data-name');
    this.state[name] = !e.target.checked;
    this.setState({}, this.handleChange);
  },
  onEnableCheckChange: function(e) {
    var name = e.target.getAttribute('data-name');
    this.state[name] = e.target.checked;
    this.setState({}, this.handleChange);
  },
  onDataChange: function(e, key) {
    var data = this.getData(e);
    data.list[data.index][key || data.key] = getElemValue(e);
    this.setState({}, this.handleChange);
  },
  onKeyChange: function(e) {
    this.onDataChange(e);
  },
  onValueChange: function(e) {
    this.onDataChange(e, 'value');
  },
  onFileChange: function(url, target) {
    this.onValueChange({ value: url, target: target  });
  },
  onActionChange: function(option, item) {
    item.type = option.value;
    this.setState({}, this.handleChange);
  },
  onCookieChange: function(e) {
    var cookie = this.state.cookie || {};
    var target = e.target;
    var name = target.name;
    if (COOKIE_ATTRS.indexOf(name) === -1) {
      var value = target.value;
      if (name === 'Path' || name === 'Domain') {
        value = util.removeSpaces(value);
      } else if (name === 'Max-Age') {
        value = value.replace(/(^0+|\D+)/g, '');
      }
      cookie[name] = value;
    } else {
      cookie[name] = target.checked || undefined;
    }
    this.setState({ cookie: cookie });
  },
  renderButtons: function(action, disabled, len) {
    var isMax = len >= MAX_COUNT;
    var isMin = len <= 1;
    return [
      <button className="btn btn-primary ml-10 h-32" onClick={this.onAdd} disabled={disabled || isMax}>
        <Icon name="plus" />
      </button>,
      <button className="btn btn-default w-delete ml-10 h-32" onClick={this.onRemove} disabled={disabled || (isMin && !action.value)}>
        <Icon name="minus" />
      </button>
    ];
  },
  showCookieDialog: function(e) {
    var self = this;
    var data = self.getData(e);
    data = data.list[data.index];
    self._cookieAction = data;
    var cookie = util.parseRawJson(data.key, true) || {};
    self.setState({ cookie: cookie }, function() {
      self.refs.cookieDialog.show();
    });
  },
  saveCookie: function() {
    this._cookieAction.key = JSON.stringify(this.state.cookie);
    this.setState({}, this.handleChange);
  },
  renderHeaderAction: function(action, disabled, isReq) {
    var allActions = isReq ? HeaderSelect.REQ_HEADERS : HeaderSelect.RES_HEADERS;
    var name = isReq ? 'request' : 'response';
    var type = action.type;
    if (type === allActions[1]) {
      return this.renderAllHeaders(action, disabled, 'flex-1 mr-0', 'Select ' + name + ' header name to delete');
    }
    if (/^content-type$/i.test(type)) {
      return <TypeSelect isReq={isReq} disabled={disabled} value={action.key} className="flex-1 mr-0" onChange={this.onKeyChange} />;
    }
    if (isReq) {
      var isAuth = /^(proxy-)?authorization$/i.test(type);
      if (isAuth || /^cookie$/i.test(type)) {
        var keyPlaceholder = isAuth ? 'Enter username' : 'Enter request cookie name';
        var valuePlaceholder = isAuth ? 'Enter password' : 'Enter request cookie value';
        return this.renderKV(action, keyPlaceholder, valuePlaceholder, disabled, true, true);
      }
    } else if (/^set-cookie$/i.test(type)) {
      return this.renderKey(action.key, 'Enter response cookie', disabled, true, this.showCookieDialog, 'w-input-ext');
    }
    var delCookie = type === allActions[2];
    var placeholder = 'Enter ' + name + (delCookie ? ' cookie name to delete' : ' header value');
    return this.renderKey(action.key, placeholder, disabled, !delCookie);
  },
  renderHeaders: function(action, disabled, isReq, className) {
    var name = isReq ? 'requestHeaders' : 'responseHeaders';
    return <HeaderSelect name={name} className={className} disabled={disabled} value={action.type}
      isReq={isReq} isRes={!isReq} session={this.props.session} data={action} onChange={this.onActionChange} />;
  },
  renderAllHeaders: function(action, disabled, className, placeholder) {
    return <HeaderSelect className={className} name="allHeaders" session={this.props.session}
            value={action.key} disabled={disabled} onChange={this.onKeyChange} placeholder={placeholder} />;
  },
  renderKey: function(key, placeholder, disabled, keepSpace, onClick, className) {
    return <input type="text" value={getValue(key, keepSpace)} className={'form-control ' + (className || '')} maxLength="2560" readOnly={!!onClick}
      onClick={onClick} placeholder={placeholder} disabled={disabled} onChange={this.onKeyChange} data-keep-space={keepSpace || undefined} />;
  },
  renderKV: function(data, keyPlaceholder, valuePlaceholder, disabled, keepKeySpace, keepValueSpace) {
    return [
      <input type="text" value={getValue(data.key, keepKeySpace)} className="form-control w-190 mr-10" maxLength="2560"
        placeholder={keyPlaceholder} disabled={disabled} onChange={this.onKeyChange} data-keep-space={keepKeySpace || undefined} />,
      <input type="text" value={getValue(data.value, keepValueSpace)} className="form-control" maxLength="2560"
        placeholder={valuePlaceholder} disabled={disabled} onChange={this.onValueChange} data-keep-space={keepValueSpace || undefined} />
    ];
  },
  renderFileInput: function(value, disabled) {
    return <UrlInput value={value} enableLocalFile onChange={this.onFileChange} disabled={disabled} session={this.props.session} />;
  },
  renderJSONEditor: function(value, disabled) {
    return <JSONEditor value={value} disabled={disabled} onChange={this.onValueChange} />;
  },
  renderBodyAction: function(action, disabled, actions) {
    var type = action.type;
    var len = actions.length;
    if (type === actions[len - 1]) {
      return this.renderKey(action.key, 'Enter key path, e.g. a\\.b.c.d', disabled, true);
    }
    if (type === actions[len - 2]) {
      return this.renderJSONEditor(action.value, disabled);
    }
    if (type === actions[len - 3]) {
      return this.renderKV(action, 'Enter keyword or regexp', 'Enter replacement value', disabled, true, true);
    }
    return this.renderFileInput(action.value, disabled);
  },
  renderCookieDialog: function() {
    var cookie = this.state.cookie || {};

    return (
      <Dialog ref="cookieDialog" wstyle="w-create-cookie-dialog">
        <div className="modal-header">
          Create Response Cookie
          <CloseBtn />
        </div>
        <div className="modal-body" onChange={this.onCookieChange}>
          {
            COOKIE_OPTIONS.map(function(option) {
              var label = option.label;
              var value = cookie[label] || '';
              return (
                <div className="w-form-value" key={label}>
                  <label className="w-form-label w-80">{label}: </label>
                  {label === 'SameSite' ? (<select className="form-control" name={label} value={value}>
                    <option>Select cookie same site</option>
                    <option value="None">None</option>
                    <option value="Lax">Lax</option>
                    <option value="Strict">Strict</option>
                  </select>) : <input type="text" name={label} value={value} className="form-control"
                    placeholder={option.placeholder} maxLength={option.maxLength || 2560} autoComplete="off" />}
                </div>
              );
            })
          }
          <div className="w-form-value w-cookie-attrs">
            <label className="w-form-label w-80">Attributes: </label>
            {COOKIE_ATTRS.map(function(name, i) {
              return (
                <label className={i === 1 ? 'mx-20' : null}>
                  <input type="checkbox" name={name} checked={cookie[name] || false} />
                  {name}
                </label>
              );
            })}
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
            data-dismiss="modal"
            className="btn btn-primary"
            disabled={!cookie || (!cookie.Name && !cookie.Value)}
            onClick={this.saveCookie}
          >
            Confirm
          </button>
        </div>
      </Dialog>
    );
  }
};
