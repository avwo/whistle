var React = require('react');

var TabFrame = React.createClass({
  render: function() {
    var props = this.props;
    return <iframe src={props.src} style={{display: props.hide ? 'none' : undefined}} className="fill w-tab-frame"  />;
  }
});

module.exports = TabFrame;
