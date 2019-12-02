require('./base-css.js');
require('../css/req-data.css');
require('react-virtualized/styles.css');

var RV = require('react-virtualized/dist/umd/react-virtualized');
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var QRCodeDialog = require('./qrcode-dialog');
var util = require('./util');
var columns = require('./columns');
var FilterInput = require('./filter-input');
var Spinner = require('./spinner');
var ContextMenu = require('./context-menu');
var events = require('./events');
var iframes = require('./iframes');
var dataCenter = require('./data-center');

var HEIGHT = 24;
var columnState = {};
var CMD_RE = /^:dump\s+(\d{1,15})\s*$/;
var NOT_BOLD_RULES = {
  plugin: 1,
  pac: 1,
  reqWrite: 1,
  resWrite: 1,
  reqWriteRaw: 1,
  resWriteRaw: 1,
  responseFor: 1,
  style: 1
};
var contextMenuList = [
  {
    name: 'Open',
    list: [
      { name: 'Overview' },
      { name: 'Inspectors' },
      { name: 'Frames' },
      { name: 'Timeline' },
      { name: 'New Tab'},
      { name: 'QR Code' },
      { name: 'Preview' }
    ]
  },
  {
    name: 'Copy',
    list: [
      { name: 'Host' },
      { name: 'Path' },
      { name: 'URL' },
      { name: 'Full URL' },
      { name: 'As CURL' },
      { name: 'Client IP' },
      { name: 'Server IP' },
      { name: 'Req Headers' },
      { name: 'Res Headers' },
      { name: 'Cookie' }
    ]
  },
  {
    name: '+File',
    list: [
      { name: 'Req Body' },
      { name: 'Res Body' },
      { name: 'Req Raw' },
      { name: 'Res Raw' }
    ]
  },
  {
    name: 'Remove',
    list:  [
      { name: 'All' },
      { name: 'One' },
      { name: 'Others' },
      { name: 'Selected' },
      { name: 'Unselected' },
      { name: 'All Such Host', action: 'removeAllSuchHost' },
      { name: 'All Such URL', action: 'removeAllSuchURL' }
    ]
  },
  {
    name: 'Filter',
    list:  [
      { name: 'Edit' },
      { name: 'Exclude All Such Host', action: 'excludeHost' },
      { name: 'Exclude All Such URL', action: 'excludeUrl' }
    ]
  },
  {
    name: 'Actions',
    list: [
      { name: 'Abort' },
      { name: 'Replay' },
      { name: 'Compose' }
    ]
  },
  { name: 'Share' },
  { name: 'Import' },
  { name: 'Export' },
  {
    name: 'Others',
    action: 'Plugins',
    list: []
  },
  { name: 'Help', sep: true }
];

function getUploadSessionsFn() {
  try {
    var uploadSessions = window.parent.uploadWhistleSessions;
    return typeof uploadSessions === 'function' ? uploadSessions : null;
  } catch(e) {}
}

function getClassName(data) {
  return getStatusClass(data) + ' w-req-data-item'
    + (data.isHttps ? ' w-tunnel' : '')
      + (hasRules(data) ? ' w-has-rules' : '')
        + (data.selected ? ' w-selected' : '');
}

function hasRules(data) {
  var rules = data.rules;
  if (!rules) {
    return false;
  }
  var keys = Object.keys(data.rules);
  if (keys && keys.length) {
    for (var i = 0, len = keys.length; i < len; i++) {
      if (rules[keys[i]] && !NOT_BOLD_RULES[keys[i]]) {
        return true;
      }
    }
  }

  return false;
}

function getStatusClass(data) {
  var type = '';
  var headers = data.res.headers;
  switch(util.getContentType(headers)) {
  case 'JS':
    type = 'warning';
    break;
  case 'CSS':
    type = 'info';
    break;
  case 'HTML':
    type = 'success';
    break;
  case 'IMG':
    type = 'active';
    break;
  }

  var statusCode = data.res && data.res.statusCode;
  if (data.reqError || data.resError) {
    type += ' danger w-error-status';
  } else if (statusCode == 403) {
    type += ' w-forbidden';
  } else if (statusCode && (!/^\d+$/.test(statusCode) || statusCode >= 400)) {
    type += ' w-error-status';
  }

  return type;
}

