var React = require('react');
var Icon = require('./icon');
var getHide = require('./util').getHide;

var BackToBottomBtn = React.createClass({
  setDisplay: function(display) {
    this.refs.backBtn.style.display = display;
  },
  show: function() {
    this.setDisplay('flex');
  },
  hide: function() {
    this.setDisplay('none');
  },
  render() {
    var props = this.props;
    return (
      <div className={'w-back-to-the-bottom' + getHide(props.hide)} ref="backBtn" onClick={props.onClick} title="Back to the bottom">
        <Icon name="arrow-down" />
      </div>
    );
  }
});

module.exports = BackToBottomBtn;
