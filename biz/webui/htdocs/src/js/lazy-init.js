var React = require('react');

module.exports = React.createClass({
  render: function() {
    if (!this.props.inited && !this._inited) {
      return null;
    }
    this._inited = true;
    return this.props.children;
  }
});