function getSelectedRows() {
  var range = getSelection();
  if (!range) {
    return;
  }
  try {
    range = range.getRangeAt(0);
  } catch(e) {
    return;
  }
  var startElem = $(range.startContainer).closest('.w-req-data-item');
  if (!startElem.length) {
    return null;
  }
  var endElem = $(range.endContainer).closest('.w-req-data-item');
  if (!startElem.length || !endElem.length) {
    return null;
  }
  return [startElem, endElem];
}

function getSelection() {
  if (window.getSelection) {
    return window.getSelection();
  }
  return document.getSelection();
}

function getFilename(item, type) {
  var url = util.removeProtocol(item.url.replace(/[?#].*/, ''));
  var index = url.lastIndexOf('/');
  var name = index != -1 && url.substring(index + 1);
  var isRaw = type[4] === 'r';
  if (name) {
    index = name.lastIndexOf('.');
    if (index !== -1 && index < name.length - 1) {
      return name.substring(0, index) + '_' + type + (isRaw ? '.txt' : '.' + name.substring(index + 1));
    }
  } else {
    name = url.substring(0, url.indexOf('/'));
  }
  var suffix = isRaw ? '' : util.getExtension(type[2] === 'q' ? item.req.headers : item.res.headers);
  return name + '_' + type + suffix;
}

var Row = React.createClass({
  shouldComponentUpdate: function(nextProps) {
    var p = this.props;
    return p.order != nextProps.order || this.req != p.item.req ||
    p.draggable != nextProps.draggable || p.columnList != nextProps.columnList;
  },
  render: function() {
    var p = this.props;
    var order = p.order;
    var draggable = p.draggable;
    var columnList = p.columnList;
    var item = p.item;
    var style = item.style;
    this.req = item.req;
    return (<table  className="table" key={p.key} style={p.style}><tbody>
              <tr tabIndex="-1" draggable={draggable} data-id={item.id} className={getClassName(item)} style={{outline:'none'}}>
                <th className="order" scope="row" style={style}>{order}</th>
                {columnList.map(function(col) {
                  var name = col.name;
                  var className = col.className;
                  var value = name === 'hostIp' ? util.getServerIp(item) : item[name];
                  return (<td key={name} className={className} style={style} title={col.showTitle ? value : undefined}>{value}</td>);
                })}
              </tr>
            </tbody></table>);
  }
});

var ReqData = React.createClass({
  getInitialState: function() {
    var dragger = columns.getDragger();
    dragger.onDrop = dragger.onDrop.bind(this);
    return {
      draggable: true,
      columns: columns.getSelectedColumns(),
      dragger: dragger
    };
  },
  componentDidMount: function() {
    var self = this;
    var timer;
    events.on('hashFilterChange', function() {
      self.setState({});
    });
    events.on('onColumnsChanged', function() {
      self.setState({
        columns: columns.getSelectedColumns()
      });
    });
    var update = function() {
      self.setState({});
    };
    var render = function() {
      timer && clearTimeout(timer);
      timer = setTimeout(update, 60);
    };
    self.container = ReactDOM.findDOMNode(self.refs.container);
    self.content = ReactDOM.findDOMNode(self.refs.content);
    self.$content = $(self.content).on('dblclick', 'tr', function() {
      events.trigger('showOverview');
    }).on('click', 'tr', function(e) {
      var modal = self.props.modal;
      var item = modal.getItem(this.getAttribute('data-id'));
      self.onClick(e, item);
    });
    var toggoleDraggable = function(e) {
      var draggable = !e.shiftKey;
      if (self.state.draggable === draggable) {
        return;
      }
      self.setState({ draggable: draggable });
    };
    $(self.container).on('keydown', function(e) {
      var modal = self.props.modal;
      toggoleDraggable(e);
      if (!modal) {
        return;
      }
      var item;
      if (e.keyCode == 38) { //up
        item = modal.prev();
      } else if (e.keyCode == 40) {//down
        item = modal.next();
      }

      if (item) {
        self.onClick(e, item, true);
        e.preventDefault();
      }
    }).on('scroll', render).on('keyup', toggoleDraggable)
    .on('mouseover', toggoleDraggable)
    .on('mouseleave', toggoleDraggable);

    $(window).on('resize', render);
    events.on('overviewScrollTop', function () {
      var modal = self.props.modal;
      var selected =  modal && modal.getSelectedList()[0];
      if(selected){
        modal.list
        .filter(function(item){return !item.hide;})
        .some(function(item,index){
          if(item.id===selected.id){
            self.scrollToRow(index);
            return true;
          }
          return false;
        });
      }else{
        self.scrollToRow(0);
      }
    });
  },
  onDragStart: function(e) {
    var target = $(e.target).closest('.w-req-data-item');
    e.dataTransfer.setData('reqDataId', target.attr('data-id'));
  },
  onClick: function(e, item, hm) {
    var self = this;
    var modal = self.props.modal;
    var resetRange = function() {
      var range = getSelection();
      if (range) {
        range.removeAllRanges();
        var target = e.target;
        var row = $(target).closest('.w-req-data-item')[0];
        if (row) {
          var draggable = row.draggable;
          row.draggable = false;
          var r = document.createRange();
          r.selectNodeContents(target);
          range.addRange(r);
          if (draggable) {
            row.draggable = true;
          }
        }
      }
      return range;
    };
    var rows;
    if (e.shiftKey) {
      rows = getSelectedRows();
      !rows && resetRange();
    } else {
      resetRange();
    }
    var allowMultiSelect = e.ctrlKey || e.metaKey;
    if (hm || !allowMultiSelect) {
      self.$content.find('tr.w-selected').removeClass('w-selected');
      self.clearSelection();
    }
    if (hm) {
      item.selected = true;
      self.setSelected(item);
    } else if (e.shiftKey && (rows = getSelectedRows())) {
      modal.setSelectedList(rows[0].attr('data-id'),
          rows[1].attr('data-id'), self.setSelected.bind(self), allowMultiSelect);
    } else {
      item.selected = !allowMultiSelect || !item.selected;
      self.setSelected(item, true);
    }

    modal.clearActive();
    item.active = item.selected;
    hm && util.ensureVisible(this.$content.find('tr[data-id=' + item.id + ']'), self.container);
    events.trigger('networkStateChange');
  },
  setSelected: function(item, unselect) {
    if (item.selected) {
      this.$content.find('tr[data-id=' + item.id + ']').addClass('w-selected');
    } else if (unselect) {
      this.$content.find('tr[data-id=' + item.id + ']').removeClass('w-selected');
    }
  },
  clearSelection: function() {
    var modal = this.props.modal;
    modal && modal.clearSelection();
  },
  getFilterList: function() {
    var settings = dataCenter.getFilterText();
    if (settings.disabledExcludeText) {
      return [];
    }
    return settings.excludeText.trim().split(/\s+/g);
  },
  updateFilter: function(str) {
    var settings = dataCenter.getFilterText();
    settings.excludeText = str;
    settings.disabledExcludeText = false;
    dataCenter.setFilterText(settings);
    events.trigger('filterChanged');
  },
  getActiveList: function(curItem) {
    var modal = this.props.modal;
    if (!modal || !curItem.selected) {
      return [curItem];
    }
    return modal.getSelectedList();
  },
  removeAllSuchHost: function(item, justRemove) {
    var hostList = [];
    var list = this.getActiveList(item);
    list.forEach(function(item) {
      var host = item.isHttps ? item.path : item.hostname;
      if (hostList.indexOf(host) === -1) {
        hostList.push(host);
      }
    });
    var modal = this.props.modal;
    modal && modal.removeByHostList(hostList);
    if (!justRemove) {
      var filterList = this.getFilterList();
      hostList.forEach(function(host) {
        host = 'H:' + host;
        if (filterList.indexOf(host) === -1) {
          filterList.unshift(host);
        }
      });
      this.updateFilter(filterList.join('\n'));
    }
    events.trigger('updateGlobal');
  },
  removeAllSuchURL: function(item, justRemove) {
    var urlList = [];
    var list = this.getActiveList(item);
    list.forEach(function(item) {
      var url = item.isHttps ? item.path : item.url.replace(/\?.*$/, '').substring(0, 1024);
      if (urlList.indexOf(url) === -1) {
        urlList.push(url);
      }
    });
    var modal = this.props.modal;
    modal && modal.removeByUrlList(urlList);
    if (!justRemove) {
      var filterList = this.getFilterList();
      urlList.forEach(function(url) {
        if (filterList.indexOf(url) === -1) {
          filterList.unshift(url);
        }
      });
      this.updateFilter(filterList.join('\n'));
    }
    events.trigger('updateGlobal');
  },
  triggerActiveItem: function(item) {
    this.onClick('', item, true);
    events.trigger('networkStateChange');
  },
  onClickContextMenu: function(action, e, parentAction, name) {
    var self = this;
    var item = self.currentFocusItem;
    switch(parentAction || action) {
    case 'New Tab':
      item && window.open(item.url);
      break;
    case 'QR Code':
      self.refs.qrcodeDialog.show(item && item.url);
      break;
    case 'Preview':
      util.openPreview(item);
      break;
    case 'Overview':
      self.triggerActiveItem(item);
      events.trigger('showOverview');
      break;
    case 'Inspectors':
      self.triggerActiveItem(item);
      events.trigger('showInspectors');
      break;
    case 'Frames':
      self.triggerActiveItem(item);
      events.trigger('showFrames');
      break;
    case 'Timeline':
      self.triggerActiveItem(item);
      events.trigger('showTimeline');
      break;
    case 'Compose':
      events.trigger('composer', item);
      break;
    case 'Replay':
      events.trigger('replaySessions', [item, e.shiftKey]);
      break;
    case 'Export':
      events.trigger('exportSessions', item);
      break;
    case 'Abort':
      events.trigger('abortRequest', item);
      break;
    case 'Req Body':
      events.trigger('showFilenameInput', {
        title: 'Set the filename of request body',
        base64: item.req.base64,
        name: getFilename(item, 'req_body')
      });
      break;
    case 'Res Body':
      events.trigger('showFilenameInput', {
        title: 'Set the filename of response body',
        base64: item.res.base64,
        name: getFilename(item, 'res_body')
      });
      break;
    case 'Req Raw':
      var req = item.req;
      var realUrl = item.realUrl;
      if (!realUrl || !/^(?:http|wss)s?:\/\//.test(realUrl)) {
        realUrl = item.url;
      }
      var reqLine = [req.method, req.method == 'CONNECT' ? req.headers.host : util.getPath(realUrl),
        'HTTP/' + (req.httpVersion || '1.1')].join(' ');
      events.trigger('showFilenameInput', {
        title: 'Set the filename of request raw data',
        headers: reqLine + '\r\n' + util.objectToString(req.headers, req.rawHeaderNames, true),
        base64: req.base64,
        name: getFilename(item, 'req_raw')
      });
      break;
    case 'Res Raw':
      var res = item.res;
      var statusLine = ['HTTP/' + (item.req.httpVersion || '1.1'), res.statusCode,
        util.getStatusMessage(res)].join(' ');
      events.trigger('showFilenameInput', {
        title: 'Set the filename of response raw data',
        headers: statusLine + '\r\n' + util.objectToString(res.headers, res.rawHeaderNames, true),
        base64: item.res.base64,
        name: getFilename(item, 'res_raw')
      });
      break;
    case 'Share':
      events.trigger('uploadSessions', {
        curItem: item,
        upload: getUploadSessionsFn()
      });
      break;
    case 'Import':
      events.trigger('importSessions', e);
      break;
    case 'Edit':
      events.trigger('filterSessions', e);
      break;
    case 'removeAllSuchHost':
      item && self.removeAllSuchHost(item, true);
      break;
    case 'removeAllSuchURL':
      item && self.removeAllSuchURL(item, true);
      break;
    case 'excludeHost':
      item && self.removeAllSuchHost(item);
      break;
    case 'excludeUrl':
      item && self.removeAllSuchURL(item);
      break;
    case 'One':
      events.trigger('removeIt', item);
      break;
    case 'All':
      events.trigger('clearAll');
      break;
    case 'Others':
      events.trigger('removeOthers', item);
      break;
    case 'Selected':
      events.trigger('removeSelected');
      break;
    case 'Unselected':
      events.trigger('removeUnselected');
      break;
    case 'Help':
      window.open('https://avwo.github.io/whistle/webui/network.html');
      break;
    case 'Plugins':
      iframes.fork(action, {
        type: 'network',
        name: name,
        activeItem: item,
        selectedList: self.props.modal.getSelectedList()
      });
      break;
    }
  },
  onContextMenu: function(e) {
    var dataId = $(e.target).closest('.w-req-data-item').attr('data-id');
    var modal = this.props.modal;
    var item = modal.getItem(dataId);
    var disabled = !item;
    e.preventDefault();
    this.currentFocusItem = item;
    contextMenuList[0].disabled = disabled;
    var list0 = contextMenuList[0].list;
    list0[4].disabled = disabled || !/^https?:\/\//.test(item.url);
    if (disabled) {
      list0[6].disabled = true;
    } else {
      var type = util.getContentType(item.res.headers);
      list0[6].disabled = !item.res.base64 || (type !== 'HTML' && type !== 'IMG');
    }
    list0[0].disabled = disabled;
    list0[1].disabled = disabled;
    list0[2].disabled = (disabled || !item.frames);
    list0[3].disabled = disabled;

    contextMenuList[1].disabled = disabled;
    contextMenuList[1].list.forEach(function(menu) {
      menu.disabled = disabled;
      switch(menu.name) {
      case 'URL':
        menu.copyText = item && item.url.replace(/[?#].*$/, '');
        break;
      case 'Host':
        menu.copyText = item && (item.isHttps ? item.path : item.hostname);
        break;
      case 'Path':
        menu.copyText = item && item.path;
        break;
      case 'Full URL':
        menu.copyText = item && item.url;
        break;
      case 'As CURL':
        menu.copyText = util.asCURL(item);
        break;
      case 'Client IP':
        menu.copyText = item && item.clientIp;
        break;
      case 'Server IP':
        var serverIp = item && util.getServerIp(item);
        menu.disabled = !serverIp;
        menu.copyText = serverIp;
        break;
      case 'Req Headers':
        menu.copyText = item && util.objectToString(item.req.rawHeaders || item.req.headers);
        menu.disabled = !menu.copyText;
        break;
      case 'Res Headers':
        menu.copyText = item && util.objectToString(item.res.rawHeaders || item.res.headers);
        menu.disabled = !menu.copyText;
        break;
      case 'Cookie':
        var cookie = item && item.req.headers.cookie;
        menu.disabled = !cookie;
        menu.copyText = cookie;
        break;
      }
    });

    var list2 = contextMenuList[2].list;
    contextMenuList[2].disabled = disabled;
    for (var i = 0; i < 4; i++) {
      list2[i].disabled = disabled;
    }
    if (!disabled) {
      list2[0].disabled = !item.requestTime || !item.req.base64;
      list2[1].disabled = !item.endTime || !item.res.base64;
      list2[2].disabled = !item.requestTime;
      list2[3].disabled = !item.endTime;
    }

    var selectedList = modal.getSelectedList();
    var selectedCount = selectedList.length;
    var hasData = modal.list.length;
    var list3 = contextMenuList[3].list;
    contextMenuList[3].disabled = !hasData;
    list3[0].disabled = !hasData;
    list3[1].disabled = disabled;
    list3[2].disabled = disabled || selectedCount === hasData;
    list3[3].disabled = !selectedCount;
    list3[4].disabled = selectedCount === hasData;
    list3[5].disabled = disabled;
    list3[6].disabled = disabled;

    var list4 = contextMenuList[4].list;
    list4[1].disabled = disabled;
    list4[2].disabled = disabled;

    contextMenuList[5].disabled = disabled;
    var list5 = contextMenuList[5].list;
    if (item) {
      list5[2].disabled = false;
      if (item.selected) {
        list5[1].disabled = !selectedList.filter(util.canReplay).length;
        list5[0].disabled = !selectedList.filter(util.canAbort).length;
      } else {
        list5[1].disabled = !util.canReplay(item);
        list5[0].disabled = !util.canAbort(item);
      }
    } else {
      list5[0].disabled = true;
      list5[1].disabled = true;
      list5[2].disabled = true;
    }
    var uploadItem = contextMenuList[6];
    uploadItem.hide = !getUploadSessionsFn();
    contextMenuList[9].disabled = uploadItem.disabled = disabled && !selectedCount;
    var pluginItem = contextMenuList[9];
    util.addPluginMenus(pluginItem, dataCenter.getNetworkMenus(), uploadItem.hide ? 8 : 9, disabled);
    var height = (uploadItem.hide ? 310 : 340) - (pluginItem.hide ? 30 : 0);
    pluginItem.maxHeight = height;
    var data = util.getMenuPosition(e, 110, height);
    data.list = contextMenuList;
    data.className = data.marginRight < 360 ? 'w-ctx-menu-left' : '';
    this.refs.contextMenu.show(data);
  },
  onFilterChange: function(keyword) {
    var self = this;
    var modal = self.props.modal;
    var autoRefresh = modal && modal.search(keyword);
    clearTimeout(self.networkStateChangeTimer);
    self.networkStateChangeTimer = setTimeout(function() {
      self.setState({filterText: keyword}, function() {
        autoRefresh && self.autoRefresh();
      });
      events.trigger('networkStateChange');
    }, 600);
  },
  onFilterKeyDown: function(e) {
    if (e.keyCode !== 13 || !CMD_RE.test(e.target.value)) {
      return;
    }
    dataCenter.setDumpCount(parseInt(RegExp.$1, 10));
    var modal = this.props.modal;
    modal && modal.clear();
    this.refs.filterInput.clearFilterText();
  },
  autoRefresh: function() {
    if (this.container) {
      this.container.scrollTop = this.content.offsetHeight;
    }
  },
  orderBy: function(e) {
    var target = $(e.target).closest('th')[0];
    if (!target) {
      return;
    }
    var modal = this.props.modal;
    var name = target.className;
    var order;
    if (name == 'order') {
      columnState = {};
    } else {
      order = columnState[name];
      if (order == 'desc') {
        columnState[name] = 'asc';
      } else if (order == 'asc') {
        columnState[name] = null;
      } else {
        columnState[name] = 'desc';
      }
    }

    if (modal) {
      var sortColumns = [];
      Object.keys(columnState).forEach(function(name) {
        if (order = columnState[name]) {
          sortColumns.push({
            name: name,
            order: order
          });
        }
      });
      modal.setSortColumns(sortColumns);
    }
    this.setState({});
  },
  onColumnsResort: function() {
    this.setState({ columns: columns.getSelectedColumns() });
  },
  getVisibleIndex: function() {
    var container = this.container;
    var len = container && this.props.modal && this.props.modal.list.length;
    var height = len && container.offsetHeight;
    if (height) {
      var scrollTop = container.scrollTop;
      var startIndex = Math.floor(Math.max(scrollTop - 240, 0) / HEIGHT);
      var endIndex = Math.floor(Math.max(scrollTop + height + 240, 0) / HEIGHT);
      this.indeies = [startIndex, endIndex];
    }

    return this.indeies;
  },
  renderColumn: function(col) {
    var name = col.name;
    var disabledColumns = columns.isDisabled();
    return (
      <th {...this.state.dragger} data-name={name}
        draggable={!disabledColumns}
        key={name} className={col.className}
        style={{color: columnState[name] ? '#337ab7' : undefined}}>
        {col.title}<Spinner order={columnState[name]} />
      </th>
    );
  },

  scrollToRow: function(index){
    this.refs.content.refs.list.scrollToRow(index);
  },

  render: function() {
    var self = this;
    var state = this.state;
    var modal = self.props.modal;
    var list = modal ? modal.list.filter(function(item){return !item.hide;}) : [];
    var hasKeyword = modal && modal.hasKeyword();
    var index = 0;
    var draggable = state.draggable;
    var columnList = state.columns;
    var filterText = (state.filterText || '').trim();
    var minWidth = 50;


    // reduce
    for (var i = 0, len = columnList.length; i < len; i++) {
      minWidth += columnList[i].minWidth;
    }
    minWidth = {'min-width': minWidth + 'px'};

    return (
        <div className="fill w-req-data-con orient-vertical-box">
          <div style={minWidth} className="w-req-data-content fill orient-vertical-box">
            <div className="w-req-data-headers">
              <table className="table">
                  <thead>
                    <tr onClick={self.orderBy}>
                      <th className="order">#</th>
                      {columnList.map(this.renderColumn)}
                    </tr>
                  </thead>
                </table>
            </div>
            <div ref="container" tabIndex="0" onContextMenu={self.onContextMenu}
              style={{background: (dataCenter.hashFilterObj || filterText) ? 'lightyellow' : undefined}}
              className="w-req-data-list fill"  onDragStart={this.onDragStart}>
                <RV.AutoSizer ref="content" >{function(size){
                  return (
                      <RV.List
                      ref="list"
                      rowHeight={30}
                      width={size.width}
                      height={size.height}
                      rowCount={list.length}
                      rowRenderer={function(options){
                        // var {index, isScrolling, key, style}=options;
                        var item = list[options.index];
                        var order = hasKeyword? options.index+1 : item.order;
                        return <Row style={options.style} key={options.key} order={order}  index={index}
                          columnList={columnList} draggable={draggable} item={item} />;
                      }}
                      />);
                }}
                </RV.AutoSizer>
            </div>
          </div>
          <FilterInput ref="filterInput" onKeyDown={this.onFilterKeyDown}
            onChange={this.onFilterChange} wStyle={minWidth} />
          <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
          <QRCodeDialog ref="qrcodeDialog" />
      </div>
    );
  }
});

module.exports = ReqData;
