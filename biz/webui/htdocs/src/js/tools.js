require('./base-css.js');
require('../css/tools.css');
var React = require('react');
var Console = require('./console');
var ServerLog = require('./server-log');
var ToolBox = require('./tool-box');
var events = require('./events');
var LazyInit = require('./lazy-init');

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
  }
];

var Tools = React.createClass({
  getInitialState: function () {
    return { name: 'Console' };
  },
  componentDidMount: function() {
    var self = this;
    events.on('toolTabsChange', function () {
      self.setState({});
    });
  },
  shouldComponentUpdate: function (nextProps) {
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
  toggleTabs: function (btn) {
    this.changeTab = true;
    this.setState({ name: btn.name });
  },
  clearLogs: function (btn) {
    this.refs[this.isConsole() ? 'console' : 'serverLog'].clearLogs();
  },
  onDoubleClickBar: function () {
    this.refs[this.isConsole() ? 'console' : 'serverLog'].scrollTop();
  },
  isConsole: function () {
    return BTNS[0].active;
  },
  render: function () {
    var state = this.state;
    var name = state.name;
    return (
      <div
        className={
          'fill orient-vertical-box w-detail-log' +
          (util.getBoolean(this.props.hide) ? ' hide' : '')
        }
      >
        <BtnGroup
          onDoubleClickBar={this.onDoubleClickBar}
          onClick={this.toggleTabs}
          onDoubleClick={this.clearLogs}
          btns={BTNS}
        />
        <LazyInit inited={name === BTNS[0].name}>
          <Console ref="console" hide={!BTNS[0].active} />
        </LazyInit>
        <LazyInit inited={name === BTNS[1].name}>
        <ServerLog ref="serverLog" hide={!BTNS[1].active} />
        </LazyInit>
        <LazyInit inited={name === BTNS[2].name}>
          <ToolBox hide={!BTNS[2].active} />
        </LazyInit>
      </div>
    );
  }
});

module.exports = Tools;
