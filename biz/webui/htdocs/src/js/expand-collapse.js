var React = require('react');
var util = require('./util');

var MIN_LENGTH = 1024;
var EXPAND_LENGTH = 1024 * 32;
var MAX_LENGTH = EXPAND_LENGTH * 3;

var renderBtn = function (text, onClick) {
  return (
    <button onClick={onClick} className="w-expand-collapse">
      {text}
    </button>
  );
};

var ExpandCollapse = React.createClass({
  getInitialState: function () {
    return { expandLength: MIN_LENGTH };
  },
  componentWillReceiveProps: function (nextProps) {
    var self = this;
    var props = self.props;
    if (nextProps.text !== props.text || nextProps.wStyle !== props.wStyle) {
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
        {viewAll ? renderBtn('ViewAll', self.viewAll) : (isCollapse ? null : renderBtn('Expand', self.onExpand))}
        {expandLength > MIN_LENGTH ? renderBtn('Collapse', self.onCollapse) : null}
      </span>
    );
  }
});

module.exports = ExpandCollapse;
