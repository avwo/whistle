var React = require('react');
var $ = require('jquery');
var Composer = require('./composer');
var util = require('./util');
var LazyInit = require('./lazy-init');
var dataCenter = require('./data-center');
var events = require('./events');
var TabMgr = require('./tab-mgr');
var storage = require('./storage');

var ComposerList = React.createClass({
  getInitialState: function () {
    return { activeName: storage.get('activeComposerTab') || ' ' };
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  componentDidMount: function () {
    var self = this;
    events.on('comTabsChange', function () {
      self.setState({});
    });
    events.on('showMaskIframe', function () {
      self.showMask();
    });
    events.on('hideMaskIframe', function () {
      self.hideMask();
    });
  },
  showTab: function (name) {
    if (this.state.activeName !== name) {
      storage.set('activeComposerTab', name);
      this.setState({ activeName: name });
    }
  },
  hideMask: function () {
    $('.w-mask-iframe').hide();
  },
  showMask: function () {
    $('.w-mask-iframe').show();
  },
  render: function () {
    var self = this;
    var hide = self.props.hide;
    var modal = self.props.modal;
    var tabs = dataCenter.getComTabs();
    var active = self.state.activeName;
    var activeDefalut = active === ' ';
    var hasActive = activeDefalut;
    var elem = tabs.map(function (tab) {
      var pluginName = tab.plugin;
      var activeTab;
      if (active == tab.plugin) {
        activeTab = true;
        hasActive = true;
      }
      return (
        <button
          key={pluginName}
          onClick={function () {
            self.showTab(pluginName);
          }}
          className={'btn btn-default' + (activeTab ? ' active' : '')}
          title={pluginName}
        >
          {tab.name}
        </button>
      );
    });
    if (!hasActive) {
      activeDefalut = true;
      active = self.state.activeName = ' ';
    }
    return (
      <div
        className={
          'fill orient-vertical-box w-composer-list' + (hide ? ' hide' : '')
        }
      >
        {tabs.length ? (
          <div className="box w-composer-tab-list">
            <button
              type="button"
              onClick={function () {
                self.showTab(' ');
              }}
              className={'btn btn-default' + (activeDefalut ? ' active' : '')}
            >
              <span className="glyphicon glyphicon-edit"></span>Default
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
        <div
          className="w-mask-iframe"
          onClick={this.hideMask}
          onMouseEnter={this.hideMask}
        />
      </div>
    );
  }
});

module.exports = ComposerList;
