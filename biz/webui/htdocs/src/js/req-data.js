require('./base-css.js');
require('../css/req-data.css');
require('react-virtualized/styles.css');

var RV = require('react-virtualized/dist/umd/react-virtualized');
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var QRCodeDialog = require('./qrcode-dialog');
var util = require('./util');
var settings = require('./columns');
var FilterInput = require('./filter-input');
var ContextMenu = require('./context-menu');
var events = require('./events');
var iframes = require('./iframes');
var dataCenter = require('./data-center');
var storage = require('./storage');

var TREE_ROW_HEIGHT = 24;
var ROW_STYLE = { outline: 'none' };
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
  style: 1,
  G: 1,
  ignore: 1
};
var contextMenuList = [
  {
    name: 'Open',
    list: [
      { name: 'New Tab' },
      { name: 'QR Code' },
      { name: 'Overview' },
      { name: 'Inspectors' },
      { name: 'Timeline' },
      { name: 'Composer' },
      { name: 'Preview' },
      { name: 'Source' },
      { name: 'Tree View', action: 'toggleView' }
    ]
  },
  {
    name: 'Copy',
    shiftToEdit: true,
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
    list: [
      { name: 'All' },
      { name: 'This' },
      { name: 'Others' },
      { name: 'Selected' },
      { name: 'Unselected' },
      { name: 'Unmarked' },
      { name: 'All Such Host', action: 'removeAllSuchHost' },
      { name: 'All Such URL', action: 'removeAllSuchURL' }
    ]
  },
  {
    name: 'Filter',
    list: [
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
      { name: 'Replay Times', action: 'replayTimes' },
      { name: 'Compose' },
      { name: 'Mark' },
      { name: 'Unmark' }
    ]
  },
  {
    name: 'Tree',
    list: [
      { name: 'Expand' },
      { name: 'Collapse' },
      { name: 'Expand All' },
      { name: 'Collapse All' }
    ]
  },
  { name: 'Import' },
  { name: 'Export' },
  {
    name: 'Others',
    action: 'Plugins',
    list: []
  },
  { name: 'Help', sep: true }
];

function stopPropagation(e) {
  if (!$(e.target).closest('th').next('th').length) {
    return;
  }
  e.stopPropagation();
  e.preventDefault();
}

var getFocusItemList = function (curItem) {
  if (!curItem || curItem.selected) {
    return;
  }
  return [curItem];
};

var Spinner = React.createClass({
  render: function () {
    var order = this.props.order;
    var desc = order == 'desc';
    if (!desc && order != 'asc') {
      order = null;
    }
    return (
      <div className="w-spinner">
        <span
          className={
            'glyphicon glyphicon-triangle-top' +
            (order ? ' spinner-' + order : '')
          }
        ></span>
        <span
          className={
            'glyphicon glyphicon-triangle-bottom' +
            (order ? ' spinner-' + order : '')
          }
        ></span>
      </div>
    );
  }
});

function getColStyle(col, style) {
  style = style ? $.extend({}, style) : {};
  style.width = col.minWidth ? Math.max(col.width, col.minWidth) : col.width;
  return style;
}

function getClassName(data) {
  return (
    getStatusClass(data) +
    ' w-req-data-item' +
    (data.isHttps ? ' w-tunnel' : '') +
    (hasRules(data) ? ' w-has-rules' : '') +
    (data.selected ? ' w-selected' : '') +
    (data.isPR ? ' w-pr' : '')
  );
}

function isVisible(item) {
  return !item.hide;
}

function isVisibleInTree(item) {
  var parent = item.parent;
  return !parent || (parent.expand && parent.pExpand);
}

function hasRules(data) {
  var rules = data.rules;
  if (!rules) {
    return false;
  }
  var keys = Object.keys(rules);
  if (keys && keys.length) {
    for (var i = 0, len = keys.length; i < len; i++) {
      var rule = rules[keys[i]];
      var enable = rule && rule.list && rule.list.length === 1 && rule.list[0].matcher;
      if (rule && !NOT_BOLD_RULES[keys[i]] && enable !== 'enable://capture' &&  enable !== 'enable://intercept') {
        return true;
      }
    }
  }

  return false;
}

