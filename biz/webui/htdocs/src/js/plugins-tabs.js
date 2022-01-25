var React = require('react');
var util = require('./util');
var TabMgr = require('./tab-mgr');

var PluginsTabs = React.createClass({
  getInitialState: function () {
    var tab = this.props.tabs[0];
    return {
      active: tab && tab.plugin
    };
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onSelect: function (tab) {
    this.setState({ active: tab.plugin });
  },
  render: function () {
    var self = this;
    var props = self.props;
    var tabs = props.tabs;
    var hide = props.hide;
    var active = this.state.active;
    var single = tabs.length < 2;
    if (single) {
      active = tabs[0] && tabs[0].plugin;
      if (active) {
        this.state.active = active;
      }
    }
    return (
      <div className={'fill box w-plugins-tabs' + (hide ? ' hide' : '')}>
        <div className={'w-plugins-tabs-list' + (single ? ' hide' : '')}>
          {tabs.map(function (tab) {
            return (
              <button
                key={tab.plugin}
                onClick={function () {
                  self.onSelect(tab);
                }}
                className={
                  'btn btn-default' + (active == tab.plugin ? ' active' : '')
                }
                title={'[' + tab.plugin + '] ' + tab.name}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
        <TabMgr active={active} hide={hide} tabs={tabs} />
      </div>
    );
  }
});

module.exports = PluginsTabs;
