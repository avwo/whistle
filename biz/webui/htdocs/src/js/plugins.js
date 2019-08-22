require('../css/plugins.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var events = require('./events');
var Dialog = require('./dialog');
var SyncDialog = require('./sync-dialog');
var util = require('./util');

function getPluginComparator(plugins) {
  return function(a, b) {
    var p1 = plugins[a];
    var p2 = plugins[b];
    if (p1.priority || p2.priority) {
      return p1.priority > p2.priority ? -1 : 1;
    }
    return (p1.mtime > p2.mtime) ? 1 : -1;
  };
}

var Home = React.createClass({
  componentDidMount: function() {
    var self = this;
    self.setUpdateAllBtnState();
    events.on('updateAllPlugins', function() {
      var data = self.props.data || {};
      var plugins = data.plugins || {};
      var newPlugins = {};
      Object.keys(plugins).sort(getPluginComparator(plugins))
      .map(function(name) {
        var plugin = plugins[name];
        if (!util.compareVersion(plugin.latest, plugin.version)) {
          return;
        }
        var registry = plugin.registry ? ' --registry=' + plugin.registry : '';
        var list = newPlugins[registry] || [];
        list.push(plugin.moduleName);
        newPlugins[registry] = list;
      });
      var cmdMsg = Object.keys(newPlugins).map(function(registry) {
        var list = newPlugins[registry].join(' ');
        return 'w2 install ' + list + registry;
      }).join('\n\n');
      cmdMsg && self.setState({
        cmdMsg: cmdMsg,
        uninstall: false
      }, self.showMsgDialog);
    });
  },
  componentDidUpdate: function() {
    this.setUpdateAllBtnState();
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onOpen: function(e) {
    this.props.onOpen && this.props.onOpen(e);
    e.preventDefault();
  },
  syncData: function(plugin) {
    var data = this.props.data || '';
    this.refs.syncDialog.show(plugin, data.rules, data.values);
  },
  showDialog: function() {
    this.refs.pluginRulesDialog.show();
  },
  hideDialog: function() {
    this.refs.pluginRulesDialog.hide();
  },
  showRules: function(e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    plugin.name = name;
    this.setState({
      plugin: plugin
    }, this.showDialog);
  },
  showMsgDialog: function() {
    this.refs.operatePluginDialog.show();
  },
  showUpdate: function(e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    var registry = plugin.registry ? ' --registry=' + plugin.registry : '';
    this.setState({
      cmdMsg: 'w2 install ' + plugin.moduleName + registry,
      isSys: plugin.isSys,
      uninstall: false
    }, this.showMsgDialog);
  },
  showUninstall: function(e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    var sudo = this.props.data.isWin ? '' : 'sudo ';
    var isSys = plugin.isSys;
    var cmdMsg = isSys ? 'w2 uninstall ' : sudo + 'npm uninstall -g ';
    var registry = !isSys && plugin.registry ? ' --registry=' + plugin.registry : '';
    this.setState({
      cmdMsg: cmdMsg + plugin.moduleName + registry,
      isSys: isSys,
      uninstall: true,
      pluginPath: plugin.path
    }, this.showMsgDialog);
  },
  enableAllPlugins: function(e) {
    var data = this.props.data || {};
    if ((!data.disabledAllRules && !data.disabledAllPlugins)
        || !confirm('Do you want to enable all plugins?')) {
      return;
    }
    events.trigger('disableAllPlugins', e);
  },
  setUpdateAllBtnState: function() {
    events.trigger('setUpdateAllBtnState', this.hasNewPlugin);
  },
  render: function() {
    var self = this;
    var data = self.props.data || {};
    var plugins = data.plugins || [];
    var state = self.state || {};
    var plugin = state.plugin || {};
    var cmdMsg = state.cmdMsg;
    var list = Object.keys(plugins);
    var disabledPlugins = data.disabledPlugins || {};
    var disabled = data.disabledAllRules || data.disabledAllPlugins;
    self.hasNewPlugin = false;

    return (
        <div className="fill orient-vertical-box w-plugins" style={{display: self.props.hide ? 'none' : ''}}>
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
                {list.length ? list.sort(getPluginComparator(plugins))
                .map(function(name, i) {
                  var plugin = plugins[name];
                  name = name.slice(0, -1);
                  var checked = !disabledPlugins[name];
                  var url = plugin.pluginHomepage || 'plugin.' + name + '/';
                  var hasNew = util.compareVersion(plugin.latest, plugin.version);
                  if (hasNew) {
                    hasNew = '(New: ' + plugin.latest + ')';
                    self.hasNewPlugin = true;
                  }
                  return (
                    <tr key={name} className={((!disabled && checked) ? '' : 'w-plugins-disable') + (hasNew ? ' w-has-new-version' : '')}>
                      <th className="w-plugins-order" onDoubleClick={self.enableAllPlugins}>{i + 1}</th>
                      <td className="w-plugins-active" onDoubleClick={self.enableAllPlugins}>
                        <input type="checkbox" title={disabled ? 'Disabled' : (checked ? 'Disable ' : 'Enable ') + name}
                          data-name={name} checked={checked} disabled={disabled} onChange={self.props.onChange} />
                      </td>
                      <td className="w-plugins-date">{new Date(plugin.mtime).toLocaleString()}</td>
                      <td className="w-plugins-name" title={plugin.moduleName}><a href={url} target="_blank" data-name={name} onClick={plugin.pluginHomepage ? null : self.onOpen}>{name}</a></td>
                      <td className="w-plugins-version">
                        {plugin.homepage ? <a href={plugin.homepage} target="_blank">{plugin.version}</a> : plugin.version}
                        {hasNew ? (plugin.homepage ? <a className="w-new-version" href={plugin.homepage} target="_blank">{hasNew}</a>
                        : <span className="w-new-version">{hasNew}</span>) : undefined}
                      </td>
                      <td className="w-plugins-operation">
                        <a href={url} target="_blank" data-name={name} onClick={plugin.pluginHomepage ? null : self.onOpen}>Option</a>
                        {(plugin.rules || plugin._rules || plugin.resRules) ? <a href="javascript:;" draggable="false" data-name={name} onClick={self.showRules}>Rules</a> : <span className="disabled">Rules</span>}
                        <a href="javascript:;" draggable="false" className="w-plugin-btn w-plugin-update-btn"
                          data-name={name} onClick={self.showUpdate}>Update</a>
                        <a href="javascript:;" draggable="false" className="w-plugin-btn"
                          data-name={name} onClick={self.showUninstall}>Uninstall</a>
                        {(util.isString(plugin.rulesUrl) || util.isString(plugin.valuesUrl)) ? <a href="javascript:;" className="w-plugin-btn"
                          onClick={function() {
                            self.syncData(plugin);
                          }}>Sync</a> : undefined}
                        {plugin.homepage ? <a href={plugin.homepage} className="w-plugin-btn"
                          target="_blank">Help</a> : <span className="disabled">Help</span>}
                      </td>
                      <td className="w-plugins-desc" title={plugin.description}>{plugin.description}</td>
                    </tr>
                  );
                }) : <tr><td colSpan="7" className="w-empty"><a href="https://github.com/whistle-plugins" target="_blank">No Data</a></td></tr>}
              </tbody>
            </table>
          </div>
          <SyncDialog ref="syncDialog" />
          <Dialog ref="pluginRulesDialog" wstyle="w-plugin-rules-dialog">
            <div className="modal-header">
            <h4>{plugin.name}</h4>
            <button type="button" className="close" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="w-plugin-rules">
                {plugin.rules ? (<fieldset>
                  <legend>rules.txt</legend>
                  <pre>{plugin.rules}</pre>
                </fieldset>) : null}
                {plugin._rules ? (<fieldset>
                  <legend>reqRules.txt (_rules.txt)</legend>
                  <pre>{plugin._rules}</pre>
                </fieldset>) : null}
                {plugin.resRules ? (<fieldset>
                  <legend>resRules.txt</legend>
                  <pre>{plugin.resRules}</pre>
                </fieldset>) : null}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </Dialog>
          <Dialog ref="operatePluginDialog" wstyle="w-plugin-update-dialog">
            <div className="modal-body">
              <h5>
                <a
                  href="javascript:;"
                  data-dismiss="modal"
                  className="w-copy-text-with-tips"
                  data-clipboard-text={cmdMsg}
                >
                  Copy the following command
                </a> to the CLI to execute:
              </h5>
              <pre className="w-plugin-update-cmd">
                  {cmdMsg}
              </pre>
              <div style={{
                margin: '8px 0 0',
                color: 'red',
                'word-break': 'break-all',
                display: !state.isSys && state.uninstall ? '' : 'none'
              }}>
                If uninstall failed, delete the following directory instead:
                <a
                  className="w-copy-text-with-tips"
                  data-dismiss="modal"
                  data-clipboard-text={state.pluginPath}
                  style={{ marginLeft: 5, cursor: 'pointer' }}>{state.pluginPath}</a>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" data-dismiss="modal" className="btn btn-primary w-copy-text-with-tips" data-clipboard-text={cmdMsg}>Copy</button>
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </Dialog>
        </div>
    );
  }
});

var Tabs = React.createClass({
  componentDidMount: function() {
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
      var height =  wrapper.offsetHeight;
      if (height) {
        tabPanel.style.width = wrapper.offsetWidth + 'px';
        tabPanel.style.height = height + 'px';
      }
    }
    self._resizeHandler = resizeHandler;
    resizeHandler();
    $(window).on('resize', resizeHandler);
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return !this.props.hide || !nextProps.hide;
  },
  componentDidUpdate: function(prevProps, prevState) {
    if (prevProps.hide && !this.props.hide) {
      this._resizeHandler();
    }
  },
  onClose: function(e) {
    this.props.onClose && this.props.onClose(e);
    e.stopPropagation();
  },
  render: function() {
    var self = this;
    var tabs = self.props.tabs || [];
    var activeName = 'Home';
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
      <div className="w-nav-tabs fill orient-vertical-box" style={{display: self.props.hide ? 'none' : ''}}>
         <ul className="nav nav-tabs">
            <li className={'w-nav-home-tab' + (activeName == 'Home' ? ' active' : '')} data-name="Home"  onClick={self.props.onActive}><a href="javascript:;" draggable="false">Home</a></li>
            {tabs.map(function(tab) {
              return <li className={activeName == tab.name ? ' active' : ''}>
                  <a data-name={tab.name}  onClick={self.props.onActive} href="javascript:;" draggable="false">
                    {tab.name}
                    <span data-name={tab.name} title="Close" onClick={self.onClose}>&times;</span>
                  </a>
                  </li>;
            })}
          </ul>
          <div className="fill orient-vertical-box w-nav-tab-panel">
            <div ref="tabPanel" className="fill orient-vertical-box">
              <Home data={self.props} hide={activeName != 'Home'} onChange={self.props.onChange} onOpen={self.props.onOpen} />
              {tabs.map(function(tab) {
                return <iframe style={{display: activeName == tab.name ? '' : 'none'}} src={tab.url} />;
              })}
            </div>
          </div>
      </div>
    );
  }
});

module.exports = Tabs;
