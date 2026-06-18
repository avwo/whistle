var React = require('react');
var Prompt = require('./prompt');
var storage = require('./storage');
var util = require('./util');

var MAX_CUSTOM_OPTIONS = 36;
var EMPTY_OPTION = { value: '', label: '' };
var LABEL_RE = /^- /;

var Select = React.createClass({
  getInitialState: function() {
    return this.updateOptions();
  },
  getKey: function(name) {
    var props = this.props;
    name = name || props.name;
    return name ? name + 'SelectOptions' : '';
  },
  updateOptions: function(options) {
    var valueList = [];
    var self = this;
    var props = self.props;
    options = (options || props.options).slice().map(function(option) {
      option = util.isStr(option) ? { value: option, label: option } : option;
      valueList.push(option.value);
      return option;
    });
    var innerLen = options.length;
    var name = props.name;
    var key = self.getKey(name);
    var customOptions;
    if (key) {
      var str;
      if (name === 'allHeaders') {
        customOptions = storage.get(self.getKey('requestHeaders'));
        str = storage.get(self.getKey('responseHeaders'));
        if (str && customOptions) {
          customOptions = customOptions + ' ' + str;
        } else {
          customOptions = customOptions || str;
        }
      }
      str = storage.get(key);
      if (str) {
        customOptions = customOptions ? customOptions + ' ' + str : str;
      }
    }
    if (util.notEStr(customOptions)) {
      self._customOptions = customOptions;
      if (props.toLowerCase) {
        customOptions = customOptions.toLowerCase();
      } else if (props.toUpperCase) {
        customOptions = customOptions.toUpperCase();
      }
      customOptions = customOptions.trim().split(/\s+/).slice(0, MAX_CUSTOM_OPTIONS);
      customOptions.forEach(function(value) {
        if (valueList.indexOf(value) === -1) {
          valueList.push(value);
          options.push({ value: value, label: value });
        }
      });
    }
    return {
      innerLen: innerLen,
      options: options
    };
  },
  componentDidMount: function() {
    var self = this;
    var props = self.props;
    var options = self.state.options;
    if (!props.selectPlaceholder && !props.value && options.length) {
      self.handleChange(options[0]);
    }
  },
  shouldComponentUpdate: function(nextProps) {
    var self = this;
    var nextOptions = nextProps.options;
    var customOptions = self._customOptions;
    if (self.props.options !== nextOptions || (customOptions && customOptions !== storage.get(self.getKey()))) {
      var result = self.updateOptions(nextOptions);
      self.state.options = result.options;
      self.state.innerLen = result.innerLen;
    }
    return true;
  },
  handleChange: function(option) {
    var props = this.props;
    var onChange = props.onChange;
    if (onChange) {
      option.target = this.refs.select;
      onChange(option, props.data);
    }
  },
  createOption: function(value) {
    var self = this;
    var props = self.props;
    if (props.toLowerCase) {
      value = value.toLowerCase();
    } else if (props.toUpperCase) {
      value = value.toUpperCase();
    }
    var option = self.getOption(value);
    if (option) {
      self.handleChange(option);
      return;
    }
    var state = self.state;
    option = { value: value, label: value };
    state.options.push(option);
    self.handleChange(option);
    var key = self.getKey();
    if (!key) {
      return;
    }
    var innerLen = state.innerLen;
    var options = state.options;
    var len = options.length;
    if (len > MAX_CUSTOM_OPTIONS + innerLen) {
      options.splice(innerLen, len - MAX_CUSTOM_OPTIONS - innerLen);
    }
    options = options.slice(innerLen).map(function(option) {
      return option.value;
    }).join(' ');
    storage.set(key, options);
  },
  getOption: function(value) {
    if (!value) {
      return EMPTY_OPTION;
    }
    var options = this.state.options;
    for (var i = 0, len = options.length; i < len; i++) {
      var option = options[i];
      if (option.value === value) {
        return option;
      }
    }
  },
  onChange: function(e) {
    var self = this;
    var value = e.target.value;
    var option = self.getOption(value);
    if (value === ' ') {
      var onCustom = self.props.onCustom;
      if (onCustom) {
        return onCustom(self.createOption);
      }
      return self.refs.prompt.show(self.createOption);
    }
    self.handleChange(option);
  },
  renderOptions: function(options) {
    var result = [];
    for (var i = 0, len = options.length; i < len; i++) {
      var option = options[i];
      var value = option.value;
      if (LABEL_RE.test(value)) {
        var groupName = value.substring(2);
        var items = [];
        for (++i; i < len; i++) {
          var item = options[i];
          var itemVal = item.value;
          if (LABEL_RE.test(item.value)) {
            i--;
            break;
          }
          items.push(<option key={itemVal} value={itemVal}>{item.label}</option>);
        }
        result.push(<optgroup key={value} label={groupName}>{items}</optgroup>);
      } else {
        result.push(<option key={value} value={value}>{option.label}</option>);
      }
    }
    return result;
  },
  render: function() {
    var self = this;
    var props = self.props;
    var name = props.name;
    var options = self.state.options;
    var selectPlaceholder = props.selectPlaceholder;
    var value = props.value || '';
    if (value && !self.getOption(value)) {
      options.push({ value: value, label: value });
    }
    return (
      <select ref="select" disabled={props.disabled} className={'form-control ' + (props.className || '')} value={value}
        onChange={self.onChange} onClick={props.onClick}>
        {selectPlaceholder ? <option value="">{selectPlaceholder}</option> : null}
        {self.renderOptions(options)}
        {name ? <option value=" ">+Custom</option> : null}
        {name ? <Prompt ref="prompt" placeholder={props.placeholder} isNum={props.isNum} isHeader={props.isHeader} maxLength={props.maxLength} /> : null}
      </select>
    );
  }
});

module.exports = Select;
