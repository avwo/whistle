require('../css/plugins.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var events = require('./events');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var win = require('./win');
var LazyInit = require('./lazy-init');

var CMD_RE = /^([\w]{1,12})(\s+-g)?$/;
var pendingEnable;

function getPluginComparator(plugins) {
  return function (a, b) {
    var p1 = plugins[a];
    var p2 = plugins[b];
    p1._key = a;
    p2._key = b;
    return util.comparePlugin(p1, p2);
  };
}

function enableAllPlugins(e) {
  if (pendingEnable) {
    return;
  }
  pendingEnable = setTimeout(function () {
    pendingEnable = null;
  }, 2000);
  events.trigger('disableAllPlugins', e);
}

function getCmd(uninstall) {
  var cmdName = dataCenter.getServerInfo().cmdName;
  var g = '';
  if (cmdName && CMD_RE.test(cmdName)) {
    cmdName = RegExp.$1 + ' ';
    g = ' ' + RegExp.$2.trim();
  } else {
    cmdName = 'w2 ';
  }
  return cmdName + (uninstall ? 'uninstall' : 'install') + g + ' ';
}

window.getWhistleProxyServerInfo = function () {
  var serverInfo = dataCenter.getServerInfo();
  return serverInfo && $.extend(true, {}, serverInfo);
};

function getAccount(plugin) {
  return plugin.account ? ' --account=' + plugin.account : '';
}

function getUpdateUrl(plugin) {
  return plugin.updateUrl || plugin.moduleName;
}

var Home = React.createClass({
  componentDidMount: function () {
    var self = this;
    self.setUpdateAllBtnState();
    events.on('updateAllPlugins', function (_, byInstall) {
      byInstall = byInstall === 'reinstallAllPlugins';
      var data = self.props.data || {};
      var plugins = data.plugins || {};
      var newPlugins = {};
      Object.keys(plugins)
        .sort(getPluginComparator(plugins))
        .map(function (name) {
          var plugin = plugins[name];
          if (plugin.isProj || (!byInstall && !util.compareVersion(plugin.latest, plugin.version))) {
            return;
          }
          var registry = (plugin.registry
            ? ' --registry=' + plugin.registry
            : '') + getAccount(plugin);
          var list = newPlugins[registry] || [];
          list.push(getUpdateUrl(plugin));
          newPlugins[registry] = list;
        });
      var cmdMsg = Object.keys(newPlugins)
        .map(function (registry) {
          var list = newPlugins[registry].join(' ');
          return getCmd() + list + registry;
        })
        .join('\n\n');
      cmdMsg &&
        self.setState(
          {
            cmdMsg: cmdMsg,
            uninstall: false
          },
          self.showMsgDialog
        );
    });
  },
  componentDidUpdate: function () {
    this.setUpdateAllBtnState();
  },
  onOpen: function (e) {
    this.props.onOpen && this.props.onOpen(e);
    e.preventDefault();
  },
  syncData: function (plugin) {
    dataCenter.syncData(plugin);
  },
  showDialog: function () {
    this.refs.pluginRulesDialog.show();
  },
  hideDialog: function () {
    this.refs.pluginRulesDialog.hide();
  },
  showRules: function (e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    plugin.name = name;
    this.setState(
      {
        plugin: plugin
      },
      this.showDialog
    );
  },
  onCmdChange: function (e) {
    this.setState({ cmdMsg: e.target.value });
  },
  showMsgDialog: function () {
    this.refs.operatePluginDialog.show();
  },
  showUpdate: function (e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    var registry = plugin.registry ? ' --registry=' + plugin.registry : '';
    this.setState(
      {
        cmdMsg: getCmd() + getUpdateUrl(plugin) + getAccount(plugin) + registry,
        isSys: plugin.isSys,
        uninstall: false
      },
      this.showMsgDialog
    );
  },
  showUninstall: function (e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    var sudo = this.props.data.isWin ? '' : 'sudo ';
    var isSys = plugin.isSys;
    var cmdMsg = isSys ? getCmd(true) : sudo + 'npm uninstall -g ';
    var registry =
      !isSys && plugin.registry ? ' --registry=' + plugin.registry : '';
    this.setState(
      {
        cmdMsg: cmdMsg + plugin.moduleName + getAccount(plugin) + registry,
        isSys: isSys,
        uninstall: true,
        pluginPath: plugin.path
      },
      this.showMsgDialog
    );
  },
  enableAllPlugins: function (e) {
    var self = this;
    var data = self.props.data || {};
    if (pendingEnable || !data.disabledAllPlugins) {
      return;
    }
    win.confirm('Do you want to turn on Plugins?', function (sure) {
      sure && enableAllPlugins(e);
    });
  },
  setUpdateAllBtnState: function () {
    events.trigger('setUpdateAllBtnState', this.hasNewPlugin);
  },
  render: function () {
    var self = this;
    var data = self.props.data || {};
    var plugins = data.plugins || [];
    var state = self.state || {};
    var plugin = state.plugin || {};
    var cmdMsg = state.cmdMsg;
    var list = Object.keys(plugins);
    var disabledPlugins = data.disabledPlugins || {};
    var disabled = data.disabledAllPlugins;
    var ndp = data.ndp;
    self.hasNewPlugin = false;

    return (
      <div
        className="fill orient-vertical-box w-plugins"
        style={{ display: self.props.hide ? 'none' : '' }}
      >
        <div className="w-plugins-headers">
          <table className="table">
            <thead>
              <tr>
                <th className="w-plugins-order">#</th>
                <th className="w-plugins-active">Active</th>
                <th className="w-plugins-date">Date</th>
                <th className="w-plugins-name">Name</th>
                <th className="w-plugins-version">Version</th>
                <th className="w-plugins-operation">Operation</th>
                <th className="w-plugins-desc">Description</th>
              </tr>
            </thead>
          </table>
        </div>
        <div className="fill w-plugins-list">
          <table className="table table-hover">
            <tbody>
              {list.length ? (
                list.sort(getPluginComparator(plugins)).map(function (name, i) {
                  var plugin = plugins[name];
                  name = name.slice(0, -1);
                  var checked = !disabledPlugins[name];
                  var openOutside =
                    plugin.pluginHomepage && !plugin.openInPlugins;
                  var url = plugin.pluginHomepage || 'plugin.' + name + '/';
                  var hasNew = util.compareVersion(
                    plugin.latest,
                    plugin.version
                  );
                  if (hasNew) {
                    hasNew = '(New: ' + plugin.latest + ')';
                    self.hasNewPlugin = true;
                  }
                  return (
                    <tr
                      key={name}
                      className={
                        (!disabled && checked ? '' : 'w-plugins-disable') +
                        (hasNew ? ' w-has-new-version' : '')
                      }
                    >
                      <th
                        className="w-plugins-order"
                        onDoubleClick={self.enableAllPlugins}
                      >
                        {i + 1}
                      </th>
                      <td
                        className="w-plugins-active"
                        onDoubleClick={self.enableAllPlugins}
                      >
                        <input
                          type="checkbox"
                          title={
                            ndp
                              ? 'Not allowed disable plugins'
                              : disabled
                              ? 'Disabled'
                              : (checked ? 'Disable ' : 'Enable ') + name
                          }
                          data-name={name}
                          checked={ndp || checked}
                          disabled={!ndp && disabled}
                          onChange={self.props.onChange}
                          className={ndp ? 'w-not-allowed' : undefined}
                        />
                      </td>
                      <td className="w-plugins-date">
                        {util.toLocaleString(new Date(plugin.mtime))}
                      </td>
                      <td className="w-plugins-name" title={plugin.moduleName}>
                      {plugin.noOpt ? <span>{name}</span> : <a
                          href={url}
                          target="_blank"
                          data-name={name}
                          onClick={openOutside ? null : self.onOpen}
                        >
                          {name}
                        </a>}
                      </td>
                      <td className="w-plugins-version">
                        {plugin.homepage ? (
                          <a href={plugin.homepage} target="_blank">
                            {plugin.version}
                          </a>
                        ) : (
                          plugin.version
                        )}
                        {hasNew ? (
                          plugin.homepage ? (
                            <a
                              className="w-new-version"
                              href={plugin.homepage}
                              target="_blank"
                            >
                              {hasNew}
                            </a>
                          ) : (
                            <span className="w-new-version">{hasNew}</span>
                          )
                        ) : undefined}
                      </td>
                      <td className="w-plugins-operation">
                        {plugin.noOpt ? <span className="disabled">Option</span> : <a
                          href={url}
                          target="_blank"
                          data-name={name}
                          className="w-plugin-btn"
                          onClick={openOutside ? null : self.onOpen}
                        >
                          Option
                        </a>}
                        {plugin.rules || plugin._rules || plugin.resRules ? (
                          <a
                            draggable="false"
                            data-name={name}
                            onClick={self.showRules}
                          >
                            Rules
                          </a>
                        ) : (
                          <span className="disabled">Rules</span>
                        )}
                        {plugin.isProj ? (
                          <span className="disabled">Update</span>
                        ) : (
                          <a
                            draggable="false"
                            className="w-plugin-btn w-plugin-update-btn"
                            data-name={name}
                            onClick={self.showUpdate}
                          >
                            Update
                          </a>
                        )}
                        {(plugin.isProj || plugin.notUn) ? (
                          <span className="disabled">Uninstall</span>
                        ) : (
                          <a
                            draggable="false"
                            className="w-plugin-btn"
                            data-name={name}
                            onClick={self.showUninstall}
                          >
                            Uninstall
                          </a>
                        )}
                        {plugin.homepage ? (
                          <a
                            href={plugin.homepage}
                            className="w-plugin-btn"
                            target="_blank"
                          >
                            Help
                          </a>
                        ) : (
                          <span className="disabled">Help</span>
                        )}
                        {util.isString(plugin.rulesUrl) ||
                        util.isString(plugin.valuesUrl) ? (
                          <a
                            className="w-plugin-btn"
                            onClick={function () {
                              self.syncData(plugin);
                            }}
                          >
                            Sync
                          </a>
                        ) : undefined}
                      </td>
                      <td className="w-plugins-desc" title={plugin.description}>
                        {plugin.description}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="w-empty">
                    <a
                      href="https://github.com/whistle-plugins"
                      target="_blank"
                    >
                      Empty
                    </a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Dialog ref="pluginRulesDialog" wstyle="w-plugin-rules-dialog">
          <div className="modal-header">
            <h4>{plugin.name}</h4>
            <button type="button" className="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="w-plugin-rules">
              {plugin.rules ? (
                <fieldset>
                  <legend>rules.txt</legend>
                  <pre>{plugin.rules}</pre>
                </fieldset>
              ) : null}
              {plugin._rules ? (
                <fieldset>
                  <legend>reqRules.txt (_rules.txt)</legend>
                  <pre>{plugin._rules}</pre>
                </fieldset>
              ) : null}
              {plugin.resRules ? (
                <fieldset>
                  <legend>resRules.txt</legend>
                  <pre>{plugin.resRules}</pre>
                </fieldset>
              ) : null}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Close
            </button>
          </div>
        </Dialog>
        <Dialog ref="operatePluginDialog" wstyle="w-plugin-update-dialog">
          <div className="modal-body">
            <h5>
              <a
                data-dismiss="modal"
                className="w-copy-text-with-tips"
                data-clipboard-text={cmdMsg}
              >
                Copy the following command
              </a>{' '}
              to the CLI to execute:
            </h5>
            <textarea
              value={cmdMsg}
              className="w-plugin-update-cmd"
              onChange={this.onCmdChange}
            />
            <div
              style={{
                margin: '8px 0 0',
                color: 'red',
                'word-break': 'break-all',
                display: !state.isSys && state.uninstall ? '' : 'none'
              }}
            >
              If uninstall failed, delete the following directory instead:
              <a
                className="w-copy-text-with-tips"
                data-dismiss="modal"
                data-clipboard-text={state.pluginPath}
                style={{ marginLeft: 5, cursor: 'pointer' }}
              >
                {state.pluginPath}
              </a>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              data-dismiss="modal"
              className="btn btn-primary w-copy-text-with-tips"
              data-clipboard-text={cmdMsg}
            >
              Copy
            </button>
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Close
            </button>
          </div>
        </Dialog>
      </div>
    );
  }
});

var Tabs = React.createClass({
  componentDidMount: function () {
    var self = this;
    var tabPanel = ReactDOM.findDOMNode(self.refs.tabPanel);
    var wrapper = tabPanel.parentNode;
    var timer;

    function resizeHandler() {
      clearTimeout(timer);
      timer = setTimeout(_resizeHandler, 60);
    }

    function _resizeHandler() {
      if (self.props.hide) {
        return;
      }
      var height = wrapper.offsetHeight;
      if (height) {
        tabPanel.style.width = wrapper.offsetWidth + 'px';
        tabPanel.style.height = height + 'px';
      }
    }
    self._resizeHandler = resizeHandler;
    resizeHandler();
    $(window).on('resize', resizeHandler);
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    return !this.props.hide || !nextProps.hide;
  },
  componentDidUpdate: function (prevProps, prevState) {
    if (prevProps.hide && !this.props.hide) {
      this._resizeHandler();
    }
  },
  onClose: function (e) {
    this.props.onClose && this.props.onClose(e);
    e.stopPropagation();
  },
  render: function () {
    var self = this;
    var props = self.props;
    var tabs = props.tabs || [];
    var activeName = 'Home';
    var disabledPlugins = props.disabledPlugins || {};
    var disabled = props.disabledAllPlugins;
    var ndp = props.ndp;
    var active = self.props.active;
    if (active && active != activeName) {
      for (var i = 0, len = tabs.length; i < len; i++) {
        var tab = tabs[i];
        if (tab.name == active) {
          activeName = tab.name;
          break;
        }
      }
    }

    return (
      <div
        className="w-nav-tabs fill orient-vertical-box"
        style={{
          display: self.props.hide ? 'none' : '',
          paddingTop: disabled ? 0 : undefined
        }}
      >
        {disabled ? (
          <div className="w-record-status" style={{ marginBottom: 5 }}>
            All plugins is disabled
            <button className="btn btn-primary" onClick={enableAllPlugins}>
              Enable
            </button>
          </div>
        ) : null}
        <ul className="nav nav-tabs">
          <li
            className={
              'w-nav-home-tab' + (activeName == 'Home' ? ' active' : '')
            }
            data-name="Home"
            onClick={self.props.onActive}
          >
            <a draggable="false">Home</a>
          </li>
          {tabs.map(function (tab) {
            var disd = !ndp && (disabled || disabledPlugins[tab.name]);
            return (
              <li className={activeName == tab.name ? ' active' : ''}>
                <a
                  data-name={tab.name}
                  title={tab.name}
                  onClick={self.props.onActive}
                  draggable="false"
                  className={disd ? 'w-plugin-tab-disabled' : undefined}
                >
                  {disd ? (
                    <span className="glyphicon glyphicon-ban-circle"></span>
                  ) : undefined}
                  {tab.name}
                  <span
                    data-name={tab.name}
                    title="Close"
                    className="w-close-icon"
                    onClick={self.onClose}
                  >
                    &times;
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <div className="fill orient-vertical-box w-nav-tab-panel">
          <div ref="tabPanel" className="fill orient-vertical-box">
            <Home
              data={self.props}
              hide={activeName != 'Home'}
              onChange={self.props.onChange}
              onOpen={self.props.onOpen}
            />
            {tabs.map(function (tab) {
              return (
                <LazyInit inited={activeName == tab.name}>
                  <iframe
                    style={{ display: activeName == tab.name ? '' : 'none' }}
                    src={tab.url}
                  />
                </LazyInit>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Tabs;
