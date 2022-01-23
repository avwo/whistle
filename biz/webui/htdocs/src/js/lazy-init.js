var React = require('react');

var LazyInit = React.createClass({
  render: function () {
    if (!this.props.inited && !this._inited) {
      return null;
    }
    this._inited = true;
    return this.props.children;
  }
});

module.exports = LazyInit;
