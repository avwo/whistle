var React = require('react');

var LazyInit = React.createClass({
  render: function () {
    var self = this;
    if (!self.props.inited && !self._inited) {
      return null;
    }
    self._inited = true;
    return self.props.children;
  }
});

module.exports = LazyInit;
