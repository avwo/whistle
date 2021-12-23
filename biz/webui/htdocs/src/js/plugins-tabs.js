var React = require('react');
var getBridge = require('./bridge');
var events = require('./events');
var util = require('./util');
var modal = require('./network-modal');
var TabFrame = require('./tab-frame');


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
    return {
      active: tab && tab.plugin
    };
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onSelect: function(tab) {
    this.setState({ active: tab.plugin });
  },
  render: function() {
    var self = this;
    var props = self.props;
    var tabs = props.tabs;
    var hide =  props.hide;
    var active = this.state.active;

    return (
        <div className={'fill box w-plugins-tabs' + (hide ? ' hide' : '')}>
          <div className={'w-plugins-tabs-list' + (tabs.length < 2 ? ' hide' : '')}>
            {
              tabs.map(function(tab) {
                return (
                        <button
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
                return <TabFrame hide={active !== tab.plugin} />;
              })
            }
          </div>
        </div>
    );
  }
});


module.exports = PluginsTabs;
