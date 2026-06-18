var React = require('react');
var Icon = require('./icon');

var Tabs = React.createClass({
  render: function() {
    var self = this;
    var tabs = self.props.tabs || [];
    var onChange = self.props.onChange;

    return (
      <ul className="nav nav-tabs w-tabs">
        {
          tabs.map(function(tab, index) {
            var handleClick = function() {
              if (!tab.active && onChange) {
                onChange(tab);
              }
            };
            return (
              <li key={index} className={tab.active ? 'active' : ''}>
                <a draggable="false" onClick={handleClick}>
                  {tab.icon ? <Icon name={tab.icon} /> : null}
                  {tab.name}
                </a>
              </li>
            );
          })
        }
      </ul>
    );
  }
});

module.exports = Tabs;
