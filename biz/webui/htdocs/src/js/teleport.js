var $ = (window.jQuery = require('jquery'));
var React = require('react');
var ReactDOM = require('react-dom');

var Portal = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    var con = $(document.createElement('div'));
    this.container = con;
    con.hide();
    document.body.appendChild(con[0]);
    this.componentDidUpdate();
  },
  componentDidUpdate: function () {
    var self = this;
    ReactDOM.unstable_renderSubtreeIntoContainer(
      self,
      self.props.children,
      self.container[0]
    );
    var className = self.props.className;
    if (self._className !== className) {
      self._className = className;
      self.container.removeClass();
      className && self.container.addClass(className);
    }
  },
  componentWillUnmount: function () {
    var self = this;
    ReactDOM.unmountComponentAtNode(self.container[0]);
    document.body.removeChild(self.container[0]);
  },
  show: function () {
    var self = this;
    if (!self.isVisible()) {
      self.container.show('fast');
    }
  },
  isVisible: function () {
    return this.container.is(':visible');
  },
  hide: function () {
    this.container.hide('fast');
  },
  destroy: function () {
    var self = this;
    self.hide();
    self.container && self.componentWillUnmount();
  },
  render: function () {
    return null;
  }
});

module.exports = Portal;
