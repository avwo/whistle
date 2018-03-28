require('./base-css.js');
require('../css/log.css');
var React = require('react');
var Console = require('./console');
var ServerLog = require('./server-log');

var BtnGroup = require('./btn-group');
var util = require('./util');

var BTNS = [{
  name: 'Console',
  icon: 'file',
  active: true
}, {
  name: 'Server',
  icon: 'exclamation-sign'
}];

var Log = React.createClass({
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    if (hide != util.getBoolean(nextProps.hide)) {
      return true;
    }
    if (hide) {
      return false;
    }
    var changeTab = this.changeTab;
    this.changeTab = false;
    return changeTab === true;
  },
  toggleTabs: function(btn) {
    this.changeTab = true;
    this.setState({});
  },
  clearLogs: function(btn) {
    this.refs[this.isConsole() ? 'console' : 'serverLog'].clearLogs();
  },
  onDoubleClickBar: function() {
    this.refs[this.isConsole() ? 'console' : 'serverLog'].scrollTop();
  },
  isConsole: function() {
    return BTNS[0].active;
  },
  render: function() {
    var isConsole = this.isConsole();
    return (
        <div className={'fill orient-vertical-box w-detail-log' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
          <BtnGroup onDoubleClickBar={this.onDoubleClickBar} onClick={this.toggleTabs} onDoubleClick={this.clearLogs} btns={BTNS} />
          <Console ref="console" hide={!isConsole} />
          <ServerLog ref="serverLog" hide={isConsole} />
      </div>
    );
  }
});

module.exports = Log;