function getStatusClass(data) {
  var type = '';
  var headers = data.res.headers;
  switch (util.getContentType(headers)) {
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
  case 'JSON':
    type = '_json';
    break;
  case 'XML':
    type = '_xml';
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

  if (data.mark) {
    type += ' w-mark';
  }

  return type;
}

function getType(className) {
  if (className.indexOf('w-error-status') !== -1) {
    return 'ERROR';
  }
  if (className.indexOf('warning') !== -1) {
    return 'JS';
  }
  if (className.indexOf('info') !== -1) {
    return 'CSS';
  }
  if (className.indexOf('success') !== -1) {
    return 'HTML';
  }
  if (className.indexOf('active') !== -1) {
    return 'IMG';
  }
  if (className.indexOf('_json') !== -1) {
    return 'JSON';
  }
  if (className.indexOf('_xml') !== -1) {
    return 'XML';
  }
  return '';
}

function getIcon(data, className) {
  if (className.indexOf('danger') !== -1) {
    return <span className="icon-leaf glyphicon glyphicon-remove-circle" />;
  }
  if (className.indexOf('w-forbidden') !== -1) {
    return <span className="icon-leaf glyphicon glyphicon-ban-circle" />;
  }
  if (data && !data.endTime && !data.lost) {
    return <span className="icon-leaf glyphicon glyphicon-hourglass" />;
  }
  var type = getType(className);
  var status = data.res && data.res.statusCode;
  if (type !== 'ERROR' && status != 101) {
    status = null;
  }
  return (
    <span
      className={status || type ? 'w-type-icon' : 'glyphicon glyphicon-file'}
    >
      {status || type || null}
    </span>
  );
}

function getFilename(item, type) {
  var url = util.removeProtocol(item.url.replace(/[?#].*/, ''));
  var index = url.lastIndexOf('/');
  var name = index != -1 && url.substring(index + 1);
  var isRaw = type[4] === 'r';
  if (name) {
    index = name.lastIndexOf('.');
    if (index !== -1 && index < name.length - 1) {
      return (
        name.substring(0, index) +
        '_' +
        type +
        (isRaw ? '.txt' : '.' + name.substring(index + 1))
      );
    }
  } else {
    name = url.substring(0, url.indexOf('/'));
  }
  var suffix = isRaw
    ? ''
    : util.getExtension(type[2] === 'q' ? item.req.headers : item.res.headers);
  return name + '_' + type + suffix;
}

function removeLighhight(elem) {
  elem.removeClass('highlight');
}

var Row = React.createClass({
  render: function () {
    var p = this.props;
    var order = p.order;
    var draggable = p.draggable;
    var columnList = p.columnList;
    var item = p.item;
    var style = item.style;
    return (
      <table className="table" key={p.key} style={p.style}>
        <tbody>
          <tr
            tabIndex="-1"
            draggable={draggable}
            data-id={item.id}
            className={getClassName(item)}
            style={ROW_STYLE}
          >
            <th className="order" scope="row" style={style}>
              {order}
            </th>
            {columnList.map(function (col) {
              var name = col.name;
              var className = col.className;
              var value =
                name === 'hostIp' ? util.getServerIp(item) : item[name];
              var colStyle = getColStyle(col, style);
              return (
                <td
                  key={name}
                  className={className}
                  style={colStyle}
                  title={col.showTitle ? value : undefined}
                >
                  {value}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    );
  }
});

var ReqData = React.createClass({
  getInitialState: function () {
    var dragger = settings.getDragger();
    dragger.onDrop = dragger.onDrop.bind(this);
    return {
      draggable: true,
      columns: settings.getSelectedColumns(),
      dragger: dragger
    };
  },
  componentDidUpdate: function () {
    if (storage.get('disabledHNR') === '1') {
      return;
    }
    var modal = this.props.modal;
    if (!modal.isTreeView || !this.visibleList || this.startIndex == null) {
      return;
    }
    var curNewIdList = dataCenter.curNewIdList;
    if (!curNewIdList || !curNewIdList.length) {
      return;
    }
    dataCenter.curNewIdList = null;
    var leafMap = {};
    var visibleMap = {};
    var list = this.visibleList;
    var lightList = [];
    var visibleLeafMap = {};
    var item;
    for (var i = this.startIndex; i <= this.endIndex; i++) {
      item = list[i];
      if (item) {
        if (!item.parent) {
          $.extend(leafMap, item.map);
          visibleMap[item.path] = 1;
        } else if (!item.data) {
          visibleMap[item.path] = 1;
        } else if (isVisibleInTree(item)) {
          visibleLeafMap[item.data.id] = 1;
          if (curNewIdList.indexOf(item.data.id) !== -1) {
            lightList.push(item);
          }
        }
      }
    }
    var overflow = dataCenter.overflowCount();
    if (overflow > 0) {
      var hasChanged;
      var allList = modal.list;
      var len = allList.length;
      for (i = 0; i < len; i++) {
        item = allList[i];
        if (
          item.hide ||
          (!item.active && !visibleLeafMap[item.id] && !leafMap[item.id])
        ) {
          allList.splice(i, 1);
          --overflow;
          --i;
          --len;
          hasChanged = true;
          if (overflow <= 0) {
            break;
          }
        }
      }
      if (overflow > 0) {
        len = allList.length;
        for (i = 0; i < len; i++) {
          item = allList[i];
          if (!item.active && !visibleLeafMap[item.id]) {
            allList.splice(i, 1);
            --overflow;
            --i;
            --len;
            hasChanged = true;
            if (overflow <= 0) {
              break;
            }
          }
        }
      }
      if (hasChanged) {
        modal.updateTree();
        events.trigger('updateGlobal');
      }
    }
    curNewIdList.forEach(function (id) {
      var newItem = leafMap[id];
      if (newItem) {
        var parent = newItem.parent;
        while (parent) {
          if (visibleMap[parent.path]) {
            visibleMap[parent.path] = 0;
            lightList.push(parent);
          }
          if (lightList.indexOf(newItem) === -1 && isVisibleInTree(newItem)) {
            lightList.push(newItem);
          }
          parent = parent.parent;
        }
      }
    });
    var overCount = Math.floor((lightList.length - 60) / 2);
    if (overCount > 0) {
      lightList = lightList.slice(overCount, -overCount);
    }
    lightList = lightList
      .map(function (item) {
        var elem;
        if (item.data) {
          elem = $('tr[data-id="' + item.data.id + '"]:not(.highlight)');
        } else {
          elem = $('tr[data-tree="' + item.path + '"]:not(.highlight)');
        }
        if (elem.length) {
          return elem.addClass('highlight');
        }
      })
      .filter(util.noop);
    if (lightList.length) {
      setTimeout(function () {
        lightList.forEach(removeLighhight);
      }, 800);
    }
  },
  componentDidMount: function () {
    var self = this;
    var timer;
    events.on('hashFilterChange', function () {
      self.setState({});
    });
    events.on('onColumnsChanged', function () {
      self.setState({ columns: settings.getSelectedColumns() });
    });
    events.on('onColumnTitleChange', function () {
      self.setState({});
    });
    events.on('changeRecordState', function (_, type) {
      self.setState({ record: type }, self.updateList);
    });
    events.on('selectedIndex', function (_, index) {
      var list = self.props.modal.getList();
      var item = list && (list[index] || list[list.length - 1]);
      item && self.triggerActiveItem(item);
    });
    events.on('replayTreeView', function (_, dataId, count) {
      var item = self.props.modal.getTreeNode(dataId);
      var parent = item && item.parent;
      if (!parent) {
        return;
      }
      var list = parent.children.filter(isVisibleInTree);
      item = list[list.length - 1];
      item && self.scrollToRow(item, count);
    });
    var update = function () {
      self.setState({});
    };
    var render = function () {
      timer && clearTimeout(timer);
      timer = setTimeout(update, 60);
    };
    self.container = $(ReactDOM.findDOMNode(self.refs.container));
    self.content = ReactDOM.findDOMNode(self.refs.content);
    self.$content = $(self.content)
      .on('dblclick', 'tr', function (e) {
        events.trigger('toggleDetailTab');
      })
      .on('click', 'tr', function (e) {
        var id = this.getAttribute('data-id');
        if (id) {
          dataCenter.lastSelectedDataId = id;
          var item = self.props.modal.getItem(id);
          self.onClick(e, item);
        }
      });
    var toggleDraggable = function (e) {
      var draggable = !e.shiftKey;
      if (self.state.draggable === draggable) {
        return;
      }
      self.setState({ draggable: draggable });
    };
    self.container
      .on('keydown', function (e) {
        var modal = self.props.modal;
        toggleDraggable(e);
        var item;
        if (e.keyCode == 38) {
          //up
          item = modal.prev();
        } else if (e.keyCode == 40) {
          //down
          item = modal.next();
        }

        if (item) {
          self.onClick(e, item, true);
          e.preventDefault();
        }
      })
      .on('scroll', render)
      .on('keyup', toggleDraggable)
      .on('mouseover', toggleDraggable)
      .on('mouseleave', toggleDraggable);

    $(window).on('resize', render);
    events.on('ensureSelectedItemVisible', function () {
      var modal = self.props.modal;
      var selected = self.props.modal.getSelectedList()[0];
      if (selected && modal.isTreeView) {
        selected = modal.getTreeNode(selected.id);
      }
      if (selected) {
        self.scrollToRow(selected);
      } else {
        self.scrollToRow(0);
      }
    });
    events.on('focusNetworkList', function () {
      self.container.focus();
    });
    var wrapper = ReactDOM.findDOMNode(self.refs.wrapper);
    var updateTimer;
    var updateUI = function () {
      updateTimer = null;
      self.setState({ columns: settings.getSelectedColumns() });
    };
    util.addDragEvent('.w-header-drag-block', function (_, x) {
      self.minWidth = wrapper.offsetWidth + x;
      settings.setMinWidth(self.minWidth);
      updateTimer = updateTimer || setTimeout(updateUI, 50);
    });
    var curRemoteUrl;
    var importRemoteUrl = function () {
      var hash = location.hash.substring(1);
      var index = hash.indexOf('?');
      if (index === -1) {
        return;
      }
      var sessionsUrl = util.parseQueryString(
        hash.substring(index + 1),
        null,
        null,
        decodeURIComponent
      ).sessionsUrl;
      if (
        !/^https?:\/\/[^/]/i.test(sessionsUrl) ||
        sessionsUrl === curRemoteUrl
      ) {
        return;
      }
      curRemoteUrl = sessionsUrl.replace(/#.*$/, '');
      var url = curRemoteUrl;
      if (curRemoteUrl.indexOf('&from_5b6af7b9884e1165') === -1) {
        url += (url.indexOf('?') === -1 ? '?' : '') + '&from_5b6af7b9884e1165';
      }
      events.trigger('importSessionsFromUrl', url);
    };
    importRemoteUrl();
    $(window).on('hashchange', importRemoteUrl);
  },
  onDragStart: function (e) {
    var target = $(e.target).closest('.w-req-data-item');
    var dataId = target.attr('data-id');
    if (dataId) {
      events.trigger('showMaskIframe');
      e.dataTransfer.setData('reqDataId', dataId);
    }
  },
  getSelectedRows: function (item) {
    var active = this.props.modal.getActive();
    if (!active || item === active) {
      return;
    }
    return [active, item];
  },
  onClick: function (e, item, hm) {
    if (!item) {
      return;
    }
    var self = this;
    var modal = self.props.modal;
    var rows;
    var allowMultiSelect = e.ctrlKey || e.metaKey;
    if (hm) {
      self.clearSelection();
      this.$content.find('tr.w-selected').removeClass('w-selected');
      item.selected = true;
      self.setSelected(item);
    } else if (e.shiftKey && (rows = self.getSelectedRows(item))) {
      this.$content.find('tr.w-selected').removeClass('w-selected');
      modal.setSelectedList(rows[0], rows[1], self.setSelected);
    } else {
      if (!allowMultiSelect) {
        this.$content.find('tr.w-selected').removeClass('w-selected');
        self.clearSelection();
      }
      item.selected = !allowMultiSelect || !item.selected;
      self.setSelected(item, true);
    }

    modal.clearActive();
    item.active = item.selected;
    hm && self.scrollToRow(item);
    events.trigger('networkStateChange');
    events.trigger('selectedSessionChange', item);
  },
  setSelected: function (item, unselect) {
    if (item.selected) {
      this.$content.find('tr[data-id=' + item.id + ']').addClass('w-selected');
    } else if (unselect) {
      this.$content
        .find('tr[data-id=' + item.id + ']')
        .removeClass('w-selected');
    }
  },
  clearSelection: function () {
    this.props.modal.clearSelection();
  },
  getFilterList: function () {
    var settings = dataCenter.getFilterText();
    if (settings.disabledExcludeText) {
      return [];
    }
    return settings.excludeText.trim().split(/\s+/g);
  },
  updateFilter: function (str) {
    var settings = dataCenter.getFilterText();
    settings.excludeText = str;
    settings.disabledExcludeText = false;
    dataCenter.setFilterText(settings);
    events.trigger('filterChanged');
  },
  getActiveList: function (curItem) {
    if (!curItem.selected) {
      return [curItem];
    }
    return this.props.modal.getSelectedList();
  },
  removeAllSuchHost: function (item, justRemove) {
    var hostList = [];
    var list = this.getActiveList(item);
    list.forEach(function (item) {
      var host = item.isHttps ? item.path : item.hostname;
      if (hostList.indexOf(host) === -1) {
        hostList.push(host);
      }
    });
    this.props.modal.removeByHostList(hostList);
    if (!justRemove) {
      var filterList = this.getFilterList();
      hostList.forEach(function (host) {
        host = 'H:' + host;
        if (filterList.indexOf(host) === -1) {
          filterList.unshift(host);
        }
      });
      this.updateFilter(filterList.join('\n'));
    }
    events.trigger('updateGlobal');
  },
  removeTreeNode: function (treeId, others) {
    if (this.props.modal.removeTreeNode(treeId, others)) {
      events.trigger('updateGlobal');
    }
  },
  removeAllSuchURL: function (item, justRemove) {
    var urlList = [];
    var list = this.getActiveList(item);
    list.forEach(function (item) {
      var url = item.isHttps
        ? item.path
        : item.url.replace(/\?.*$/, '').substring(0, 1024);
      if (urlList.indexOf(url) === -1) {
        urlList.push(url);
      }
    });
    this.props.modal.removeByUrlList(urlList);
    if (!justRemove) {
      var filterList = this.getFilterList();
      urlList.forEach(function (url) {
        if (filterList.indexOf(url) === -1) {
          filterList.unshift(url);
        }
      });
      this.updateFilter(filterList.join('\n'));
    }
    events.trigger('updateGlobal');
  },
  triggerActiveItem: function (item) {
    this.onClick('', item, true);
    events.trigger('networkStateChange');
  },
  onClickContextMenu: function (action, e, parentAction, name) {
    var self = this;
    var item = self.currentFocusItem;
    var modal = self.props.modal;
    var treeId = self.treeTarget;
    var curUrl = (item && item.url) || (treeId && treeId + '/');
    self.currentFocusItem = null;
    switch (parentAction || action) {
    case 'New Tab':
      curUrl && window.open(curUrl);
      break;
    case 'QR Code':
      self.refs.qrcodeDialog.show(curUrl);
      break;
    case 'Preview':
      util.openPreview(item);
      break;
    case 'Source':
      util.openEditor(JSON.stringify(item, null, '  '));
      break;
    case 'toggleView':
      events.trigger('switchTreeView');
      break;
    case 'Overview':
      self.triggerActiveItem(item);
      events.trigger('showOverview');
      break;
    case 'Inspectors':
      self.triggerActiveItem(item);
      events.trigger('showInspectors');
      break;
    case 'Timeline':
      self.triggerActiveItem(item);
      events.trigger('showTimeline');
      break;
    case 'Composer':
    case 'Compose':
      events.trigger('composer', item);
      break;
    case 'Mark':
    case 'Unmark':
      var list = getFocusItemList(item) || (modal && modal.getSelectedList());
      if (list) {
        var isMark = action === 'Mark';
        list.forEach(function (item) {
          item.mark = isMark;
        });
      }
      this.setState({});
      break;
    case 'Replay':
      events.trigger('replaySessions', [item, e.shiftKey]);
      break;
    case 'replayTimes':
      events.trigger('replaySessions', [item, true]);
      break;
    case 'Export':
      if (self.treeTarget && !self.isTreeLeafNode) {
        events.trigger('exportSessions', [
          modal.getListByPath(self.treeTarget)
        ]);
      } else {
        events.trigger('exportSessions', item);
      }
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
      var reqLine = [
        req.method,
        req.method == 'CONNECT' ? req.headers.host : util.getPath(realUrl),
        'HTTP/' + (req.httpVersion || '1.1')
      ].join(' ');
      events.trigger('showFilenameInput', {
        title: 'Set the filename of request raw data',
        headers:
            reqLine +
            '\r\n' +
            util.objectToString(req.headers, req.rawHeaderNames, true),
        base64: req.base64,
        name: getFilename(item, 'req_raw')
      });
      break;
    case 'Res Raw':
      var res = item.res;
      var statusLine = [
        'HTTP/' + (item.req.httpVersion || '1.1'),
        res.statusCode,
        util.getStatusMessage(res)
      ].join(' ');
      events.trigger('showFilenameInput', {
        title: 'Set the filename of response raw data',
        headers:
            statusLine +
            '\r\n' +
            util.objectToString(res.headers, res.rawHeaderNames, true),
        base64: item.res.base64,
        name: getFilename(item, 'res_raw')
      });
      break;
    case 'Import':
      events.trigger('importSessions', e);
      break;
    case 'Edit':
      events.trigger('filterSessions', e);
      break;
    case 'removeAllSuchHost':
      curUrl && self.removeAllSuchHost(item, true);
      break;
    case 'removeAllSuchURL':
      curUrl && self.removeAllSuchURL(item || curUrl, true);
      break;
    case 'excludeHost':
      curUrl && self.removeAllSuchHost(item);
      break;
    case 'excludeUrl':
      curUrl && self.removeAllSuchURL(item || curUrl);
      break;
    case 'This':
      if (treeId) {
        self.removeTreeNode(treeId);
      } else {
        events.trigger('removeIt', item);
      }
      break;
    case 'All':
      events.trigger('clearAll');
      break;
    case 'Others':
      if (treeId) {
        self.removeTreeNode(treeId, true);
      } else {
        events.trigger('removeOthers', item);
      }
      break;
    case 'Selected':
      events.trigger('removeSelected');
      break;
    case 'Unselected':
      events.trigger('removeUnselected');
      break;
    case 'Unmarked':
      events.trigger('removeUnmarked');
      break;
    case 'Help':
      window.open('https://avwo.github.io/whistle/webui/network.html');
      break;
    case 'Plugins':
      iframes.fork(action, {
        port: dataCenter.getPort(),
        type: 'network',
        name: name,
        activeItem: item,
        selectedList: self.props.modal.getSelectedList()
      });
      break;
    case 'Expand':
    case 'Collapse':
      self.toggleNode(treeId);
      break;
    case 'Expand All':
      self.expandAll(treeId);
      break;
    case 'Collapse All':
      self.collapseAll(treeId);
      break;
    }
  },
  onContextMenu: function (e) {
    var el = $(e.target).closest('.w-req-data-item');
    var dataId = el.attr('data-id');
    var treeId = el.attr('data-tree');
    var modal = this.props.modal;
    var item = modal.getItem(dataId);
    var disabled = !item;
    var treeNodeData = modal.isTreeView && modal.getTreeNode(treeId);
    this.treeTarget = null;
    e.preventDefault();
    this.currentFocusItem = item;
    var clickBlank = disabled && !treeNodeData;
    var list0 = contextMenuList[0].list;
    list0[4].disabled = clickBlank || !/^https?:\/\//.test(treeId || item.url);
    if (disabled || clickBlank) {
      list0[6].disabled = true;
    } else {
      var type = util.getContentType(item.res.headers);
      list0[6].disabled =
        !item.res.base64 || (type !== 'HTML' && type !== 'IMG');
    }
    list0[0].disabled = disabled;
    list0[1].disabled = disabled;
    list0[2].disabled = disabled;
    list0[3].disabled = disabled;
    list0[5].disabled = clickBlank;
    list0[7].disabled = disabled;
    if (modal.isTreeView) {
      list0[8].name = 'List View';
    } else {
      list0[8].name = 'Tree View';
    }
    contextMenuList[1].disabled = disabled && !treeId;
    var treeUrl = treeId ? treeId + '/' : '';
    var isTreeNode = disabled && !treeUrl;
    contextMenuList[1].list.forEach(function (menu) {
      menu.disabled = disabled;
      switch (menu.name) {
      case 'URL':
        menu.copyText = util.getUrl(
            (item && item.url.replace(/[?#].*$/, '')) || treeUrl
          );
        menu.disabled = isTreeNode;
        break;
      case 'Host':
        menu.copyText =
            (item && (item.isHttps ? item.path : item.hostname)) ||
            util.getHost(treeUrl);
        menu.disabled = isTreeNode;
        break;
      case 'Path':
        menu.copyText = (item && item.path) || util.getPath(treeUrl);
        menu.disabled = isTreeNode;
        break;
      case 'Full URL':
        menu.copyText = util.getUrl((item && item.url) || treeUrl);
        menu.disabled = isTreeNode;
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
        menu.copyText =
            item &&
            util.objectToString(item.req.rawHeaders || item.req.headers);
        menu.disabled = !menu.copyText;
        break;
      case 'Res Headers':
        menu.copyText =
            item &&
            util.objectToString(item.res.rawHeaders || item.res.headers);
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
    list3[1].disabled = clickBlank;
    list3[2].disabled = disabled || selectedCount === hasData;
    list3[3].disabled = !selectedCount;
    list3[4].disabled = selectedCount === hasData;
    list3[5].disabled = !modal.hasUnmarked();
    list3[6].disabled = clickBlank;
    list3[7].disabled = clickBlank;

    var list4 = contextMenuList[4].list;
    list4[1].disabled = clickBlank;
    list4[2].disabled = clickBlank;

    contextMenuList[5].disabled = disabled;
    var list5 = contextMenuList[5].list;
    if (item) {
      list5[3].disabled = false;
      if (item.selected) {
        list5[4].disabled = true;
        list5[5].disabled = true;
        selectedList.forEach(function (selectedItem) {
          if (selectedItem.mark) {
            list5[5].disabled = false;
          } else {
            list5[4].disabled = false;
          }
        });
      } else {
        var unmark = !item.mark;
        list5[4].disabled = !unmark;
        list5[5].disabled = unmark;
      }
      if (item.selected) {
        var len = selectedList.length;
        list5[0].disabled = !selectedList.filter(util.canAbort).length;
        list5[1].disabled = !len;
        list5[2].disabled = !len || len > 1;
      } else {
        list5[0].disabled = !util.canAbort(item);
        list5[1].disabled = false;
        list5[2].disabled = false;
      }
    } else {
      list5[0].disabled = true;
      list5[1].disabled = true;
      list5[2].disabled = true;
      list5[3].disabled = true;
      list5[4].disabled = true;
    }
    var treeItem = contextMenuList[6];
    var treeList = treeItem.list;
    treeItem.hide = !modal.isTreeView;
    treeItem.disabled = !treeNodeData && !hasData;
    if (treeNodeData) {
      var isLeaf = treeNodeData.data;
      var expand = treeNodeData.expand;

      this.treeTarget = treeId;
      this.isTreeLeafNode = isLeaf;
      treeList[0].disabled = expand || isLeaf;
      treeList[1].disabled = !expand || isLeaf;
      treeList[2].disabled = isLeaf;
      treeList[3].disabled = isLeaf;
      var count = (treeNodeData.parent || modal.root).children.length;
      list3[2].disabled = count <= 1;
    } else if (modal.isTreeView) {
      treeList[0].disabled = true;
      treeList[1].disabled = true;
      treeList[2].disabled = !hasData;
      treeList[3].disabled = !hasData;
    }
    var pluginItem = contextMenuList[9];
    pluginItem.disabled = disabled && !selectedCount;
    util.addPluginMenus(
      pluginItem,
      dataCenter.getNetworkMenus(),
      treeItem.hide ? 8 : 9,
      disabled
    );
    var height = (treeItem.hide ? 310 : 340) - (pluginItem.hide ? 30 : 0);
    pluginItem.maxHeight = height;
    var data = util.getMenuPosition(e, 110, height);
    data.list = contextMenuList;
    data.className = data.marginRight < 360 ? 'w-ctx-menu-left' : '';
    this.refs.contextMenu.show(data);
  },
  updateList: function () {
    this.refs.content.refs.list.forceUpdateGrid();
  },
  onFilterChange: function (keyword) {
    var self = this;
    self.props.modal.search(keyword);
    clearTimeout(self.networkStateChangeTimer);
    self.networkStateChangeTimer = setTimeout(function () {
      self.setState({ filterText: keyword }, self.updateList);
      events.trigger('networkStateChange');
    }, 600);
  },
  onFilterKeyDown: function (e) {
    if (e.keyCode !== 13 || !CMD_RE.test(e.target.value)) {
      return;
    }
    dataCenter.setDumpCount(parseInt(RegExp.$1, 10));
    this.props.modal.clear();
    this.refs.filterInput.clearFilterText();
  },
  autoRefresh: function () {
    if (this.container) {
      this.container.find(
        '.ReactVirtualized__Grid:first'
      ).scrollTop = 100000000;
    }
  },
  orderBy: function (e) {
    var target = this.willResort && $(e.target).closest('th')[0];
    if (!target) {
      return;
    }
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

    var sortColumns = [];
    Object.keys(columnState).forEach(function (name) {
      if ((order = columnState[name])) {
        sortColumns.push({
          name: name,
          order: order
        });
      }
    });
    this.props.modal.setSortColumns(sortColumns);
    this.setState({});
  },
  onColumnsResort: function () {
    this.setState({ columns: settings.getSelectedColumns() });
  },
  onMouseDown: function (e) {
    this.willResort = e.target.className !== 'w-header-drag-block';
  },
  onReplay: function (e) {
    if (!e.metaKey && !e.ctrlKey) {
      return;
    }
    if (e.keyCode === 82) {
      events.trigger('replaySessions', [null, e.shiftKey]);
    } else if (e.keyCode === 65) {
      e.preventDefault();
      events.trigger('abortRequest');
    } else if (e.keyCode === 69) {
      e.preventDefault();
      events.trigger('composer');
    }
  },
  renderColumn: function (col, i) {
    var name = col.name;
    var style = getColStyle(col);
    if (columnState[name]) {
      style.color = '#337ab7';
    }
    var title;
    if (name === 'custom1' || name === 'custom2') {
      title = dataCenter[name];
    } else {
      title = col.title;
    }
    return (
      <th
        onMouseDown={this.onMouseDown}
        {...this.state.dragger}
        data-name={name}
        draggable={true}
        key={name}
        className={col.className}
        style={style}
      >
        {name === 'path' ? (
          <div
            onDragStart={stopPropagation}
            draggable={true}
            className="w-header-drag-block"
          />
        ) : undefined}
        {title}
        <Spinner order={columnState[name]} />
      </th>
    );
  },
  scrollToRow: function (target, count) {
    if (target && (target.id || (target.data && target.data.id))) {
      var index = this.getVisibleList().indexOf(target);
      if (index === -1) {
        return;
      }
      target = index + (count > 0 ? count : 0);
    }
    try {
      this.refs.content.refs.list.scrollToRow(target);
    } catch (e) {}
    this.container.focus();
  },
  getTreeNode: function (e) {
    var modal = this.props.modal;
    if (typeof e === 'string') {
      return modal.getTreeNode(e);
    }
    var elem = $(e.target).closest('.w-req-data-item');
    return modal.getTreeNode(elem.attr('data-tree'));
  },
  toggleNode: function (e) {
    var node = this.getTreeNode(e);
    if (node) {
      if (node.expand) {
        util.collapse(node);
      } else {
        util.expand(node);
      }
      this.setState({});
    }
  },
  expandAll: function (e) {
    if (!e) {
      var root = this.props.modal.getTree();
      root.children.forEach(util.expandAll);
      return this.setState({});
    }
    var node = this.getTreeNode(e);
    if (node) {
      util.expandAll(node);
      this.setState({});
    }
  },
  collapseAll: function (e) {
    if (!e) {
      var root = this.props.modal.getTree();
      root.children.forEach(util.collapseAll);
      return this.setState({});
    }
    var node = this.getTreeNode(e);
    if (node) {
      util.collapseAll(node);
      this.setState({});
    }
  },
  renderTreeNode: function (item, options) {
    var draggable = this.state.draggable;
    var style = options.style;
    var leaf = item.data;
    var className = leaf ? getClassName(leaf) : '';
    var value = item.value;
    style.marginLeft = item.depth * 32;
    return (
      <tr
        key={leaf ? leaf.id : item.path}
        style={style}
        className={`w-req-data-item tree-node ${
          leaf ? 'tree-leaf' : ''
        } ${className}`}
        data-id={leaf && leaf.id}
        data-tree={item.path}
        draggable={leaf && draggable}
        onClick={leaf ? null : this.toggleNode}
        title={leaf ? util.getUrl(leaf.url) : value}
        onKeyDown={function () {}}
      >
        {leaf ? (
          getIcon(leaf, className)
        ) : (
          <span
            className={`icon-fold glyphicon glyphicon-triangle-${
              item.expand ? 'bottom' : 'right'
            }`}
          ></span>
        )}
        {value.length > 320 ? value.substring(0, 320) + '...' : value}
      </tr>
    );
  },
  enableRecord: function () {
    events.trigger('enableRecord');
  },
  getVisibleList: function () {
    var modal = this.props.modal;
    return modal.isTreeView
      ? modal.getTree().list.filter(isVisibleInTree)
      : modal.getList().filter(isVisible);
  },
  render: function () {
    var self = this;
    var state = this.state;
    var modal = self.props.modal;
    var isTreeView = modal.isTreeView;
    var list = this.getVisibleList();
    var hasKeyword = modal.hasKeyword();
    var draggable = state.draggable;
    var columnList = state.columns.list;
    var width = state.columns.width;
    var colStyle = state.columns.style;
    var filterText = (state.filterText || '').trim();
    var minWidth = settings.getMinWidth();
    var record = state.record;
    if (minWidth && minWidth > width) {
      width = minWidth;
      colStyle.minWidth = width;
    }
    self.startIndex = null;
    self.endIndex = null;
    self.visibleList = list;

    return (
      <div className="fill w-req-data-con orient-vertical-box">
        <div
          ref="wrapper"
          className="w-req-data-content fill orient-vertical-box"
          style={colStyle}
        >
          {record ? (
            <div className="w-record-status">
              {record === 'stop' ? 'Recording stopped' : 'Recording paused'}
              <button className="btn btn-primary" onClick={self.enableRecord}>
                Enable
              </button>
            </div>
          ) : null}
          <div className={'w-req-data-headers' + (isTreeView ? ' hide' : '')}>
            <table className="table">
              <thead>
                <tr onClick={self.orderBy}>
                  <th className="order">#</th>
                  {columnList.map(self.renderColumn)}
                </tr>
              </thead>
            </table>
          </div>
          <div
            ref="container"
            tabIndex="0"
            onContextMenu={self.onContextMenu}
            onKeyDown={self.onReplay}
            style={{
              background:
                dataCenter.hashFilterObj || filterText
                  ? 'lightyellow'
                  : undefined
            }}
            className={
              'w-req-data-list fill' + (isTreeView ? ' w-tree-view-list' : '')
            }
            onDragStart={self.onDragStart}
          >
            <RV.AutoSizer ref="content">
              {function (size) {
                return (
                  <RV.List
                    ref="list"
                    rowHeight={isTreeView ? TREE_ROW_HEIGHT : 28}
                    width={size.width}
                    height={size.height}
                    rowCount={list.length}
                    rowRenderer={function (options) {
                      var index = options.index;
                      var item = list[index];
                      if (isTreeView) {
                        if (self.startIndex == null) {
                          self.startIndex = index;
                        }
                        self.endIndex = index;
                        return self.renderTreeNode(item, options);
                      }
                      var order = hasKeyword ? index + 1 : item.order;
                      return (
                        <Row
                          style={options.style}
                          key={options.key}
                          order={order}
                          columnList={columnList}
                          draggable={draggable}
                          item={item}
                        />
                      );
                    }}
                  />
                );
              }}
            </RV.AutoSizer>
          </div>
        </div>
        <FilterInput
          ref="filterInput"
          onKeyDown={this.onFilterKeyDown}
          onChange={this.onFilterChange}
          wStyle={colStyle}
          hintKey="networkHintList"
        />
        <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
        <QRCodeDialog ref="qrcodeDialog" />
      </div>
    );
  }
});

module.exports = ReqData;
