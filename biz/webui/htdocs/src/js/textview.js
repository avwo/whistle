var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var util = require('./util');

var TextView = React.createClass({
  componentDidMount: function () {
    this.updateValue();
  },
  componentDidUpdate: function () {
    this.updateValue();
  },
  shouldComponentUpdate: function (nextProps) {
    var self = this;
    var props = self.props;
    if (props.value !== nextProps.value) {
      self.updateValue(nextProps.value);
      return true;
    }
    return props.className !== nextProps.className;
  },
  updateValue: function (value) {
    var self = this;
    var props = self.props;
    value = value || props.value || '';
    var textarea = findDOMNode(self.refs.textarea);
    if (props.hide) {
      textarea.value = '';
      self.curValue = '';
      clearTimeout(self._timeout);
      return;
    }
    if (value === self.curValue) {
      return;
    }
    clearTimeout(self._timeout);
    if (textarea.value === value) {
      return;
    }
    if (value.length < 10240) {
      textarea.value = value;
      self.curValue = value;
      return;
    }
    self.curValue = value;
    self._timeout = setTimeout(function () {
      textarea.value = value;
    }, 360);
  },
  render: function () {
    return (
      <textarea
        ref="textarea"
        onKeyDown={util.preventDefault}
        readOnly="readonly"
        className={this.props.className || ''}
      />
    );
  }
});

module.exports = TextView;
