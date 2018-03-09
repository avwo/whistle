var React = require('react');

var CopyBtn = React.createClass({
  getInitialState: function() {
    return {};
  },
  handleLeave: function() {
    this.setState({ copied: false });
  },
  handleCopy: function() {
    this.setState({ copied: true });
  },
  render: function() {
    var copied = this.state.copied;
    return (
      <a onMouseLeave={this.handleLeave}
            onClick={this.handleCopy}
            style={{color: copied ? '#ccc' : undefined}}
            className="w-copy-text" href="javascript:;"
            draggable="false" data-clipboard-text={this.props.value || ''}>
        {copied ? 'Copied' : 'Copy'}
      </a>
    );
  }
});

module.exports = CopyBtn;
