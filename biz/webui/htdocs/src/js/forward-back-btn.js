var React = require('react');

var FbBtn = React.createClass({
  onForward: function() {
    var props = this.props;
    if (!props.disabledForward && props.onForward) {
      props.onForward();
    }
  },
  onBack: function() {
    var props = this.props;
    if (!props.disabledBack && props.onBack) {
      props.onBack();
    }
  },
  render: function() {
    var props = this.props;
    var disabledForward = props.disabledForward;
    var disabledBack = props.disabledBack;

    return (
      <div className="w-json-history-bar">
        <span
          className={'glyphicon glyphicon-menu-left' + (disabledBack ? ' w-disabled' : '')}
          title={disabledBack ? '' : 'Back'}
          onClick={this.onBack}
        />
        <span
          className={'glyphicon glyphicon-menu-right' + (disabledForward ? ' w-disabled' : '')}
          title={disabledForward ? '' : 'Back'}
          onClick={this.onForward}
        />
      </div>
    );
  }
});

module.exports = FbBtn;
