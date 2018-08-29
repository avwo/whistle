var React = require('react');

var MIN_LENGTH = 1024 * 2;
var EXPAND_LENGTH = 1024 * 32;

var ExpandCollapse = React.createClass({
  getInitialState: function() {
    return { expandLength: MIN_LENGTH };
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.text !== this.props.text
      || this.props.wStyle !== nextProps.wStyle) {
      this.state.expandLength = MIN_LENGTH;
    }
  },
  onExpand: function() {
    var text = this.props.text;
    var len = text && text.length || 0;
    var expLen = this.state.expandLength;
    this.setState({ expandLength: expLen >= len ? MIN_LENGTH : expLen + EXPAND_LENGTH });
  },
  render: function() {
    var text = this.props.text;
    var len = text && text.length || 0;
    if (len < 2100) {
      return <span style={this.wStyle}>{text}</span>;
    }
    var expandLength = this.state.expandLength;
    var isCollapse = expandLength >= len;
    return (
      <span style={this.wStyle}>
        {isCollapse ? text : text.substring(0, expandLength) + '...'}
        <button onClick={this.onExpand} className="w-expand-collapse">
          {isCollapse ? 'Collapse' : 'Expand'}
        </button>
      </span>
    );
  }
});

module.exports = ExpandCollapse;
