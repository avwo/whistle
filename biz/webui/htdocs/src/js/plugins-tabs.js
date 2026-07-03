var React = require('react');
var util = require('./util');
var TabMgr = require('./tab-mgr');

var getHide = util.getHide;

var PluginsTabs = React.createClass({
  getInitialState: function () {
    var tab = this.props.tabs[0];
    return {
      active: tab && tab.plugin
    };
  },
  shouldComponentUpdate: util.scu,
  onSelect: function (tab) {
    this.setState({ active: tab.plugin });
  },
  render: function () {
    var self = this;
    var props = self.props;
    var state = self.state;
    var tabs = props.tabs;
    var hide = props.hide;
    var active = state.active;
    var single = tabs.length < 2;
    if (single) {
      active = tabs[0] && tabs[0].plugin;
      if (active) {
        state.active = active;
      }
    }
    return (
      <div className={'fill box w-plugins-tabs' + getHide(hide)}>
        <div className={'w-plugins-tabs-list' + getHide(single)}>
          {tabs.map(function (tab) {
            var plugin = tab.plugin;
            var name = tab.name;
            return (
              <button
                key={plugin}
                onClick={function () {
                  self.onSelect(tab);
                }}
                className={'btn btn-default' + (active == plugin ? ' active' : '')}
                title={'[' + plugin + '] ' + name}
              >
                {name}
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
