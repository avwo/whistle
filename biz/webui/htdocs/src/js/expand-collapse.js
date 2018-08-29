var React = require('react');

var ExpandCollapse = React.createClass({
  getInitialState: function() {
    return {};
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.text !== this.props.text
      || this.props.wStyle !== nextProps.wStyle) {
      this.state.expended = false;
    }
  },
  onExpand: function() {
    this.setState({ expended: !this.state.expended });
  },
  render: function() {
    var text = this.props.text;
    if (!text || text.length < 2100) {
      return <span style={this.wStyle}>{text}</span>;
    }
    var expended = this.state.expended;
    return (
      <span style={this.wStyle}>
        {expended ? text : text.substring(0, 2050) + '...'}
        <button onClick={this.onExpand} className="w-expand-collapse">
          {expended ? 'Collapse' : 'Expand'}
        </button>
      </span>
    );
  }
});

module.exports = ExpandCollapse;
