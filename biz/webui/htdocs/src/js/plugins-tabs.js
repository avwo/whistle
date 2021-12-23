var React = require('react');
var getBridge = require('./bridge');
var events = require('./events');
var util = require('./util');
var modal = require('./network-modal');


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
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    var tabs = this.props.tabs;
    var hide =  this.props.hide;
    return (
        <div className={'fill box w-plugins-tabs' + (hide ? ' hide' : '')}>
          <div className={'w-plugins-tabs-list' + (tabs.length < 2 ? ' hide' : '')}>
            {
              tabs.map(function(tab) {
                return <button className="btn btn-default" title={'[' + tab.plugin + '] ' + tab.name}>{tab.name}</button>;
              })
            }
          </div>
          <div className="fill w-plugins-tabs-panel">

          </div>
        </div>
    );
  }
});


module.exports = PluginsTabs;
