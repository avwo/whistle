require('../css/plugins.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var Dialog = require('./dialog');

var Home = React.createClass({
  onOpen: function(e) {
    this.props.onOpen && this.props.onOpen(e);
    e.preventDefault();
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
  showUpdateDialog: function() {
    this.refs.updatePluginDialog.show();
  },
  showUpdate: function(e) {
    var name = $(e.target).attr('data-name');
    var plugin = this.props.data.plugins[name + ':'];
    var registry = plugin.registry ? ' --registry=' + plugin.registry : '';
    var sudo = this.props.data.isWin ? '' : 'sudo ';
    this.setState({
      updateCmd: sudo + 'npm i -g ' + plugin.moduleName + registry
    }, this.showUpdateDialog);
  },
  render: function() {
    var self = this;
    var data = self.props.data || {};
    var plugins = data.plugins || [];
    var state = self.state || {};
    var plugin = state.plugin || {};
    var updateCmd = state.updateCmd;
    var list = Object.keys(plugins);
    var disabledPlugins = data.disabledPlugins || {};
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
                {list.length ? list.sort(function(a, b) {
                  var p1 = plugins[a];
                  var p2 = plugins[b];
                  if (p1.priority || p2.priority) {
                    return p1.priority > p2.priority ? -1 : 1;
                  }
                  return (p1.mtime > p2.mtime) ? 1 : -1;
                }).map(function(name, i) {
                  var plugin = plugins[name];
                  name = name.slice(0, -1);
                  var checked = !disabledPlugins[name];
                  var disabled = data.disabledAllRules || data.disabledAllPlugins;
                  var url = 'plugin.' + name + '/';
                  return (
                    <tr key={name} className={(!disabled && checked) ? '' : 'w-plugins-disable'}>
                      <th className="w-plugins-order">{i + 1}</th>
                      <td className="w-plugins-active">
                        <input type="checkbox"  title={disabled ? 'Disabled' : (checked ? 'Disable ' : 'Enable ') + name}
                          data-name={name} checked={checked} disabled={disabled} onChange={self.props.onChange} />
                      </td>
                      <td className="w-plugins-date">{new Date(plugin.mtime).toLocaleString()}</td>
                      <td className="w-plugins-name" title={plugin.moduleName}><a href={url} target="_blank" data-name={name} onClick={self.onOpen}>{name}</a></td>
                      <td className="w-plugins-version">{plugin.homepage ? <a href={plugin.homepage} target="_blank">{plugin.version}</a> : plugin.version}</td>
                      <td className="w-plugins-operation">
                        <a href={url} target="_blank" data-name={name} onClick={self.onOpen}>Option</a>
                        {(plugin.rules || plugin._rules) ? <a href="javascript:;" draggable="false" data-name={name} onClick={self.showRules}>Rules</a> : <span className="disabled">Rules</span>}
                        <a href="javascript:;" draggable="false" className="w-plugin-btn"
                          data-name={name} onClick={self.showUpdate}>Update</a>
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
                  <legend>_rules.txt</legend>
                  <pre>{plugin._rules}</pre>
                </fieldset>) : null}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </Dialog>
          <Dialog ref="updatePluginDialog" wstyle="w-plugin-update-dialog">
            <div className="modal-body">
              <h5>
                <a
                  href="javascript:;"
                  className="w-copy-text-with-tips"
                  data-clipboard-text={updateCmd}
                >
                  Copy the following command
                </a> to the CLI to execute:
              </h5>
              <div className="w-plugin-update-cmd">
                  {updateCmd}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary w-copy-text-with-tips" data-clipboard-text={updateCmd}>Copy</button>
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
