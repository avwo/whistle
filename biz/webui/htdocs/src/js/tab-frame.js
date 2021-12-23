var React = require('react');

var TabFrame = React.createClass({
  render: function() {
    var hide = this.props.hide;
    return <iframe style={{display: hide ? 'none' : undefined}} className="fill w-tab-frame"  />;
  }
});

module.exports = TabFrame;
