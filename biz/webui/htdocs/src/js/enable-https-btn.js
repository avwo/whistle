var React = require('react');
var dataCenter = require('./data-center');
var events = require('./events');
var Icon = require('./icon');
var HelpIcon = require('./help-icon');

var EnableHttpsBtn = React.createClass({
  showHttpsSettingsDialog: function () {
    events.trigger('showHttpsSettingsDialog');
  },
  render: function () {
    if (dataCenter.isMultiEnv()) {
      return null;
    }
    if (!dataCenter.isCapture) {
      return <Icon name="lock" className="w-enable-https-btn" onClick={this.showHttpsSettingsDialog} />;
    }
    return <HelpIcon className="w-enable-https-help" docsUrl="faq.html#tunnel-to" />;
  }
});

module.exports = EnableHttpsBtn;
