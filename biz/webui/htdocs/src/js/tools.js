require('./base-css.js');
require('../css/tools.css');
var React = require('react');
var Console = require('./console');
var ServerLog = require('./server-log');
var ToolBox = require('./tool-box');
var Favorites = require('./favorites');

var BtnGroup = require('./btn-group');
var util = require('./util');

var BTNS = [
  {
    name: 'Console',
    icon: 'file',
    active: true
  },
  {
    name: 'Server',
    icon: 'exclamation-sign'
  },
  {
    name: 'Toolbox',
    icon: 'wrench'
  }/* ,
  {
    name: 'Favorites',
    icon: 'heart'
  } */
];

var Tools = React.createClass({
  getInitialState: function() {
    return { initedConsole: true, name: Console };
  },
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
    this.state['inited' + btn.name] = true;
    this.setState({ name: btn.name });
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
    var state = this.state;
    return (
        <div className={'fill orient-vertical-box w-detail-log' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
          <BtnGroup onDoubleClickBar={this.onDoubleClickBar} onClick={this.toggleTabs} onDoubleClick={this.clearLogs} btns={BTNS} />
          {state.initedConsole ? <Console ref="console" hide={!BTNS[0].active} /> : undefined}
          {state.initedServer ? <ServerLog ref="serverLog" hide={!BTNS[1].active} /> : undefined}
          {state.initedToolbox ? <ToolBox hide={!BTNS[2].active} /> : undefined}
          {state.initedFavorites ? <Favorites hide={!BTNS[3].active} /> : undefined}
      </div>
    );
  }
});

module.exports = Tools;
