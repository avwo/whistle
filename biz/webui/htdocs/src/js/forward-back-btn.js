var React = require('react');
var Icon = require('./icon');

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
      <div className="w-json-bar">
        <Icon
          name="menu-left"
          className={disabledBack ? 'w-disabled' : ''}
          title={disabledBack ? '' : 'Back'}
          onClick={this.onBack}
        />
        <Icon
          name="menu-right"
          className={disabledForward ? 'w-disabled' : ''}
          title={disabledForward ? '' : 'Forward'}
          onClick={this.onForward}
        />
      </div>
    );
  }
});

module.exports = FbBtn;
