var React = require('react');
var util = require('./util');
var TabFrame = require('./tab-frame');

var MAX_IFRAME_COUNT = 6;

var TabMgr = React.createClass({
  getInitialState: function () {
    this.initedTabs = {};
    return {};
  },
  shouldComponentUpdate: util.scu,
  componentDidMount: function () {
    var self = this;
    util.on('setComposer', function () {
      var props = self.props;
      var modal = !props.hide && props.modal;
      if (modal) {
        var elem = self.refs[props.active];
        elem && elem.compose(modal);
      }
    });
  },
  isInited: function (tab) {
    var self = this;
    var cache = self.initedTabs;
    var action = tab.action;
    var exists = cache[action] != null;
    if (self.props.active !== tab.plugin) {
      return exists;
    }
    if (exists) {
      cache[action] = Date.now();
      return true;
    }
    var keys = util.toKeys(cache);
    if (keys.length >= MAX_IFRAME_COUNT) {
      var minTime;
      var destroyKey;
      keys.forEach(function (key) {
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
    self.initedTabs[action] = Date.now();
    return true;
  },
  render: function () {
    var self = this;
    var props = self.props;
    var hide = props.hide;
    var active = props.active;
    var hideAll = true;
    return (
      <div
        className={
          'fill v-box ' +
          (props.className || '') +
          util.getHide(hideAll)
        }
      >
        {props.tabs.map(function (tab) {
          var plugin = tab.plugin;
          var hideTab = hide || active !== plugin;
          if (!hideTab) {
            hideAll = false;
          }
          return (
            self.isInited(tab) && (
              <TabFrame
                ref={plugin}
                key={plugin}
                src={tab.action}
                hide={hideTab}
              />
            )
          );
        })}
      </div>
    );
  }
});

module.exports = TabMgr;
