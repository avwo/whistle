var React = require('react');

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
  render: function () {
    var copied = this.state.copied;
    return (
      <a
        onMouseLeave={this.handleLeave}
        onClick={this.handleCopy}
        className={'w-copy-btn' + (copied ? ' w-copied-text' : ' w-copy-text')}
        draggable="false"
        data-clipboard-text={this.props.value || ''}
      >
        {(copied ? 'Copied' : 'Copy') + (this.props.name || '')}
      </a>
    );
  }
});

module.exports = CopyBtn;
