var React = require('react');
var util = require('./util');

var HelpIcon = React.createClass({
  onClick: function(e) {
    util.preventAll(e);
    var props = this.props;
    var url = props.docsUrl;
    url = util.isFunc(url) ? url() : url;
    if (url) {
      return util.trigger('openUrl', util.getDocUrl(url));
    }
    props.onClick(e);
  },
  render: function() {
    var self = this;
    var className = self.props.className;
    var name = self.props['data-name'];
    return <a data-name={name} className={'glyphicon glyphicon-question-sign w-help-icon ' + (className || '')} onClick={self.onClick} />;
  }
});

module.exports = HelpIcon;
