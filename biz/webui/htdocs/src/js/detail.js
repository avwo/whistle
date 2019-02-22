require('./base-css.js');
require('../css/detail.css');
var $ = require('jquery');
var React = require('react');
var events = require('./events');
var BtnGroup = require('./btn-group');
var Overview = require('./overview');
var Inspectors = require('./inspectors');
var Frames = require('./frames');
var Timeline = require('./timeline');
var Composer = require('./composer');
var Log = require('./log');
var util = require('./util');

var ReqData = React.createClass({
  getInitialState: function() {
    return {
      tabs: [{
        name: 'Overview',
        icon: 'eye-open'
      }, {
        name: 'Inspectors',
        icon: 'search'
      }, {
        name: 'Frames',
        icon: 'menu-hamburger'
      }, {
        name: 'Composer',
        icon: 'edit'
      }, {
        name: 'Timeline',
        icon: 'time'
      }, {
        name: 'Log',
        icon: 'file'
      }],
      initedOverview: false,
      initedInspectors: false,
      initedFrames: false,
      initedTimeline: false,
      initedComposer: false,
      initedLog: false
    };
  },
  componentDidMount: function() {
    var self = this;
    var tabs = self.state.tabs;
    if (!this.props.data) {
      events.on('showOverview', function() {
        events.trigger('overviewScrollTop');
        self.toggleTab(tabs[0]);
      }).on('showInspectors', function() {
        self.toggleTab(tabs[1]);
      }).on('showFrames', function() {
        self.toggleTab(tabs[2]);
      }).on('showTimeline', function() {
        self.toggleTab(tabs[4]);
      }).on('showLog', function() {
        self.toggleTab(tabs[5]);
      }).on('composer', function(e, item) {
        var modal = self.props.modal;
        self.showComposer(item || (modal && modal.getActive()));
      }).on('networkStateChange', function() {
        self.setState({});
      });
    }
  },
  showComposer: function(item) {
    if (item) {
      this.state.activeItem = item;
    }
    this.toggleTab(this.state.tabs[3], function() {
      events.trigger('setComposer');
    });
  },
  onDragEnter: function(e) {
    if (e.dataTransfer.types.indexOf('reqdataid') != -1) {
      this.showComposer();
      e.preventDefault();
    }
  },
  onDrop: function(e) {
    var modal = this.props.modal;
    var id = e.dataTransfer.getData('reqDataId');
    var list = modal && modal.list;
    if (!id || !list) {
      return;
    }
    for (var i = 0, len = list.length; i < len; i++) {
      var data = list[i];
      if (data && data.id === id) {
        return this.showComposer(data);
      }
    }
  },
  onDoubleClick: function(e) {
    var target = e.target;
    if (/overview/i.test(target.innerHTML)) {
      events.trigger('overviewScrollTop');
    }
    var container = $('.w-req-data-list');
    var elem = container.find('.w-req-data-item.w-selected:visible:first');
    if (elem.length) {
      util.ensureVisible(elem, container, true);
    }
  },
  toggleTab: function(tab, callback) {
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
    this.setState({tab: tab}, callback);
  },
  selectTab: function(tab) {
    this.state.tabs.forEach(function(tab) {
      tab.active = false;
    });
    tab.active = true;
    this.state.tab = tab;
    this.state['inited' + tab.name] = true;
  },
  render: function() {
    var modal = this.props.modal;
    var data = this.props.data;
    var tabs = this.state.tabs;
    var selectedList = !data && modal && modal.getSelectedList();
    var activeItem;
    var overview;
    if (selectedList && selectedList.length > 1) {
      overview = {
        req: {
          size: 0,
          headers: {}
        },
        res: {
          size: 0,
          headers: {}
        }
      };
      selectedList.forEach(function(item) {
        if (overview.startTime == null || overview.startTime > item.startTime) {
          overview.startTime = item.startTime;
        }
        if (overview.endTime == null || overview.endTime < item.endTime) {
          overview.endTime = item.endTime;
        }
        if (item.req.size > 0) {
          overview.req.size += item.req.size;
        }
        if (item.res.size > 0) {
          overview.res.size += item.res.size;
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
    var curTab = this.state.tab;
    if (!curTab && overview) {
      curTab = tabs[0];
      tabs.forEach(function(tab) {
        tab.active = false;
      });
      this.selectTab(curTab);
    }
    var name = curTab && curTab.name;

    var frames;
    if (activeItem && !activeItem.reqError && !activeItem.resError) {
      frames = activeItem.frames;
    }
    var dockToBottom = this.props.dockToBottom;
    return (
        <div className="fill orient-vertical-box w-detail" onDragEnter={this.onDragEnter} onDrop={this.onDrop}>
        <BtnGroup dockBtn={
          <button
            onClick={this.props.onDockChange}
            className="w-dock-btn" title={'Dock to ' + (dockToBottom ? 'right' : 'bottom') + ' (F12)'}>
            <span className={'glyphicon glyphicon-menu-' + (dockToBottom ? 'right' : 'down') + (data ? ' hide' : '')}></span>
          </button>
        } onDoubleClick={this.onDoubleClick} onClick={this.toggleTab} tabs={tabs} />
        {this.state.initedOverview ? <Overview modal={overview} hide={name != tabs[0].name} /> : ''}
        {this.state.initedInspectors ? <Inspectors modal={activeItem} hide={name != tabs[1].name} /> : ''}
        {this.state.initedFrames ? <Frames data={activeItem} frames={frames} hide={name != tabs[2].name} /> : ''}
        {this.state.initedTimeline ? <Timeline data={data} modal={modal} hide={name != tabs[4].name} /> : ''}
        {this.state.initedComposer ? <Composer modal={this.state.activeItem} hide={name != tabs[3].name} /> : ''}
        {this.state.initedLog ? <Log hide={name != tabs[5].name} /> : ''}
      </div>
    );
  }
});

module.exports = ReqData;
