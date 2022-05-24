require('./base-css.js');
require('../css/tools.css');
var React = require('react');
var Console = require('./console');
var ServerLog = require('./server-log');
var ToolBox = require('./tool-box');
var events = require('./events');
var LazyInit = require('./lazy-init');
var dataCenter = require('./data-center');
var TabMgr = require('./tab-mgr');

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
      self.changeTab = true;
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
    this.setState({ name: btn.name, plugin: null });
  },
  clearLogs: function () {
    if (BTNS[0].active) {
      this.refs.console.clearLogs();
    } else if (BTNS[1].active) {
      this.refs.serverLog.clearLogs();
    }
  },
  onDoubleClickBar: function () {
    if (BTNS[0].active) {
      if (this.refs.console.container.scrollTop < 5) {
        this.refs.console.autoRefresh();
      } else {
        this.refs.console.scrollTop();
      }
    } else if (BTNS[1].active) {
      if (this.refs.serverLog.container.scrollTop < 5) {
        this.refs.serverLog.autoRefresh();
      } else {
        this.refs.serverLog.scrollTop();
      }
    }
  },
  isActive: function (name) {
    var plugin = this.state.plugin;
    return plugin && plugin.plugin === name;
  },
  getStyle: function (name) {
    return 'btn btn-default' + (this.isActive(name) ? ' w-spec-active' : '');
  },
  showCustomTab: function(tab) {
    this.changeTab = true;
    this.refs.tabs.clearSelection();
    this.setState({ name: null, plugin: tab });
  },
  createCustomTabs: function() {
    var self = this;
    var tabs = dataCenter.getToolTabs();
    if (!tabs.length) {
      return;
    }
    return (
      <div className="fill w-custom-tabs">
        {
          tabs.map(function(tab) {
            var pluginName = tab.plugin;
            return (
              <button
                key={'_' + pluginName}
                onClick={function () {
                  self.showCustomTab(tab);
                }}
                className={self.getStyle(pluginName)}
                title={pluginName}
              >
              {tab.name}
              </button>
            );
          })
        }
      </div>
    );
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
          ref="tabs"
          onDoubleClickBar={this.onDoubleClickBar}
          onClick={this.toggleTabs}
          onDoubleClick={this.clearLogs}
          btns={BTNS}
          appendTabs={this.createCustomTabs()}
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
        <TabMgr
          active={state.plugin && state.plugin.plugin}
          hide={util.getBoolean(this.props.hide)}
          tabs={dataCenter.getToolTabs()}
          className="w-custom-tab-panel"
        />
      </div>
    );
  }
});

module.exports = Tools;
