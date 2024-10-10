var React = require('react');

var FbBtn = React.createClass({
  render: function() {
    var disabledForward = true;
    var disabledBack = false;
    return (
      <div className="w-json-history-bar">
        <span className={'glyphicon glyphicon-menu-left' + (disabledBack ? '' : ' w-disabled')} title={disabledBack ? '' : 'Click to go back'} />
        <span className={'glyphicon glyphicon-menu-right' + (disabledForward ? '' : ' w-disabled')} title={disabledForward ? '' : 'Click to go back'} />
      </div>
    );
  }
});

module.exports = FbBtn;
