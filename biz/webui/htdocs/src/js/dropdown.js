require('../css/dropdown.css');
var React = require('react');

var DropDown = React.createClass({
  getInitialState: function() {
    return {};
  },
  onChange: function(option) {
    var onChange = this.props.onChange;
    if (onChange) {
      onChange(option);
    }
    this.setState({
      selectedOption: option
    });
  },
  onMouseEnter: function() {
    var onBeforeShow = this.props.onBeforeShow;
    if (onBeforeShow) {
      onBeforeShow();
    }
    this.setState({ hover: true });
  },
  onMouseLeave: function() {
    this.setState({ hover: false });
  },
  render: function() {
    var self = this;
    var help = self.props.help;
    var options = self.props.options || [];
    var selectedOption = self.state.selectedOption || options[0] || {};

    return (
      <div
        className="dropdown w-dropdown"
        onMouseEnter={self.onMouseEnter}
        onMouseLeave={self.onMouseLeave}
      >
          <div title={selectedOption.text} className="dropdown-toggle w-dropdown-text">
            {selectedOption.text}
            <span className="caret"></span>
          </div>
          <ul
            style={{display: self.state.hover ? 'block' : 'none'}}
            className="dropdown-menu"
          >
            {
              options.map(function(option) {
                return (
                  <li
                    key={option.value}
                    data-value={option.value}
                    onClick={function() {
                      self.onMouseLeave();
                      if (option === selectedOption) {
                        return;
                      }
                      self.onChange(option);
                    }}
                  >
                    {option.text}
                  </li>
                );
              })
            }
            {help ? <li role="separator" className="divider"></li> : undefined}
            {help ? (
              <li style={{ padding: 0 }}>
                <a
                  href={help}
                  target="_blank"
                >
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
