var React = require('react');
var Composer = require('./composer');
var util = require('./util');
var LazyInit = require('./lazy-init');
var dataCenter = require('./data-center');
var events = require('./events');
var TabMgr = require('./tab-mgr');
var storage = require('./storage');
var Icon = require('./icon');

var DEFAULT_TAB = ' ';

var ComposerList = React.createClass({
  getInitialState: function () {
    return { activeName: storage.get('activeComposerTab') || DEFAULT_TAB };
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
  componentDidMount: function () {
    var self = this;
    events.on('comTabsChange', function () {
      self.setState({});
    });
    events.on('_setComposerData', function() {
      self.showTab(DEFAULT_TAB);
    });
  },
  showTab: function (name) {
    if (this.state.activeName !== name) {
      storage.set('activeComposerTab', name);
      this.setState({ activeName: name });
    }
  },
  render: function () {
    var self = this;
    var hide = self.props.hide;
    var modal = self.props.modal;
    var tabs = dataCenter.getComTabs();
    var active = self.state.activeName;
    var activeDefalut = active === DEFAULT_TAB;
    var hasActive = activeDefalut;
    var elem = tabs.map(function (tab) {
      var pluginName = tab.plugin;
      var activeTab;
      if (active == tab.plugin) {
        activeTab = true;
        hasActive = true;
      }
      var icon = util.getTabIcon(tab);
      return (
        <button
          key={pluginName}
          onClick={function () {
            self.showTab(pluginName);
          }}
          className={'w-custom-tab-btn btn btn-default' + (activeTab ? ' active' : '')}
          title={pluginName}
        >
          {icon ? <img className="w-tab-icon" src={icon} /> : null}
          {tab.name}
        </button>
      );
    });
    if (!hasActive) {
      activeDefalut = true;
      active = self.state.activeName = DEFAULT_TAB;
    }
    return (
      <div
        className={
          'fill v-box w-com-list' + (hide ? ' hide' : '')
        }
      >
        {tabs.length ? (
          <div className="box w-com-tab-list">
            <button
              type="button"
              onClick={function () {
                self.showTab(DEFAULT_TAB);
              }}
              className={'btn btn-default' + (activeDefalut ? ' active' : '')}
            >
              <Icon name="send" />Default
            </button>
            <div className="fill w-custom-tabs">{elem}</div>
          </div>
        ) : null}
        <LazyInit inited={!hide}>
          <Composer
            modal={modal}
            disabled={!activeDefalut}
            hide={hide || !activeDefalut}
          />
        </LazyInit>
        <TabMgr
          modal={modal}
          active={active}
          hide={hide}
          tabs={tabs}
          className="w-custom-tab-panel"
        />
      </div>
    );
  }
});

module.exports = ComposerList;
