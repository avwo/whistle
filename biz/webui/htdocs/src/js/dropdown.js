require('../css/dropdown.css');
var React = require('react');
var util = require('./util');

var DropDown = React.createClass({
  getInitialState: function () {
    return {};
  },
  onChange: function (option) {
    var onChange = this.props.onChange;
    if (onChange) {
      onChange(option);
    }
    if (this.props.value == null) {
      this.setState({
        selectedOption: option
      });
    }
  },
  onMouseEnter: function () {
    var onBeforeShow = this.props.onBeforeShow;
    if (onBeforeShow) {
      onBeforeShow();
    }
    this.setState({ hover: true });
  },
  onMouseLeave: function () {
    this.setState({ hover: false });
  },
  getSelectedOption: function () {
    var props = this.props;
    var value = props.value;
    if (value == null) {
      return;
    }
    return util.findArray(props.options, function (item) {
      return item === value || item.value === value;
    });
  },
  render: function () {
    var self = this;
    var help = self.props.help;
    var options = self.props.options || [];
    var firstOption = options[0] || {};
    var disabled = self.props.disabled;
    var selectedOption =
      this.getSelectedOption() || self.state.selectedOption || firstOption;

    return (
      <div
        className="dropdown w-dropdown"
        onMouseEnter={self.onMouseEnter}
        onMouseLeave={self.onMouseLeave}
      >
        <div
          style={{
            color:
              selectedOption === firstOption
                ? undefined
                : selectedOption.color || 'red'
          }}
          title={selectedOption.text}
          className={
            'dropdown-toggle w-dropdown-text' + (disabled ? ' w-disabled' : '')
          }
        >
          {selectedOption.icon ? (
            <span className={'glyphicon glyphicon-' + selectedOption.icon} />
          ) : undefined}
          {selectedOption.text}
          <span className="caret"></span>
        </div>
        <ul
          style={{
            display: !disabled && self.state.hover ? 'block' : 'none',
            padding: help ? undefined : 0
          }}
          className="dropdown-menu"
        >
          {options.map(function (option) {
            return (
              <li
                key={option.value}
                title={option.text}
                data-value={option.value}
                onClick={function () {
                  self.onMouseLeave();
                  if (option === selectedOption) {
                    return;
                  }
                  self.onChange(option);
                }}
              >
                {option.icon ? (
                  <span className={'glyphicon glyphicon-' + option.icon} />
                ) : undefined}
                {option.text}
              </li>
            );
          })}
          {help ? <li role="separator" className="divider"></li> : undefined}
          {help ? (
            <li style={{ padding: 0 }}>
              <a href={help} target="_blank">
                Help
              </a>
            </li>
          ) : undefined}
        </ul>
      </div>
    );
  }
});

module.exports = DropDown;
