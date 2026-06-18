var React = require('react');
var util = require('./util');
var events = require('./events');

var HelpIcon = React.createClass({
  shouldComponentUpdate: function (nextProps) {
    var props = this.props;
    return props.className !== nextProps.className || props.docsUrl !== nextProps.docsUrl
    || props.onClick !== nextProps.onClick || props['data-name'] !== nextProps['data-name'];
  },
  onClick: function(e) {
    e.stopPropagation();
    e.preventDefault();
    var props = this.props;
    var url = props.docsUrl;
    url = typeof url === 'function' ? url() : url;
    if (url) {
      return events.trigger('openUrl', util.getDocUrl(url));
    }
    props.onClick(e);
  },
  render: function() {
    var self = this;
    var className = self.props.className;
    var name = self.props['data-name'];
    return <a data-name={name} className={'glyphicon glyphicon-question-sign w-help-icon' + (className ? ' ' + className : '')} onClick={self.onClick} />;
  }
});

module.exports = HelpIcon;
