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
    if (
      nextProps.text !== this.props.text ||
      this.props.wStyle !== nextProps.wStyle
    ) {
      this.state.expandLength = MIN_LENGTH;
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
    var text = this.props.text;
    var len = (text && text.length) || 0;
    if (len < 2100) {
      return <span style={this.wStyle}>{text}</span>;
    }
    var expandLength = this.state.expandLength;
    var isCollapse = expandLength >= len;
    var viewAll = !isCollapse && expandLength > MAX_LENGTH;
    return (
      <span style={this.wStyle}>
        {isCollapse ? text : text.substring(0, expandLength) + '...'}
        {viewAll ? (
          <button onClick={this.viewAll} className="w-expand-collapse">
            ViewAll
          </button>
        ) : isCollapse ? undefined : (
          <button onClick={this.onExpand} className="w-expand-collapse">
            Expand
          </button>
        )}
        {expandLength > MIN_LENGTH ? (
          <button onClick={this.onCollapse} className="w-expand-collapse">
            Collapse
          </button>
        ) : undefined}
      </span>
    );
  }
});

module.exports = ExpandCollapse;
