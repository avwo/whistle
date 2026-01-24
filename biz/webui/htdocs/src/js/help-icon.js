var React = require('react');
var util = require('./util');

var HelpIcon = React.createClass({
  shouldComponentUpdate: function (nextProps) {
    var props = this.props;
    return props.className !== nextProps.className || props.docsUrl !== nextProps.docsUrl
    || props.onClick !== nextProps.onClick || props['data-name'] !== nextProps['data-name'];
  },
  onClick: function(e) {
    var props = this.props;
    if (props.docsUrl) {
      return window.open(util.getDocUrl(props.docsUrl));
    }
    props.onClick(e);
  },
  render: function() {
    var className = this.props.className;
    var name = this.props['data-name'];
    return <a data-name={name} className={'glyphicon glyphicon-question-sign w-help-icon' + (className ? ' ' + className : '')} onClick={this.onClick} />;
  }
});

module.exports = HelpIcon;
