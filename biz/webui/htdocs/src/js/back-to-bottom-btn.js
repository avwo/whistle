var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var Icon = require('./icon');

var BackToBottomBtn = React.createClass({
  componentDidMount: function() {
    this.btn = findDOMNode(this.refs.backBtn);
  },
  show: function() {
    this.btn.style.display = 'flex';
  },
  hide: function() {
    this.btn.style.display = 'none';
  },
  render() {
    var props = this.props;
    return (
      <div className={'w-back-to-the-bottom' + (props.hide ? ' hide' : '')} ref="backBtn" onClick={props.onClick} title="Back to the bottom">
        <Icon name="arrow-down" />
      </div>
    );
  }
});

module.exports = BackToBottomBtn;
