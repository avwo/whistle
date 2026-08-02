require('../css/detail.css');
var $ = require('jquery');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var BtnGroup = require('./btn-group');
var Overview = require('./overview');
var Inspectors = require('./inspectors');
var Timeline = require('./timeline');
var ComposerList = require('./composer-list');
var Tools = require('./tools');
var Saved = require('./saved');
var util = require('./util');
var Icon = require('./icon');

var trigger = util.trigger;

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
    util.on('showOverview', function () {
      trigger('overviewScrollTop');
      self.toggleTab(tabs[0]);
    })
      .on('showInspectors', function () {
        self.toggleTab(tabs[1]);
      })
      .on('showTimeline', function () {
        self.toggleTab(tabs[2]);
      })
      .on('showLog', function (_, data) {
        self.toggleTab(tabs[4], function() {
          if (util.isStr(data)) {
            self.refs.tools.showTab(0, data);
          } else if (data) {
            trigger('uploadLogs', data);
            self.refs.tools.shakeTab();
          }
        });
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
        var index = 0;
        if (tab === tabs[0]) {
          index = 1;
        } else if (tab === tabs[1]) {
          index = 2;
        }
        self.toggleTab(tabs[index]);
      }).on('shakeSavedTab', self.shakeSavedTab);
  },
  shakeSavedTab: function() {
    util.shakeElem($(findDOMNode(this.refs.tabs)).find('button[data-name="Saved"]'));
  },
  showComposer: function (item) {
    var self = this;
    if (item) {
      self.state.activeItem = item;
    }
    self.toggleTab(self.state.tabs[3], function () {
      item && trigger('setComposer');
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
    var self = this;
    var modal = self.props.modal;
    var id = e.dataTransfer.getData('reqDataId');
    var list = modal && modal.list;
    var len = list && list.length;
    if (!id || !len) {
      return;
    }
    var item = self.getItemById(id, list);
    if (self.isShowingSaved()) {
      return trigger('saveSessions', [item]);
    }
    item && self.showComposer(item);
  },
  onDoubleClick: function () {
    trigger('ensureSelectedItemVisible');
  },
  toggleTab: function (tab, callback) {
    var self = this;
    if (tab.name === 'Inspectors' && self.state.initedInspectors) {
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
    self.selectTab(tab);
    self.setState({ tab: tab }, callback);
  },
  selectTab: function (tab) {
    var state = this.state;
    state.tabs.forEach(function (tab) {
      tab.active = false;
    });
    tab.active = true;
    state.tab = tab;
    state['inited' + tab.name] = true;
  },
  shakeComposerTab: function() {
    util.shakeElem($(findDOMNode(this.refs.tabs)).find('button[data-name="Composer"]'));
  },
  render: function () {
    var self = this;
    var props = self.props;
    var modal = props.modal;
    var state = self.state;
    var data = props.data;
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
        var startTime = item.startTime;
        var startTime2 = overview.startTime;
        var endTime = item.endTime;
        var endTime2 = overview.endTime;
        var req = item.req;
        var res = item.res;

        if (startTime2 == null || startTime2 > startTime) {
          overview.startTime = startTime;
        }
        if (endTime2 == null || endTime2 < endTime) {
          overview.endTime = endTime;
        }
        if (req.size > 0) {
          overview.req.size += req.size;
          overview.req.unzipSize +=
            req.unzipSize == null ? req.size : req.unzipSize;
        }
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
      self.selectTab(curTab);
    }
    var name = curTab && curTab.name;
    var frames = activeItem && activeItem.frames;
    var dockToBottom = props.dockToBottom;
    var isHide = function(i) {
      return name != tabs[i].name;
    };

    return (
      <div
        className={
          'fill v-box w-detail' +
          (dockToBottom ? ' w-detail-bottom' : '')
        }
        onDragEnter={self.onDragEnter}
        onDrop={self.onDrop}
      >
        <BtnGroup
          ref="tabs"
          dockBtn={
            <button
              onClick={props.onDockChange}
              className="w-dock-btn"
              title={
                'Dock to ' + (dockToBottom ? 'right' : 'bottom') + ' (F12)'
              }
            >
              <Icon name={'menu-' + (dockToBottom ? 'right' : 'down')} className={util.getHide(data)} />
            </button>
          }
          onDoubleClick={self.onDoubleClick}
          onClick={self.toggleTab}
          tabs={tabs}
        />
        {state.initedOverview ? (
          <Overview modal={overview} rulesModal={props.rulesModal} hide={isHide(0)} />
        ) : null}
        {state.initedInspectors ? (
          <Inspectors
            modal={activeItem}
            frames={frames}
            hide={isHide(1)}
          />
        ) : null}
        {state.initedTimeline ? (
          <Timeline data={data} modal={modal} hide={isHide(2)} />
        ) : null}
        {state.initedComposer ? (
          <ComposerList
            modal={state.activeItem}
            hide={isHide(3)}
          />
        ) : null}
        {state.initedTools ? <Tools ref="tools" hide={isHide(4)} /> : null}
        {state.initedSaved ? <Saved hide={isHide(5)} /> : null}
      </div>
    );
  }
});

module.exports = ReqData;
