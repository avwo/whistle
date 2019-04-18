var React = require('react');

var JSONTools = React.createClass({

  render: function() {
    return (
      <div className={this.props.hide ? 'hide' : undefined}>
        JSONTool
      </div>
    );
  }
});

module.exports = JSONTools;
