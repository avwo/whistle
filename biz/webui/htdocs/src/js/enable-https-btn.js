var React = require('react');
var dataCenter = require('./data-center');
var events = require('./events');

var EnableHttpsBtn = React.createClass({
  showHttpsSettingsDialog: function () {
    events.trigger('showHttpsSettingsDialog');
  },
  render: function () {
    return dataCenter.needEnableHttps() ? <span className="glyphicon glyphicon-lock w-enable-https-btn" onClick={this.showHttpsSettingsDialog} /> : null;
  }
});

module.exports = EnableHttpsBtn;
