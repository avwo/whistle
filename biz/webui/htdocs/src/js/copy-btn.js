var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;

var CopyBtn = React.createClass({
  getInitialState: function () {
    return {};
  },
  handleLeave: function () {
    this.setState({ copied: false });
  },
  handleCopy: function () {
    this.setState({ copied: true });
  },
  handleText: function () {
    var value = this.props.value;
    if (typeof value === 'function') {
      findDOMNode(this.refs.btn).setAttribute('data-clipboard-text', value() || '');
    }
  },
  render: function () {
    var props = this.props;
    var copied = this.state.copied;

    return (
      <a
        ref="btn"
        onMouseLeave={this.handleLeave}
        onMouseEnter={this.handleText}
        onClick={this.handleCopy}
        className={(copied ? 'w-copied-text ' : 'w-copy-text ') + (props.className || '')}
        draggable="false"
        title={props.title}
        data-clipboard-text={props.value || ''}
      >
        {(copied ? 'Copied' : 'Copy') + (props.name || '')}
      </a>
    );
  }
});

module.exports = CopyBtn;
