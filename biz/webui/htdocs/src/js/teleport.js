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
    ReactDOM.unstable_renderSubtreeIntoContainer(
      this,
      this.props.children,
      this.container[0]
    );
    var className = this.props.className;
    if (this._className !== className) {
      this._className = className;
      this.container.removeClass();
      className && this.container.addClass(className);
    }
  },
  componentWillUnmount: function () {
    ReactDOM.unmountComponentAtNode(this.container[0]);
    document.body.removeChild(this.container[0]);
  },
  show: function () {
    if (this.isVisible()) {
      return;
    }
    this.container.show('fast');
  },
  isVisible: function () {
    return this.container.is(':visible');
  },
  hide: function () {
    this.container.hide('fast');
  },
  destroy: function () {
    this.hide();
    this.container && this.componentWillUnmount();
  },
  render: function () {
    return null;
  }
});

module.exports = Portal;
