var React = require('react');
var dataCenter = require('./data-center');
var util = require('./util');
var Icon = require('./icon');
var HelpIcon = require('./help-icon');

var showHttpsSettingsDialog = function () {
  util.trigger('showHttpsSettingsDialog');
};

var EnableHttpsBtn = React.createClass({
  render: function () {
    if (dataCenter.isMultiEnv()) {
      return null;
    }
    if (!dataCenter.isCapture) {
      return <Icon name="lock" className="w-enable-https-btn" onClick={showHttpsSettingsDialog} />;
    }
    return <HelpIcon className="w-enable-https-help" docsUrl="faq.html#tunnel-to" />;
  }
});

module.exports = EnableHttpsBtn;
