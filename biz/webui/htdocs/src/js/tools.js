require('../css/tools.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var $ = require('jquery');
var Console = require('./console-log');
var ServerLog = require('./server-log');
var ToolBox = require('./tool-box');
var LazyInit = require('./lazy-init');
var dataCenter = require('./data-center');
var TabMgr = require('./tab-mgr');
var BtnGroup = require('./btn-group');
var util = require('./util');

var getBool = util.getBool;

var BTNS = [
  {
    name: 'Console',
    icon: 'console',
    active: true
  },
  {
    name: 'Server',
    icon: 'file'
  },
  {
    name: 'Toolbox',
    icon: 'briefcase'
  }
];

var Tools = React.createClass({
  getInitialState: function () {
    return { name: 'Console' };
  },
  componentDidMount: function() {
    var self = this;
    util.on('toolTabsChange', function () {
      self.changeTab = true;
      self.setState({});
    });
  },
  shouldComponentUpdate: function (nextProps) {
    var self = this;
    var hide = getBool(self.props.hide);
    if (hide != getBool(nextProps.hide)) {
      return true;
    }
    if (hide) {
      return false;
    }
    var changeTab = self.changeTab;
    self.changeTab = false;
    return changeTab === true;
  },
  toggleTabs: function (btn) {
    this.changeTab = true;
    this.setState({ name: btn.name, plugin: null });
  },
  showTab: function(index, id) {
    var self = this;
    self.refs.tabs.handleClick(BTNS[index]);
    if (util.isStr(id)) {
      self.refs.console.showLogId(id);
      self.shakeTab();
    }
  },
  shakeTab: function() {
    util.shakeElem($(findDOMNode(this.refs.tabs)).find('button.active'));
  },
  clearLogs: function () {
    var self = this;
    if (BTNS[0].active) {
      self.refs.console.clearLogs();
    } else if (BTNS[1].active) {
      self.refs.serverLog.clearLogs();
    }
  },
  onDoubleClickBar: function () {
    var refs = this.refs;
    if (BTNS[0].active) {
      if (refs.console.container.scrollTop < 5) {
        refs.console.autoRefresh();
      } else {
        refs.console.scrollTop();
      }
    } else if (BTNS[1].active) {
      if (refs.serverLog.container.scrollTop < 5) {
        refs.serverLog.autoRefresh();
      } else {
        refs.serverLog.scrollTop();
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
            var icon = util.getTabIcon(tab);
            return (
              <button
                key={'_' + pluginName}
                onClick={function () {
                  self.showCustomTab(tab);
                }}
                className={'w-custom-tab-btn ' + self.getStyle(pluginName)}
                title={pluginName}
              >
              {icon ? <img className="w-tab-icon" src={icon} /> : null}
              {tab.name}
              </button>
            );
          })
        }
      </div>
    );
  },
  render: function () {
    var self = this;
    var state = self.state;
    var name = state.name;
    return (
      <div
        className={
          'fill v-box w-tools' +
          util.getHide(getBool(self.props.hide))
        }
      >
        <BtnGroup
          ref="tabs"
          onDoubleClickBar={self.onDoubleClickBar}
          onClick={self.toggleTabs}
          onDoubleClick={self.clearLogs}
          btns={BTNS}
          appendTabs={self.createCustomTabs()}
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
          hide={getBool(self.props.hide)}
          tabs={dataCenter.getToolTabs()}
          className="w-custom-tab-panel"
        />
      </div>
    );
  }
});

module.exports = Tools;
