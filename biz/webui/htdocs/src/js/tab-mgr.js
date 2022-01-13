var React = require('react');
var util = require('./util');
var TabFrame = require('./tab-frame');

var MAX_IFRAME_COUNT = 6;

var TabMgr = React.createClass({
  getInitialState: function() {
    this.initedTabs = {};
    return {};
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  isInited: function(tab) {
    var cache = this.initedTabs;
    var action = tab.action;
    var exists = cache[action] != null;
    if (this.props.active !== tab.plugin) {
      return exists;
    }
    if (exists) {
      cache[action] = Date.now();
      return true;
    }
    var keys = Object.keys(cache);
    if (keys.length >= MAX_IFRAME_COUNT) {
      var minTime;
      var destroyKey;
      keys.forEach(function(key) {
        var time = cache[key];
        if (minTime == null || minTime > time) {
          minTime = time;
          destroyKey = key;
        }
      });
      if (destroyKey) {
        delete cache[destroyKey];
      }
    }
    this.initedTabs[action] = Date.now();
    return true;
  },
  render: function() {
    var self = this;
    var props = self.props;
    var tabs = props.tabs;
    var hide =  props.hide;
    var active = props.active;
    var hideAll = true;
    tabs = tabs.map(function(tab) {
      var hideTab = hide || active !== tab.plugin;
      if (!hideTab) {
        hideAll = false;
      }
      return self.isInited(tab) && <TabFrame key={tab.plugin} src={tab.action} hide={hideTab} />;
    });
    return (
      <div className={'fill orient-vertical-box' + (hideAll ? ' hide' : '')}>
        { tabs }
      </div>
    );
  }
});


module.exports = TabMgr;
