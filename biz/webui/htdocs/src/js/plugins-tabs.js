var React = require('react');
var events = require('./events');
var util = require('./util');
var TabFrame = require('./tab-frame');

var MAX_IFRAME_COUNT = 6;

var PluginsTabs = React.createClass({
  getInitialState: function() {
    var tab = this.props.tabs[0];
    this.initedTabs = {};
    return {
      active: tab && tab.plugin
    };
  },
  componentDidMount: function() {
    var self = this;
    events.on('updatePluginTabs', function() {
      self.setState({});
    });
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onSelect: function(tab) {
    this.setState({ active: tab.plugin });
  },
  isInited: function(tab) {
    var cache = this.initedTabs;
    var curInfo = cache[tab.action];
    if (this.state.active !== tab.plugin) {
      return curInfo;
    }
    if (curInfo) {
      curInfo.time = Date.now();
      return true;
    }
    var keys = Object.keys(cache);
    if (keys.length >= MAX_IFRAME_COUNT) {
      var destoyInfo;
      var destroyKey;
      keys.forEach(function(key) {
        var info = cache[key];
        if (!destoyInfo || destoyInfo.time > info.time) {
          destoyInfo = info;
          destroyKey = key;
        }
      });
      if (destroyKey) {
        delete cache[destroyKey];
      }
    }
    this.initedTabs[tab.action] = { time: Date.now() };
    return true;
  },
  render: function() {
    var self = this;
    var props = self.props;
    var tabs = props.tabs;
    var hide =  props.hide;
    var active = this.state.active;
    var single = tabs.length < 2;
    if (single ) {
      active = tabs[0] && tabs[0].plugin;
      if (active) {
        this.state.active = active;
      }
    }
    return (
        <div className={'fill box w-plugins-tabs' + (hide ? ' hide' : '')}>
          <div className={'w-plugins-tabs-list' + (single ? ' hide' : '')}>
            {
              tabs.map(function(tab) {
                return (
                        <button
                          key={tab.plugin}
                          onClick={function() {
                            self.onSelect(tab);
                          }}
                          className={'btn btn-default' + (active == tab.plugin ? ' active' : '')}
                          title={'[' + tab.plugin + '] ' + tab.name}
                        >{tab.name}</button>
                      );
              })
            }
          </div>
          <div className="fill orient-vertical-box w-plugins-tabs-panel">
          {
              tabs.map(function(tab) {
                return self.isInited(tab) && <TabFrame key={tab.plugin} src={tab.action} hide={single ? hide : active !== tab.plugin} />;
              })
            }
          </div>
        </div>
    );
  }
});


module.exports = PluginsTabs;
