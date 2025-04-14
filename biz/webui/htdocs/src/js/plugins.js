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
var storage = require('./storage');
var PluginsMgr = require('./plugins-mgr');
var ContextMenu = require('./context-menu');
var iframes = require('./iframes');


var CMD_RE = /^([\w]{1,12})(\s+-g)?$/;
var WHISTLE_PLUGIN_RE = /(?:^|[\s,;|])(?:@[\w-]+\/)?whistle\.[a-z\d_-]+(?:\@[\w.^~*-]*)?(?:$|[\s,;|])/;
var SPACE_RE = /\s+$/;
var pendingEnable;
var registryCache;

var CTX_MENU_LIST = [
  { name: 'Copy' },
  { name: 'Disable' },
  { name: 'Option' },
  { name: 'Rules' },
  { name: 'Update' },
  { name: 'Uninstall' },
  {
    name: 'Others',
    action: 'Plugins',
    list: []
  },
  { name: 'Help', sep: true }
];

function getPluginComparator(plugins) {
  return function (a, b) {
    var p1 = plugins[a];
    var p2 = plugins[b];
    p1._key = a;
    p2._key = b;
    return util.comparePlugin(p1, p2);
  };
}

function getPluginList(plugins, installUrls, disabledPlugins) {
  if (!plugins) {
    return [];
  }
  return Object.keys(plugins).sort(getPluginComparator(plugins))
        .map(function (name) {
          var plugin = plugins[name];
          if (!dataCenter.disableInstaller && plugin && installUrls && disabledPlugins
            && plugin.installUrl && !disabledPlugins[name.slice(0, -1)]) {
            installUrls.push(plugin);
          }
          return plugin;
        });
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

function getArgvs(account, dir) {
  var params = account ? ' --account=' + account : '';
  return params + (dir ? ' --dir=' + dir : '');
}

function getParams(plugin) {
  return getArgvs(plugin.account, plugin.dir);
}

function getUpdateUrl(plugin) {
  return plugin.updateUrl || plugin.moduleName;
}

function hasRules(plugin) {
  return plugin.rules || plugin._rules || plugin.resRules;
}

function isOpenExternal(plugin) {
  return (plugin.pluginHomepage || plugin.openExternal) && !plugin.openInPlugins && !plugin.openInModal;
}

function getHomePage(plugin) {
  return plugin.pluginHomepage || 'plugin.' + util.getSimplePluginName(plugin) + '/';
}

var Home = React.createClass({
  componentDidMount: function () {
    var self = this;
    self.setUpdateAllBtnState();
    events.on('openPluginOption', function(_, plugin) {
      if (!plugin) {
        return;
      }
      if (plugin.openInModal) {
        return events.trigger('showPluginOption', plugin);
      }
      var url = getHomePage(plugin);
      if (isOpenExternal(plugin)) {
        return window.open(url);
      }
      events.trigger('showPluginOptionTab', plugin);
    });
    events.on('showUninstallPlugin', function(_, plugin) {
      self.showUninstall(plugin);
    });
    events.on('showInstallPlugin', function(_, plugin) {
      self.showUpdate(plugin);
    });
    events.on('showPluginRules', function(_, plugin) {
      self.onShowRules(util.getSimplePluginName(plugin));
    });
    events.on('installPlugins', self.showInstall);
    events.on('updateAllPlugins', function (_, byInstall) {
      byInstall = byInstall === 'reinstallAllPlugins';
      if (byInstall && (dataCenter.enablePluginMgr || (self.installUrls && self.installUrls.length))) {
        return self.showInstall();
      }
      var data = self.props.data || {};
      var plugins = data.plugins || {};
      var newPlugins = {};
      var registry;
      getPluginList(plugins).forEach(function (plugin) {
        if (!plugin || plugin.isProj || (!byInstall && !util.compareVersion(plugin.latest, plugin.version))) {
          return;
        }
        registry = registry || plugin.registry;
        var account = getParams(plugin);
        var list = newPlugins[account] || [];
        list.push(getUpdateUrl(plugin));
        newPlugins[account] = list;
      });
      var cmdMsg = Object.keys(newPlugins)
        .map(function (registry) {
          var list = newPlugins[registry].join(' ');
          return getCmd() + list + registry;
        })
        .join('\n\n');
      cmdMsg && self.getRegistryList(function(result, r) {
        self.setState({
          cmdMsg: cmdMsg,
          uninstall: false,
          install: false,
          registry: r || registry || '',
          registryChanged: true,
          registryList: result
        }, self.showMsgDialog);
      });
    });
  },
  getRegistryList: function(cb) {
    var list = [];
    if (this.installUrls) {
      this.installUrls.forEach(function(plugin) {
        var reg = plugin.installUrl && plugin.installRegistry;
        Array.isArray(reg) && reg.forEach(function(r) {
          if (r && list.indexOf(r) === -1) {
            list.push(r);
          }
        });
      });
    }
    dataCenter.plugins.getRegistryList(function(data, xhr) {
      var registry = storage.get('pluginsRegistry');
      if (!data) {
        util.showSystemError(xhr);
      } else if (data.ec !== 0) {
        win.alert(data.em);
      } else {
        registryCache = dataCenter.getPluginRegistry();
        data.list.forEach(function(url) {
          if (registryCache.indexOf(url) === -1) {
            registryCache.push(url);
          }
        });
      }
      if (list.length) {
        registryCache = registryCache || [];
        list.forEach(function(url) {
          if (registryCache.indexOf(url) === -1) {
            registryCache.push(url);
          }
        });
      }
      if (!registryCache) {
        return;
      }
      if (registryCache.indexOf(registry) === -1) {
        registry = '';
      }
      cb(registryCache, registry);
    });
  },
  componentDidUpdate: function () {
    this.setUpdateAllBtnState();
  },
  execCmd: function() {
    var state = this.state;
    var install = state.install;
    var cmd = install ? state.installMsg : state.cmdMsg;
    if (!cmd) {
      return;
    }
    if (state.registryList && state.registry) {
      cmd += ' --registry=' + state.registry;
    }
    this.refs.pluginsMgrDialog.show(cmd, this.installUrls, !install);
  },
  onOpen: function (e) {
    var name = e.target.getAttribute('data-name');
    var data = this.props.data;
    var plugin = data && data.plugins && data.plugins[name + ':'] || {};
    if (plugin.openInModal) {
      events.trigger('showPluginOption', plugin);
    } else {
      this.props.onOpen && this.props.onOpen(e);
    }
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
  onShowRules: function(name) {
    var plugin = this.props.data.plugins[name + ':'];
    plugin.name = name;
    this.setState(
      {
        plugin: plugin
      },
      this.showDialog
    );
  },
  showRules: function (e) {
    var name = $(e.target).attr('data-name');
    this.onShowRules(name);
  },
  onCmdChange: function (e) {
    this.updateCmdMsg(e.target.value);
  },
  showMsgDialog: function () {
    var self = this;
    self.refs.operatePluginDialog.show();
    if (self.state.install) {
      setTimeout(function() {
        ReactDOM.findDOMNode(self.refs.textarea).focus();
      }, 600);
    }
  },
  updateCmdMsg: function(msg, cb) {
    if (this.state.install) {
      this.setState({ installMsg: msg }, cb);
    } else {
      this.setState({ cmdMsg: msg }, cb);
    }
  },
  onRegistry: function(e) {
    var registry = e.target.value;
    if (registry === '+Add') {
      var textarea = ReactDOM.findDOMNode(this.refs.textarea);
      var pkgs = [];
      var regs = [];
      var regCmdName = '--registry=';
      textarea.value.trim().split(/\s+/).forEach(function(cmd) {
        if (cmd.indexOf(regCmdName)) {
          pkgs.push(cmd);
        } else {
          regs.push(cmd);
        }
      });
      if (!regs.length) {
        regs.push(regCmdName);
      }
      this.updateCmdMsg(pkgs.concat(regs).join(' '), function() {
        textarea.focus();
      });
      return;
    }
    this.setState({ registry: registry, registryChanged: true });
    storage.set('pluginsRegistry', registry);
  },
  onShowUpdate: function(e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    this.showUpdate(plugin);
  },
  showUpdate: function (plugin) {
    var self = this;
    self.getRegistryList(function(result, r) {
      self.setState(
        {
          cmdMsg: getCmd() + getUpdateUrl(plugin) + getParams(plugin),
          isSys: plugin.isSys,
          uninstall: false,
          install: false,
          registry: r || plugin.registry || '',
          registryChanged: true,
          registryList: result
        },
        self.showMsgDialog
      );
    });
  },
  showInstall: function() {
    var self = this;
    self.getRegistryList(function(result, r) {
      self.setState({
        install: true,
        registryList: result,
        registry: r || '',
        registryChanged: true
      }, self.showMsgDialog);
    });
  },
  onShowUninstall: function(e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    this.showUninstall(plugin);
  },
  showUninstall: function (plugin) {
    var name = plugin.moduleName;
    win.confirm('Are you sure to uninstall plugin \'' + name + '\'.', function(ok) {
      if (ok) {
        dataCenter.plugins.uninstallPlugins({ name: util.getSimplePluginName(plugin) }, function(data, xhr) {
          if (!data) {
            return util.showSystemError(xhr);
          }
          if (data.ec) {
            return win.alert((data.em || 'Error') + ', ' + 'try again or delete the directory manually:\n' + plugin.path,
            plugin.path
          , 'Copy Directory Path');
          }
          util.showHandlePluginInfo(data);
        });
      }
    });
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
    var plugins = data.plugins || {};
    var installUrls = [];
    var disabledPlugins = data.disabledPlugins || {};
    var list = getPluginList(plugins, installUrls, disabledPlugins);
    var state = self.state || {};
    var plugin = state.plugin || {};
    var install = state.install;
    var epm = dataCenter.enablePluginMgr;
    var hasInstaller = epm || installUrls.length;
    var cmdMsg = (install ? state.installMsg : state.cmdMsg) || '';
    var registryList = state.registryList || [];
    var registry = state.registry || '';
    var disabled = data.disabledAllPlugins;
    var ndp = data.ndp;
    var showCopyBtn = !epm &&  hasInstaller;
    var selectStyle = showCopyBtn ? {width: 225} : undefined;
    self.hasNewPlugin = false;
    self.installUrls = installUrls;

    if (state.registryChanged) {
      state.registryChanged = false;
      var regCmd = registry ? ' --registry=' + registry + '  ' : '';
      if (cmdMsg) {
        var r = SPACE_RE.exec(cmdMsg);
        var spaces = r && r[0];
        cmdMsg = cmdMsg.split('\n').map(function(line) {
          line = line.trim();
          line = line.split(/\s+/).filter(function(cmd) {
            return cmd.indexOf('--registry') !== 0;
          }).join(' ');
          if (line && regCmd) {
            line += regCmd;
          }
          return line;
        }).filter(util.noop).join('\n');
        if (spaces && !registry) {
          cmdMsg += spaces;
        }
      } else {
        cmdMsg = getCmd() + getArgvs(dataCenter.account, dataCenter.whistleName) + ' ' + (regCmd ? regCmd : '');
      }
      state.cmdMsg = cmdMsg;
      state.installMsg = cmdMsg;
    }

    var disabledBtn = !WHISTLE_PLUGIN_RE.test(cmdMsg);

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
                list.map(function (plugin, i) {
                  var name = util.getSimplePluginName(plugin);
                  var checked = !disabledPlugins[name];
                  var openInModal = plugin.openInModal;
                  var openExternal = isOpenExternal(plugin);
                  var url = getHomePage(plugin);
                  var homepage = plugin.homepage;
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
                      data-name={name}
                      className={
                        'w-plugins-item' +
                        (!disabled && checked ? '' : ' w-plugins-disable') +
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
                          href={openInModal ? null : url}
                          target="_blank"
                          data-name={name}
                          onClick={openExternal ? null : self.onOpen}
                        >
                          {name}
                        </a>}
                      </td>
                      <td className="w-plugins-version">
                        {homepage ? (
                          <a href={homepage} target="_blank">
                            {plugin.version}
                          </a>
                        ) : (
                          plugin.version
                        )}
                        {hasNew ? (
                          homepage ? (
                            <a
                              className="w-new-version"
                              href={homepage}
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
                          href={openInModal ? null : url}
                          target="_blank"
                          data-name={name}
                          className="w-plugin-btn"
                          onClick={openExternal ? null : self.onOpen}
                        >
                          Option
                        </a>}
                        {hasRules(plugin) ? (
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
                            onClick={self.onShowUpdate}
                          >
                            Update
                          </a>
                        )}
                        {(plugin.isProj || plugin.notUn) ? (
                          <span className="disabled">Uninstall</span>
                        ) : (
                          <a
                            draggable="false"
                            className="w-delete"
                            data-name={name}
                            onClick={self.onShowUninstall}
                          >
                            Uninstall
                          </a>
                        )}
                        {homepage ? (
                          <a
                            href={homepage}
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
            {hasInstaller ? null : (<h5>
              <a
                data-dismiss="modal"
                className="w-copy-text-with-tips"
                data-clipboard-text={cmdMsg}
              >
                Copy the following command
              </a>{' '}
              and execute it in the CLI:
            </h5>)}
            {
              install ? <h5>Input the package name of plugins (separated by spaces) and click Install:</h5> : null
            }
            <textarea
              ref="textarea"
              value={cmdMsg || ''}
              placeholder={install ? 'SUCH AS: whistle.inspect whistle.abc@1.0.0 @org/whistle.xyz' : undefined}
              className={'w-plugin-update-cmd' + (install ? ' w-plugin-install' : '')}
              maxLength={install ? 360 : undefined}
              onChange={this.onCmdChange}
              onKeyDown={util.handleTab}
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
            {registryList.length ? <label className="w-registry-list">
              <strong>--registry=</strong>
              <select className="form-control" value={registry} onChange={this.onRegistry} style={selectStyle}>
                <option value="">None</option>
                {
                  registryList.map(function(url) {
                    return (
                      <option value={url}>{url}</option>
                    );
                  })
                }
                {hasInstaller ? <option value="+Add">+Add</option> : null}
              </select>
            </label> : (hasInstaller ? <label className="w-registry-list">
              <strong>--registry=</strong>
              <select className="form-control" value={registry} onChange={this.onRegistry} style={selectStyle}>
                <option value="">None</option>
                <option value="+Add">+Add</option>
              </select>
            </label> : null)}
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Close
            </button>
            {showCopyBtn ? (
              <button
              type="button"
                data-dismiss="modal"
                className="btn btn-info w-copy-text-with-tips"
                data-clipboard-text={cmdMsg}
                disabled={disabledBtn}
              >
                Copy Command
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-primary w-copy-text-with-tips"
              data-dismiss="modal"
              data-clipboard-text={hasInstaller ? undefined : cmdMsg}
              onClick={hasInstaller ? self.execCmd : null}
              disabled={disabledBtn}
            >
              {hasInstaller ? (install ? 'Install' : 'Update') : 'Copy'}
            </button>
          </div>
        </Dialog>
        <PluginsMgr ref="pluginsMgrDialog" />
      </div>
    );
  }
});

function getPluginInfo(plugin) {
  if (!plugin) {
    return '';
  }
  var copyText = [];
  copyText.push('Name: ' + plugin.moduleName);
  copyText.push('Version: ' + plugin.version);
  if (plugin.homepage) {
    copyText.push('Homepage: ' + plugin.homepage);
  }
  return copyText.join('\n');
}

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
  shouldComponentUpdate: function (nextProps) {
    return !this.props.hide || !nextProps.hide;
  },
  componentDidUpdate: function (prevProps) {
    if (prevProps.hide && !this.props.hide) {
      this._resizeHandler();
    }
  },
  onClose: function (e) {
    this.props.onClose && this.props.onClose(e);
    e.stopPropagation();
  },
  onContextMenu: function(e) {
    e.preventDefault();
    var target = $(e.target);
    var row = target.closest('.w-plugins-item');
    var active;
    if (!row.length) {
      active = target.parent().hasClass('active');
      row = target.closest('.w-plugins-tab');
    }
    var name = row.attr('data-name') || '';
    var props = this.props;
    var plugin = props.plugins[name + ':'];
    var disabledPlugins = props.disabledPlugins || {};
    var disabled = !plugin;
    this._curPlugin = plugin;
    var copyText;
    if (plugin) {
      copyText = getPluginInfo(plugin);
    } else if (name === 'Plugins') {
      copyText = getPluginList(props.plugins).map(getPluginInfo).join('\n\n');
    }
    CTX_MENU_LIST[0].disabled = !copyText;
    CTX_MENU_LIST[0].copyText = copyText;
    CTX_MENU_LIST[1].name = name && disabledPlugins[name] ? 'Enable' : 'Disable';
    CTX_MENU_LIST[1].disabled = disabled || props.ndp;
    CTX_MENU_LIST[2].disabled = disabled || plugin.noOpt || active;
    CTX_MENU_LIST[3].disabled = disabled || !hasRules(plugin);
    CTX_MENU_LIST[4].disabled = disabled || plugin.isProj;
    CTX_MENU_LIST[5].disabled = disabled || plugin.isProj || plugin.notUn;
    CTX_MENU_LIST[7].disabled = plugin && !plugin.homepage;
    var pluginItem = CTX_MENU_LIST[6];
    util.addPluginMenus(
      pluginItem,
      dataCenter.getPluginsMenus(),
      6,
      disabled,
      null,
      plugin && util.getSimplePluginName(plugin)
    );
    var data = util.getMenuPosition(e, 110, 250 - (pluginItem.hide ? 0 : 30));
    data.list = CTX_MENU_LIST;
    this.refs.contextMenu.show(data);
  },
  onClickContextMenu: function(action, _, parentAction, name) {
    var plugin = this._curPlugin;
    var props = this.props;
    switch (parentAction || action) {
    case 'Option':
      return events.trigger('openPluginOption', plugin);
    case 'Rules':
      return events.trigger('showPluginRules', plugin);
    case 'Disable':
      return events.trigger('disablePlugin', [plugin, true]);
    case 'Enable':
      return events.trigger('disablePlugin', [plugin, false]);
    case 'Update':
      return events.trigger('showInstallPlugin', plugin);
    case 'Uninstall':
      return events.trigger('showUninstallPlugin', plugin);
    case 'Help':
      var homepage = plugin && plugin.homepage;
      return window.open(homepage || 'https://wproxy.org/whistle/plugins.html');
    case 'Plugins':
      iframes.fork(action, {
        port: dataCenter.getPort(),
        type: 'plugins',
        name: name,
        plugin: plugin,
        plugins: getPluginList(props.plugins),
        pluginsRoot: dataCenter.pluginsRoot,
        getRegistryList: this.getRegistryList
      });
      return;
    }
  },
  render: function () {
    var self = this;
    var props = self.props;
    var tabs = props.tabs || [];
    var activeName = 'Home';
    var disabled = props.disabledAllPlugins;
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
        onContextMenu={self.onContextMenu}
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
            <a draggable="false" data-name="Plugins" className="w-plugins-tab">
              <span className="glyphicon glyphicon-list-alt" />
              Plugins
            </a>
          </li>
          {tabs.map(function (tab) {
            var disd = util.pluginIsDisabled(props, tab.name);
            return (
              <li className={activeName == tab.name ? ' active' : ''}>
                <a
                  data-name={tab.name}
                  title={tab.name}
                  onClick={self.props.onActive}
                  draggable="false"
                  className={'w-plugins-tab' + (disd ? ' w-plugin-tab-disabled' : '')}
                >
                  {disd ? (
                    <span data-name={tab.name} className="glyphicon glyphicon-ban-circle" />
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
        <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
      </div>
    );
  }
});

module.exports = Tabs;
