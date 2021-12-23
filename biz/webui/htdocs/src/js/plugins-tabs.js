var React = require('react');
var getBridge = require('./bridge');
var events = require('./events');
var util = require('./util');
var modal = require('./network-modal');
var TabFrame = require('./tab-frame');

var MAX_IFRAME_COUNT = 6;


window.initCustomTabWhistleBridge = function(win) {
  var bridge = getBridge();
  var listeners = [];
  events.on('selectedSessionChange', function(_, item) {
    listeners.forEach(function(l) {
      l(item, modal.getSelectedList());
    });
  });
  bridge.getActiveSession = function() {
    return modal.getActive();
  };
  bridge.getSelectedSessionList = function() {
    return modal.getSelectedList();
  };
  bridge.addActiveSessionListener = bridge.onActiveSessionListener = function(l) {
    if (typeof l === 'function') {
      if (listeners.indexOf(l) === -1) {
        listeners.push(l);
      }
      l(modal.getActive(), modal.getSelectedList());
    }
  };
  bridge.removeActiveSessionListener = function(l) {
    var index = listeners.indexOf(l);
    index !== -1 && listeners.splice(index, 1);
  };
  bridge.removeActiveSessionListeners = function(l) {
    listeners = [];
  };
};

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
      keys.forEach(function(key) {
        var info = cache[key];
        if (!destoyInfo || destoyInfo.time > info.time) {
          destoyInfo = info;
        }
      });
      if (destoyInfo) {
        // TODO: 销毁 iframe 及关联的内存
        console.log(destoyInfo);
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
