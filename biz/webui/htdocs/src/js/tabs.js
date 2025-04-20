require('./base-css.js');
var React = require('react');

var Tabs = React.createClass({
  render: function() {
    var tabs = this.props.tabs || [];
    var onChange = this.props.onChange;

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
                {
                  tab.icon ? <span className={'glyphicon glyphicon-' + tab.icon} /> : null
                }
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
