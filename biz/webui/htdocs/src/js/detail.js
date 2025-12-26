require('../css/detail.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var events = require('./events');
var BtnGroup = require('./btn-group');
var Overview = require('./overview');
var Inspectors = require('./inspectors');
var Timeline = require('./timeline');
var ComposerList = require('./composer-list');
var Tools = require('./tools');
var Saved = require('./saved');
var util = require('./util');

var ReqData = React.createClass({
  getInitialState: function () {
    return {
      tabs: [
        {
          name: 'Overview',
          icon: 'eye-open'
        },
        {
          name: 'Inspectors',
          icon: 'search'
        },
        {
          name: 'Timeline',
          icon: 'time'
        },
        {
          name: 'Composer',
          icon: 'send'
        },
        {
          name: 'Tools',
          icon: 'heart'
        },
        {
          name: 'Saved',
          icon: 'saved'
        }
      ],
      initedOverview: false,
      initedInspectors: false,
      initedFrames: false,
      initedTimeline: false,
      initedComposer: false,
      initedTools: false,
      initedSaved: false
    };
  },
  componentDidMount: function () {
    if (this.props.data) {
      return;
    }
    var self = this;
    var tabs = self.state.tabs;
    var timer;
    var update = function () {
      self.setState({});
    };
    events
      .on('showOverview', function () {
        events.trigger('overviewScrollTop');
        self.toggleTab(tabs[0]);
      })
      .on('showInspectors', function () {
        self.toggleTab(tabs[1]);
      })
      .on('showTimeline', function () {
        self.toggleTab(tabs[2]);
      })
      .on('showLog', function () {
        self.toggleTab(tabs[4]);
      })
      .on('composer', function (e, item) {
        var modal = self.props.modal;
        self.showComposer(item || (modal && modal.getActive()));
        setTimeout(function() {
          self.shakeComposerTab();
        }, 100);
      })
      .on('showComposerTab', function() {
        self.showComposer();
      })
      .on('networkStateChange', function () {
        clearTimeout(timer);
        timer = setTimeout(update, 100);
      })
      .on('toggleDetailTab', function () {
        var tab = self.state.tab;
        if (tab === tabs[0]) {
          self.toggleTab(tabs[1]);
        } else if (tab === tabs[1]) {
          self.toggleTab(tabs[2]);
        } else {
          self.toggleTab(tabs[0]);
        }
      }).on('shakeSavedTab', self.shakeSavedTab);
  },
  shakeSavedTab: function() {
    util.shakeElem($(ReactDOM.findDOMNode(this.refs.tabs)).find('button[data-name="Saved"]'));
  },
  showComposer: function (item) {
    if (item) {
      this.state.activeItem = item;
    }
    this.toggleTab(this.state.tabs[3], function () {
      item && events.trigger('setComposer');
    });
  },
  isShowingSaved: function() {
    var tab = this.state.tab;
    return tab && tab.name === 'Saved';
  },
  onDragEnter: function (e) {
    if (e.dataTransfer.types.indexOf('reqdataid') != -1) {
      !this.isShowingSaved() && this.showComposer();
      e.preventDefault();
    }
  },
  getItemById: function(id, list) {
    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      if (item && item.id === id) {
        return item;
      }
    }
  },
  onDrop: function (e) {
    var modal = this.props.modal;
    var id = e.dataTransfer.getData('reqDataId');
    var list = modal && modal.list;
    var len = list && list.length;
    if (!id || !len) {
      return;
    }
    var item = this.getItemById(id, list);
    if (this.isShowingSaved()) {
      return events.trigger('saveSessions', [item]);
    }
    item && this.showComposer(item);
  },
  onDoubleClick: function () {
    events.trigger('ensureSelectedItemVisible');
  },
  toggleTab: function (tab, callback) {
    if (tab.name === 'Inspectors' && this.state.initedInspectors) {
      var inspectors = $('.w-detail-inspectors');
      if (inspectors.length) {
        var detail = $('.w-detail');
        detail.find('>.fill').addClass('hide');
        inspectors.removeClass('hide');
        var btnGroup = detail.find('>.w-tabs-sm>button');
        btnGroup.removeClass('active');
        btnGroup.eq(1).addClass('active');
      }
    }
    this.selectTab(tab);
    this.setState({ tab: tab }, callback);
  },
  selectTab: function (tab) {
    this.state.tabs.forEach(function (tab) {
      tab.active = false;
    });
    tab.active = true;
    this.state.tab = tab;
    this.state['inited' + tab.name] = true;
  },
  shakeComposerTab: function() {
    util.shakeElem($(ReactDOM.findDOMNode(this.refs.tabs)).find('button[data-name="Composer"]'));
  },
  render: function () {
    var modal = this.props.modal;
    var state = this.state;
    var data = this.props.data;
    var tabs = state.tabs;
    var selectedList = !data && modal && modal.getSelectedList();
    var activeItem;
    var overview;
    if (selectedList && selectedList.length > 1) {
      overview = {
        req: {
          size: 0,
          unzipSize: 0,
          headers: {}
        },
        res: {
          size: 0,
          unzipSize: 0,
          headers: {}
        }
      };
      selectedList.forEach(function (item) {
        if (overview.startTime == null || overview.startTime > item.startTime) {
          overview.startTime = item.startTime;
        }
        if (overview.endTime == null || overview.endTime < item.endTime) {
          overview.endTime = item.endTime;
        }
        var req = item.req;
        if (req.size > 0) {
          overview.req.size += req.size;
          overview.req.unzipSize +=
            req.unzipSize == null ? req.size : req.unzipSize;
        }
        var res = item.res;
        if (res.size > 0) {
          overview.res.size += res.size;
          overview.res.unzipSize +=
            res.unzipSize == null ? res.size : res.unzipSize;
        }
      });
    } else if (data) {
      overview = activeItem = data;
    } else {
      overview = activeItem = modal && modal.getActive();
      if (!activeItem || activeItem.hide) {
        overview = activeItem = selectedList && selectedList[0];
      }
    }
    var curTab = state.tab;
    if (!curTab && overview) {
      curTab = tabs[0];
      tabs.forEach(function (tab) {
        tab.active = false;
      });
      this.selectTab(curTab);
    }
    var name = curTab && curTab.name;
    var frames = activeItem && activeItem.frames;
    var dockToBottom = this.props.dockToBottom;

    return (
      <div
        className={
          'fill orient-vertical-box w-detail' +
          (dockToBottom ? ' w-detail-bottom' : '')
        }
        onDragEnter={this.onDragEnter}
        onDrop={this.onDrop}
      >
        <BtnGroup
          ref="tabs"
          dockBtn={
            <button
              onClick={this.props.onDockChange}
              className="w-dock-btn"
              title={
                'Dock to ' + (dockToBottom ? 'right' : 'bottom') + ' (F12)'
              }
            >
              <span
                className={
                  'glyphicon glyphicon-menu-' +
                  (dockToBottom ? 'right' : 'down') +
                  (data ? ' hide' : '')
                }
              ></span>
            </button>
          }
          onDoubleClick={this.onDoubleClick}
          onClick={this.toggleTab}
          tabs={tabs}
        />
        {state.initedOverview ? (
          <Overview modal={overview} rulesModal={this.props.rulesModal} hide={name != tabs[0].name} />
        ) : null}
        {state.initedInspectors ? (
          <Inspectors
            modal={activeItem}
            frames={frames}
            hide={name != tabs[1].name}
          />
        ) : null}
         {state.initedTimeline ? (
          <Timeline data={data} modal={modal} hide={name != tabs[2].name} />
        ) : null}
        {state.initedComposer ? (
          <ComposerList
            modal={state.activeItem}
            hide={name != tabs[3].name}
          />
        ) : null}
        {state.initedTools ? <Tools hide={name != tabs[4].name} /> : null}
        {state.initedSaved ? <Saved hide={name != tabs[5].name} /> : null}
      </div>
    );
  }
});

module.exports = ReqData;
