var React = require('react');

var DevTools = React.createClass({

  render: function() {
    return (
      <div className={this.props.hide ? 'hide' : undefined}>
        DevTools
      </div>
    );
  }
});

module.exports = DevTools;
