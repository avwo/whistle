var React = require('react');
var Card = require('./card');
var util = require('./util');
var $ = require('jquery');
var win = require('./win');
var storage = require('./storage');
var LazyInit = require('./lazy-init');

var MAX_TABS = 7;
var HIDE_STYLE = { display: 'none' };

function getWidgetId(widget) {
  return widget.name;
}

var Account = React.createClass({
  getInitialState: function() {
    var curMap = {};
    var activeName = storage.get('activeAccountTabName') || 'Widgets';
    var tabs = [];
    this.props.cards.forEach(function(card) {
      curMap[card.name] = card;
    });
    if (!curMap[activeName]) {
      activeName = 'Widgets';
    }
    try {
      var list = JSON.parse(storage.get('activeAccountTabList'));
      list.forEach(function(name) {
        var card = curMap[name];
        if (card && tabs.indexOf(card) === -1) {
          tabs.push(card);
        }
      });
    } catch (e) {}
    return { tabs: tabs, activeName: activeName };
  },
  onEdit: function(card) {

  },
  saveTabs: function() {
    var state = this.state;
    storage.set('activeAccountTabList', JSON.stringify(state.tabs.map(getWidgetId)));
    storage.set('activeAccountTabName', state.activeName);
  },
  onOpen: function(card) {
    var tabs = this.state.tabs;
    if (tabs.indexOf(card) === -1) {
      if (tabs.length >= MAX_TABS) {
        win.alert('At most ' + MAX_TABS + ' tabs can be opened at the same time.');
        return;
      }
      tabs.push(card);
    }
    this.setState({ activeName: card.name }, this.saveTabs);
  },
  onClose: function(tab) {
    var tabs = this.state.tabs;
    var index = tabs.indexOf(tab);
    if (index !== -1) {
      var activeName = this.state.activeName;
      if (activeName === tab.name) {
        activeName = 'Widgets';
      }
      tabs.splice(index, 1);
      this.setState({ activeName: activeName }, this.saveTabs);
    }
  },
  onActive: function(e) {
    var activeName = $(e.target).closest('li').attr('data-name');
    if (activeName == this.state.activeName) {
      return;
    }
    this.setState({ activeName: activeName });
    storage.set('activeAccountTabName', activeName);
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    var self = this;
    var cards = self.props.cards;
    var tabs = self.state.tabs;
    var activeName = self.state.activeName;
    return (cards ? 
      <div className={'fill w-nav-tabs orient-vertical-box w-account' + (util.getBoolean(self.props.hide) ? ' hide' : '')}>
        <ul className="nav nav-tabs w-account-tabs">
          <li
            className={'w-nav-home-tab' + (!activeName || activeName === 'Widgets' ? ' active' : '')}
            data-name="Widgets"
            onClick={self.onActive}
          >
            <a draggable="false">
              <span className="glyphicon glyphicon-user" />
              Widgets
            </a>
          </li>
          {tabs.map(function (tab) {
            return (
              <li data-name={tab.name} className={activeName == tab.name ? ' active' : ''}>
                <a
                  title={tab.name}
                  onClick={self.onActive}
                  draggable="false"
                >
                  {tab.img ? <img src={tab.img} /> : (tab.icon || null)}
                  {tab.name}
                  <span
                    title="Close"
                    className="w-close-icon"
                    onClick={function(e) {
                      self.onClose(tab);
                      e.stopPropagation();
                    }}
                  >
                    &times;
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <div className="fill w-account-ctn">
          <div className={'w-account-home' + (!activeName || activeName === 'Widgets' ? '' : ' hide')}>
            {cards.map(function(card) {
              return <Card onOpen={self.onOpen} data={card} onEdit={card.editable === false ? null : self.onEdit} />;
            })}
          </div>
          {tabs.map(function (tab) {
            return (
              <LazyInit inited={activeName == tab.name}>
                <iframe
                  style={activeName == tab.name ? null : HIDE_STYLE}
                  src={tab.url}
                />
              </LazyInit>
            );
          })}
        </div>
      </div> : null
    );
  }
});

module.exports = Account;
