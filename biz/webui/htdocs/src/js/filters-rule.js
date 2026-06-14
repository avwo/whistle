var React = require('react');
var HelpIcon = require('./help-icon');
var util = require('./util');
var ruleMixin = require('./rule-mixin');

var valuePlaceholder = 'Enter keyword (case‑insensitive) or regexp';
var FILTER_OPTIONS = [
  { value: '', label: 'Request URL', placeholder: 'Enter URL fragment or wldcard or regexp' },
  { value: 'm:', label: 'Request Method', placeholder: 'Enter method keyword (case‑insensitive) or regexp' },
  { value: 'b:', label: 'Request Body', placeholder: 'Enter request body keyword (case-insensitive) or regexp' },
  { value: 's:', label: 'Status Code', placeholder: 'Enter status code keyword (case-insensitive) or regexp' },
  { value: 'clientIp:', label: 'Client IP', placeholder: 'Enter client IP keyword (case-insensitive) or regexp' },
  { value: 'serverIp:', label: 'Server IP', placeholder: 'Enter server IP keyword (case-insensitive) or regexp' },
  { value: 'reqH.', keyPlaceholder: 'Select request header', label: 'Request Header',  placeholder: valuePlaceholder },
  { value: 'resH.', keyPlaceholder: 'Select response header', label: 'Response Header', placeholder: valuePlaceholder },
  { value: 'chance:', label: 'Chance', placeholder: 'Enter probability (0-1 or 0%-100%), e.g 0.5 or 50%' }
];

var getOption = function(type) {
  type = type.substring(type.indexOf('://') + 3);
  for (var i = 0, len = FILTER_OPTIONS.length; i < len; i++) {
    var option = FILTER_OPTIONS[i];
    if (option.value === type) {
      return option;
    }
  }
};

var FiltersRule = React.createClass({
  mixins: [ruleMixin],
  getInitialState: function() {
    return {
      disabled: false,
      filters: [this.createAction('includeFilter://')]
    };
  },
  handleChange: function() {
    var state = this.state;
    var result = [];
    if (!state.disabled) {
      var includeFilters = [];
      var excludeFilters = [];
      state.filters.forEach(function(filter) {
        if (filter.value) {
          var type = filter.type;
          if (/re[qs]H\./.test(type)) {
            if (!filter.key) {
              return;
            }
            type += filter.key + ':';
          }
          type = type + filter.value;
          if (type[0] === 'e') {
            excludeFilters.push(type);
          } else {
            includeFilters.push(type);
          }
        }
      });
      result.push(includeFilters.concat(excludeFilters).join(' '));
    }
    result = result.join(' ');
    if (this._curResult !== result) {
      this._curResult = result;
      this.props.onChange(result);
    }
  },
  componentDidMount: function() {
    this.handleChange();
  },
  onDisableChange: function(e) {
    this.setState({ disabled: !e.target.checked }, this.handleChange);
  },
  onChange: function(e) {
    var name = e.target.getAttribute('data-name');
    var data = this.getData(e);
    var filter = data.list[data.index];
    filter[name] = util.removeSpaces(e.target.value);
    this.setState({}, this.handleChange);
  },
  getFilterOptions: function(type) {
    return FILTER_OPTIONS.map(function(option) {
      var value = type.toLowerCase() + 'Filter://' + option.value;
      return <option value={value} key={value}>{type + ' ' + option.label}</option>;
    });
  },
  render: function() {
    var self = this;
    var state = self.state;
    var disabled = state.disabled;
    var filters = state.filters;
    var len = filters.length;

    return (
      <div className="w-form-item w-rules-form">
        <label>
          <input type="checkbox" className="mr-10" checked={!disabled} onChange={self.onDisableChange} />
          Filters
          <HelpIcon className="ml-10" docsUrl="rules/filters.html" />
        </label>
        {
          filters.map(function(filter, i) {
            var type = filter.type;
            var option = getOption(type);
            var keyPlaceholder = option.keyPlaceholder;
            return (
              <div data-name="filters" className="w-form-value" data-index={filter.index} key={filter.index}>
                <select data-name="type" value={type} className="form-control w-190" disabled={disabled} onChange={self.onChange}>
                  <optgroup label="Include Filters">
                    {
                      self.getFilterOptions('Include')
                    }
                  </optgroup>
                  <optgroup label="Exclude Filters">
                    {
                      self.getFilterOptions('Exclude')
                    }
                  </optgroup>
                </select>
                {keyPlaceholder && self.renderAllHeaders(filter, disabled, 'w-190 mr-10', keyPlaceholder)}
                <input type="text"  data-name="value" value={filter.value} className="form-control w-filter-header-value" maxLength="100"
                  placeholder={option.placeholder} disabled={disabled} onChange={self.onChange} />
                {self.renderButtons(filter, disabled, len)}
              </div>
            );
          })
        }
      </div>
    );
  }
});

module.exports = FiltersRule;
