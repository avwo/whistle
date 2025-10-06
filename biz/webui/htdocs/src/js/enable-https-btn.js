var React = require('react');
var dataCenter = require('./data-center');
var events = require('./events');
var util = require('./util');

var EnableHttpsBtn = React.createClass({
  showHttpsSettingsDialog: function () {
    events.trigger('showHttpsSettingsDialog');
  },
  showHelp: function () {
    window.open(util.getDocsBaseUrl('faq.html#tunnel-to'));
  },
  render: function () {
    if (dataCenter.isMultiEnv()) {
      return null;
    }
    if (!dataCenter.isCapture) {
      return <span className="glyphicon glyphicon-lock w-enable-https-btn" onClick={this.showHttpsSettingsDialog} />;
    }
    return <span className="glyphicon glyphicon-question-sign w-enable-https-btn-help" title="Show help" onClick={this.showHelp} />;
  }
});

module.exports = EnableHttpsBtn;
