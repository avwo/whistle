var React = require('react');
var ReactDOM = require('react-dom');

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
      ReactDOM.findDOMNode(this.refs.btn).setAttribute('data-clipboard-text', value() || '');
    }
  },
  render: function () {
    var copied = this.state.copied;
    return (
      <a
        ref="btn"
        onMouseLeave={this.handleLeave}
        onMouseEnter={this.handleText}
        onClick={this.handleCopy}
        className={'w-copy-btn' + (copied ? ' w-copied-text' : ' w-copy-text')}
        draggable="false"
        title={this.props.title}
        data-clipboard-text={this.props.value || ''}
      >
        {(copied ? 'Copied' : 'Copy') + (this.props.name || '')}
      </a>
    );
  }
});

module.exports = CopyBtn;
