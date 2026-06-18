var React = require('react');
var util = require('./util');

var MIN_LENGTH = 1024;
var EXPAND_LENGTH = 1024 * 32;
var MAX_LENGTH = EXPAND_LENGTH * 3;

var ExpandCollapse = React.createClass({
  getInitialState: function () {
    return { expandLength: MIN_LENGTH };
  },
  componentWillReceiveProps: function (nextProps) {
    var self = this;
    if (
      nextProps.text !== self.props.text ||
      self.props.wStyle !== nextProps.wStyle
    ) {
      self.state.expandLength = MIN_LENGTH;
    }
  },
  onCollapse: function () {
    this.setState({ expandLength: MIN_LENGTH });
  },
  onExpand: function () {
    this.setState({ expandLength: this.state.expandLength + EXPAND_LENGTH });
  },
  viewAll: function () {
    util.openEditor(this.props.text);
  },
  render: function () {
    var self = this;
    var text = self.props.text;
    var len = (text && text.length) || 0;
    var style = self.props.wStyle;
    if (len < 2100) {
      return <span style={style}>{text}</span>;
    }
    var expandLength = self.state.expandLength;
    var isCollapse = expandLength >= len;
    var viewAll = !isCollapse && expandLength > MAX_LENGTH;
    return (
      <span style={style}>
        {isCollapse ? text : text.substring(0, expandLength) + '...'}
        {viewAll ? (
          <button onClick={self.viewAll} className="w-expand-collapse">
            ViewAll
          </button>
        ) : isCollapse ? undefined : (
          <button onClick={self.onExpand} className="w-expand-collapse">
            Expand
          </button>
        )}
        {expandLength > MIN_LENGTH ? (
          <button onClick={self.onCollapse} className="w-expand-collapse">
            Collapse
          </button>
        ) : undefined}
      </span>
    );
  }
});

module.exports = ExpandCollapse;
