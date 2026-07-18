require('../css/req-data.css');
require('react-virtualized/styles.css');

var RV = require('react-virtualized/dist/umd/react-virtualized');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var $ = require('jquery');
var QRCodeDialog = require('./qrcode-dialog');
var util = require('./util');
var settings = require('./columns');
var FilterInput = require('./filter-input');
var ContextMenu = require('./context-menu');
var iframes = require('./iframes');
var dataCenter = require('./data-center');
var storage = require('./storage');
var message = require('./message');
var Icon = require('./icon');
var BackToBottomBtn = require('./back-to-bottom-btn');
var Dialog = require('./dialog');
var DismissBtn = require('./dismiss-btn');

var trigger = util.trigger;
var addEvent = util.on;
var preventBlur = util.preventBlur;
var getHide = util.getHide;
var TREE_ROW_HEIGHT = 24;
var ROW_STYLE = { outline: 'none' };
var columnState = {};
var columnKeys = {};
var CMD_RE = /^:dump\s+(\d{1,15})\s*$/;
var BODY_FILTER = /(^\s*|\s+)(content|c|b|body):/i;
var BASE_DOM = '.ReactVirtualized__Grid:first';
var MAX_LEN = 64;
var KV_TIPS = util.KV_TIPS;
var HINTS = [
  '<' + KV_TIPS + 'URL>',
  'd:<' + KV_TIPS + 'domain>',
  'm:<' + KV_TIPS + 'HTTP method>',
  's:<' + KV_TIPS + 'HTTP status code>',
  'h:<' + KV_TIPS + 'request or response headers>',
  'b:<' + KV_TIPS + 'request or response body>'
];
var contextMenuList = [
  {
    name: 'Actions',
    list: [
      { name: 'Abort' },
      { name: 'Replay' },
      { name: 'Replay Times', action: 'replayTimes' },
      { name: 'Edit Request' },
      { name: 'Mark' },
      { name: 'Unmark' },
      { name: 'Test Rules' }
    ].concat(util.NETWORK_ACTIONS)
  },
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
      { name: 'Cell Text' },
      { name: 'URL (+Query)' },
      { name: 'URL (-Query)' },
      { name: 'As cURL' },
      { name: 'Client IP' },
      { name: 'Server IP' },
      { name: 'Cookie' },
      { name: 'Raw Request' },
      { name: 'Raw Response' }
    ]
  },
  {
    name: 'Remove',
    list: [
      { name: 'All' },
      { name: 'One' },
      { name: 'Others' },
      { name: 'Selected' },
      { name: 'Unselected' },
      { name: 'Unmarked' },
      { name: 'All Matching Hosts', action: 'removeAllSuchHost' },
      { name: 'All Matching URLs', action: 'removeAllSuchURL' }
    ]
  },
  {
    name: '+Rule',
    list: [
      { name: 'Mapping' },
      { name: 'Network' },
      { name: 'Request' },
      { name: 'Response' },
      { name: 'Debug' }
    ]
  },
  {
    name: 'Tree',
    list: [
      { name: 'Expand' },
      { name: 'Collapse' },
      { name: 'Expand All' },
      { name: 'Collapse All' },
      { name: 'List View', action: 'toggleView' }
    ]
  },
  {
    name: 'Settings',
    list: [
      { name: 'Edit Settings' },
      { name: 'Exclude All Matching Hosts', action: 'excludeHost' },
      { name: 'Exclude All Matching URLs', action: 'excludeUrl' }
    ]
  },
  { name: 'Save' },
  { name: 'Import' },
  { name: 'Export' },
  {
    name: 'Others',
    action: 'Plugins',
    list: []
  },
  { name: 'Help', sep: true }
];

var getCellText = function (target) {
  return ((target.attr('data-custom') ? target.attr('title') : target.text()) || '').trim();
};

var preventInputBlur = function (e) {
  e.target.nodeName != 'INPUT' && preventBlur(e);
};

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
    order = order ? ' spinner-' + order : '';
    return (
      <div className="w-spinner">
        <Icon name="triangle-top" className={order} />
        <Icon name="triangle-bottom" className={order} />
      </div>
    );
  }
});

function getColStyle(col, style) {
  style = style ? $.extend({}, style) : {};
  style[col.minWidth ? 'minWidth' : 'width'] = settings.getWidth(col);
  return style;
}

function getRuleStyle(data) {
  var rules = data.rules;
  if (!rules) {
    return '';
  }
  var rule = rules.rule;
  if (rule && (rule.isLoc || rule.isSpec)) {
    return ' w-has-local';
  }
  return data[dataCenter.HAS_RULES_KEY] ? ' w-has-rules' : '';
}

function getClassName(data) {
  return (
    getStatusClass(data) +
    ' w-req-data-item' +
    (data.isHttps ? ' w-tunnel' : '') +
    getRuleStyle(data) +
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
  if (data.reqError || data.resError || (data.customData && data.customData.error)) {
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

var END_RE = /:\/(.+)\/([miud]{0,4})$/;
var cacheKeys = {};

function getValue(item, key, name) {
  var regex;
  var decode;
  var index = key.indexOf(':/');
  var hasRegex = index !== -1 && END_RE.test(key);
  if (hasRegex) {
    var cache = cacheKeys[key];
    if (cache && cache.rawKey === key) {
      key = cache.key;
      regex = cache.regex;
      decode = cache.decode;
    } else {
      var pattern = RegExp.$1;
      var flags = RegExp.$2 || '';
      if (flags.indexOf('d') !== -1) {
        decode = true;
        flags = flags.split('d').join('');
      }
      try {
        regex = new RegExp(pattern, flags);
      } catch (e) {}
      cache = { rawKey: key, regex: regex, decode: decode };
      key = key.substring(0, index);
      cache.key = key;
      cacheKeys[key] = cache;
    }
  }
  var value;
  if (key === 'req.body') {
    value = util.isText(item.req.headers) ? util.getBody(item.req, true) : '';
  } else if (key === 'res.body') {
    value = util.isText(item.res.headers) ? util.getBody(item.res) : '';
  } else {
    value = util.getValue(item, key);
  }
  if (!value || !hasRegex) {
    return value;
  }
  if (!regex || !regex.test(value)) {
    return '';
  }
  value = RegExp.$1;
  if (value && decode) {
    try {
      value = decodeURIComponent(value);
    } catch (e) {}
  }
  return value;
}

function getIcon(data, className) {
  var name;
  if (className.indexOf('danger') !== -1) {
    name = 'remove-circle';
  } else if (className.indexOf('w-forbidden') !== -1) {
    name = 'ban-circle';
  } else if (data && !data.endTime && !data.lost) {
    name = 'hourglass';
  }
  if (name) {
    return <Icon name={name} className="icon-leaf" />;
  }
  var type = getType(className);
  var status = data.res && data.res.statusCode;
  if (type !== 'ERROR' && status != 101) {
    status = null;
  }
  return status || type ? <span className="w-type-icon">{status || type }</span> : <Icon name="file" />;
}

function removeHighlight(elem) {
  elem.removeClass('highlight');
}

var Row = React.createClass({
  render: function () {
    var p = this.props;
    var order = p.order;
    var notQuery = p.notQuery;
    var draggable = p.draggable;
    var columnList = p.columnList;
    var item = p.item;
    var style = item.style;

    return (
      <table className="table w-req-table" key={p.key} style={p.style} data-id={item.id}>
        <tbody className="w-hover-body">
          <tr
            tabIndex="-1"
            draggable={draggable}
            data-id={item.id}
            className={getClassName(item) + (item.highlight ? ' w-highlight' : '')}
            style={ROW_STYLE}
          >
            <th className="order" scope="row" style={style}>
              {order}
              {item.importedData ? <Icon name="import" /> : null}
              {item.fc && !item.importedData ? <Icon name={item.testId ? 'text-size' : 'send'} /> : null}
            </th>
            {columnList.map(function (col) {
              var name = col.name;
              var value;
              var url;
              var isCustom;
              if (name === 'custom1') {
                var key1 = dataCenter.custom1Key;
                if (util.notEStr(key1)) {
                  isCustom = true;
                  item.custom1 = getValue(item, key1, name);
                }
              } else if (name === 'custom2') {
                var key2 = dataCenter.custom2Key;
                if (util.notEStr(key2)) {
                  isCustom = true;
                  item.custom2 = getValue(item, key2, name);
                }
              } else if (name === 'path') {
                value = item.shortPath;
                url = item.url;
              }
              value = value || util.getCellValue(item, col);
              if (value && notQuery && name === 'path') {
                var index = value.indexOf('?');
                if (index !== -1) {
                  value = value.substring(0, index);
                }
              }
              var colStyle = getColStyle(col, style);
              var icon = col.iconKey && util.getProperty(item, col.iconKey);

              return (
                <td
                  key={name}
                  className={col.className}
                  style={colStyle}
                  data-custom={isCustom ? 1 : null}
                  title={col.showTitle ? (url || value) : null}
                >
                  {util.isFunc(col.getIcon) ? col.getIcon(item) : null}
                  {icon ? <img className="w-cell-img" src={icon} /> : null}
                  {isCustom && value && value.length > 1690 ? value.substring(0, 1680) + '...' : value}
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
      dragger: dragger,
      sessionsName: ''
    };
  },
  componentDidUpdate: function () {
    var self = this;
    self.isShownBtn && trigger('checkAtBottom');
    if (storage.get('disabledHNR') === '1') {
      return;
    }
    var modal = self.props.modal;
    if (!modal.isTreeView || !self.visibleList || self.startIndex == null) {
      return;
    }
    var curNewIdList = dataCenter.curNewIdList;
    if (!curNewIdList || !curNewIdList.length) {
      return;
    }
    dataCenter.curNewIdList = null;
    var leafMap = {};
    var visibleMap = {};
    var list = self.visibleList;
    var lightList = [];
    var visibleLeafMap = {};
    var item;
    for (var i = self.startIndex; i <= self.endIndex; i++) {
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
        trigger('updateGlobal');
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
        lightList.forEach(removeHighlight);
      }, 800);
    }
  },
  getActivedList: function (item) {
    var modal = this.props.modal;
    return getFocusItemList(item) || (modal && modal.getSelectedList());
  },
  componentDidMount: function () {
    var self = this;
    var timer;
    addEvent('hashFilterChange', function () {
      self.setState({});
    });
    addEvent('onColumnsChanged', function () {
      self.setState({ columns: settings.getSelectedColumns() });
    });
    addEvent('onColumnTitleChange', function () {
      self.setState({});
    });
    addEvent('changeRecordState', function (_, type) {
      self.setState({ record: type }, self.updateList);
    });
    addEvent('selectedIndex', function (_, index) {
      var list = self.props.modal.getList();
      var item = list && (list[index] || list[list.length - 1]);
      item && self.triggerActiveItem(item);
    });
    addEvent('focusNetworkFilterInput', function() {
      self.refs.filterInput.focus();
    });
    addEvent('saveSessions', function (_, item) {
      var list = Array.isArray(item) && item.length ? item : self.getActivedList(item);
      var len = list && list.length;
      if (!len) {
        return;
      }
      self._sessionsList = list;
      self._pendingSave = false;
      self.refs.saveSessions.show();
      setTimeout(function () {
        var input = findDOMNode(self.refs.sessionsName);
        input.focus();
        input.select();
      }, 500);
    });
    addEvent('replayTreeView', function (_, dataId, count) {
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
    self.container = $(findDOMNode(self.refs.container));
    self.content = findDOMNode(self.refs.content);
    var clickedCount = 0;
    self.$content = $(self.content)
      .on('dblclick', 'tr', function (e) {
        if (clickedCount > 2) {
          trigger('toggleDetailTab');
        }
      })
      .on('click', 'tr', function (e) {
        var id = this.getAttribute('data-id');
        if (id) {
          if (dataCenter.lastSelectedDataId != id) {
            clickedCount = 0;
            dataCenter.lastSelectedDataId = id;
          }
          ++clickedCount;
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
          if (e.ctrlKey || e.metaKey) {
            item = modal.start();
          } else {
            item = modal.prev();
          }
        } else if (e.keyCode == 40) {
          //down
          if (e.ctrlKey || e.metaKey) {
            item = modal.end();
          } else {
            item = modal.next();
          }
        }

        if (item) {
          self.onClick(e, item, true);
          preventBlur(e);
        }
      })
      .on('scroll', render)
      .on('keyup', toggleDraggable)
      .on('mouseover', toggleDraggable)
      .on('mouseleave', toggleDraggable);

    $(window).on('resize', render);
    addEvent('ensureSelectedItemVisible', function () {
      var modal = self.props.modal;
      var selected = modal.getSelectedList()[0];
      if (selected && modal.isTreeView) {
        selected = modal.getTreeNode(selected.id);
      }
      if (selected) {
        self.scrollToRow(selected);
      }
    });
    addEvent('focusNetworkList', function () {
      self.container.focus();
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
      trigger('importSessionsFromUrl', url);
    };
    importRemoteUrl();
    $(window).on('hashchange', importRemoteUrl);
    var hideBackBtn = function() {
      if (self.isShownBtn) {
        self.isShownBtn = false;
        self.refs.backBtn.hide();
      }
    };
    self.hideBackBtn = hideBackBtn;
    self.isShownBtn = false;
    addEvent('toggleBackToBottomBtn', function(_, show) {
      if (show) {
        if (!self.isShownBtn) {
          self.isShownBtn = true;
          self.refs.backBtn.show();
        }
      } else {
        hideBackBtn();
      }
    });
    addEvent('checkViewInspectors', function(_, reqId) {
      self._curComposerReqId = reqId && { reqId: reqId };
      reqId && self.props.modal.getItem(reqId) && self.showViewInspectorsBtn(true);
    });
    addEvent('setActiveSession', function(_, reqId) {
      var item = self.props.modal.getItem(reqId);
      item && self.triggerActiveItem(item);
    });
  },
  onDragStart: function (e) {
    var target = $(e.target).closest('.w-req-data-item');
    var dataId = target.attr('data-id');
    if (dataId) {
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
    trigger('networkStateChange');
    trigger('selectedSessionChange', item);
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
    return settings.excludeText.trim().split(/\s+/);
  },
  updateFilter: function (str) {
    var settings = dataCenter.getFilterText();
    settings.excludeText = str;
    settings.disabledExcludeText = false;
    dataCenter.setFilterText(settings);
    trigger('filterChanged');
  },
  getActiveList: function (curItem) {
    if (!curItem.selected) {
      return [curItem];
    }
    return this.props.modal.getSelectedList();
  },
  removeAllSuchHost: function (item, justRemove) {
    var hostList = [];
    var self = this;
    var list = self.getActiveList(item);
    list.forEach(function (item) {
      var host = item.isHttps ? item.path : item.hostname;
      if (hostList.indexOf(host) === -1) {
        hostList.push(host);
      }
    });
    self.props.modal.removeByHostList(hostList);
    if (!justRemove) {
      var filterList = self.getFilterList();
      hostList.forEach(function (host) {
        host = 'H:' + host;
        if (filterList.indexOf(host) === -1) {
          filterList.unshift(host);
        }
      });
      self.updateFilter(filterList.join('\n'));
      trigger('shakeSettings');
    }
    trigger('updateGlobal');
  },
  removeTreeNode: function (treeId, others) {
    if (this.props.modal.removeTreeNode(treeId, others)) {
      trigger('updateGlobal');
    }
  },
  removeAllSuchURL: function (item, justRemove) {
    var urlList = [];
    var self = this;
    var list = self.getActiveList(item);
    list.forEach(function (item) {
      var url = item.isHttps
        ? item.path
        : item.url.replace(/\?.*$/, '').substring(0, 1024);
      if (urlList.indexOf(url) === -1) {
        urlList.push(url);
      }
    });
    self.props.modal.removeByUrlList(urlList);
    if (!justRemove) {
      var filterList = self.getFilterList();
      urlList.forEach(function (url) {
        if (filterList.indexOf(url) === -1) {
          filterList.unshift(url);
        }
      });
      self.updateFilter(filterList.join('\n'));
      trigger('shakeSettings');
    }
    trigger('updateGlobal');
  },
  triggerActiveItem: function (item) {
    this.onClick('', item, true);
    trigger('networkStateChange');
  },
  onClickHeadMenu: function(action) {
    var col = this.curHeadCol;
    if (col) {
      settings.setWidth(col.name, action);
      this.setState({columns: settings.getSelectedColumns()});
    }
  },
  onClickContextMenu: function (action, e, parentAction, name) {
    var self = this;
    var item = self.currentFocusItem;
    var modal = self.props.modal;
    var treeId = self.treeTarget;
    var curUrl = (item && item.url) || (treeId && treeId + '/');
    var getSessions = function () {
      if (treeId && !self.isTreeLeafNode) {
        return [modal.getListByPath(treeId) || item];
      }
      return [item];
    };
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
      util.openEditor(util.stringify(item));
      break;
    case 'toggleView':
      trigger('switchTreeView');
      break;
    case 'Overview':
      self.triggerActiveItem(item);
      trigger('showOverview');
      break;
    case 'Inspectors':
      self.triggerActiveItem(item);
      trigger('showInspectors');
      break;
    case 'Timeline':
      self.triggerActiveItem(item);
      trigger('showTimeline');
      break;
    case 'Composer':
    case 'Edit Request':
      trigger('composer', item);
      break;
    case 'Mark':
    case 'Unmark':
      var list = this.getActivedList(item);
      if (list) {
        var isMark = action === 'Mark';
        list.forEach(function (item) {
          item.mark = isMark;
        });
      }
      this.setState({});
      break;
    case 'Replay':
      trigger('replaySessions', [item, e.shiftKey]);
      break;
    case 'replayTimes':
      trigger('replaySessions', [item, true]);
      break;
    case 'Export':
      trigger('exportSessions', getSessions());
      break;
    case 'Test Rules':
      trigger('showTestRuleDialog', {session: item, treeNode: treeId && modal.getTreeNode(treeId)});
      break;
    case 'Save':
      trigger('saveSessions', getSessions());
      break;
    case 'Abort':
      trigger('abortRequest', item);
      break;
    case 'Import':
      trigger('showImportDialog');
      break;
    case 'Edit Settings':
      trigger('filterSessions', e);
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
    case 'One':
      if (treeId) {
        self.removeTreeNode(treeId);
      } else {
        trigger('removeIt', item);
      }
      break;
    case 'All':
      trigger('clearAll');
      break;
    case 'Others':
      if (treeId) {
        self.removeTreeNode(treeId, true);
      } else {
        trigger('removeOthers', item);
      }
      break;
    case 'Selected':
      trigger('removeSelected');
      break;
    case 'Unselected':
      trigger('removeUnselected');
      break;
    case 'Unmarked':
      trigger('removeUnmarked');
      break;
    case 'Help':
      trigger('openUrl', util.getDocUrl('gui/network.html'));
      break;
    case 'Plugins':
      iframes.fork(action, {
        port: dataCenter.getPort(),
        type: 'network',
        name: name,
        activeItem: item,
        activeList: modal.getListByPath(treeId),
        selectedList: modal.getSelectedList()
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
    case 'Network':
    case 'Mapping':
    case 'Request':
    case 'Response':
    case 'Debug':
      trigger('showAddRulesDialog', {session: item, treeNode: treeId && modal.getTreeNode(treeId), type: action});
      break;
    }
  },
  onHeadCtxMenu: function(e) {
    preventBlur(e);
    var name = $(e.target).closest('th').attr('data-name');
    var col = settings.getColumn(name);
    var menus = col && col.menus;
    if (!menus) {
      return;
    }
    this.curHeadCol = col;
    var data = util.getMenuPosition(e, 130, 310);
    data.list = menus;
    data.radio = true;
    data.className = 'w-ctx-radio-list';
    this.refs.headContextMenu.show(data);
  },
  onContextMenu: function (e) {
    var target = $(e.target);
    var nodeName =  target.prop('nodeName');
    var el = target.closest('.w-req-data-item');
    preventBlur(e);
    if (!el.length) {
      el = target.closest('.w-req-table');
    }
    var self = this;
    var modal = self.props.modal;
    var dataId = el.attr('data-id');
    clearTimeout(self._delayCtxTimer);
    if (!modal.isTreeView && !dataId) {
      var con = self.container.find(BASE_DOM);
      if (con.length && document.elementFromPoint && con[0].offsetHeight < con[0].scrollHeight) {
        var pageX = e.pageX;
        var pageY = e.pageY;
        self._delayCtxTimer = setTimeout(function () {
          target = $(document.elementFromPoint(pageX, pageY)).closest('.w-req-data-item')[0];
          target && self.onContextMenu({
            target: target,
            pageX: pageX,
            pageY: pageY,
            preventDefault: util.noop
          });
        }, 300);
        return;
      }
    }
    var treeId = el.attr('data-tree');
    var item = modal.getItem(dataId);
    var disabled = !item;
    var cellText = item && (nodeName === 'TD' || nodeName === 'TH') && getCellText(target);
    var treeNodeData = modal.isTreeView && modal.getTreeNode(treeId);
    self.treeTarget = null;
    self.currentFocusItem = item;
    var clickBlank = disabled && !treeNodeData;
    var list0 = contextMenuList[1].list;
    list0[4].disabled = clickBlank || !/^https?:\/\//.test(treeId || item.url);
    if (disabled || clickBlank) {
      list0[6].disabled = true;
    } else {
      var type = util.getContentType(item.res.headers);
      list0[6].disabled =
        !item.res.base64 || (type !== 'HTML' && type !== 'IMG');
    }
    list0[0].disabled = clickBlank;
    list0[1].disabled = clickBlank;
    list0[2].disabled = disabled;
    list0[3].disabled = disabled;
    list0[4].disabled = disabled;
    list0[5].disabled = disabled;
    list0[7].disabled = disabled;
    if (modal.isTreeView) {
      list0[8].name = 'List View';
    } else {
      list0[8].name = 'Tree View';
    }
    contextMenuList[2].disabled = disabled && !treeId;
    var treeUrl = treeId ? treeId + '/' : '';
    var isTreeNode = disabled && !treeUrl;
    contextMenuList[2].list.forEach(function (menu) {
      menu.disabled = disabled;
      switch (menu.name) {
      case 'Cell Text':
        menu.copyText = cellText;
        menu.disabled = disabled || !cellText;
        break;
      case 'URL (-Query)':
        menu.copyText = util.getUrl(
            (item && item.url.replace(/[?#].*$/, '')) || treeUrl
          );
        menu.disabled = isTreeNode;
        break;
      case 'URL (+Query)':
        menu.copyText = util.getUrl((item && item.url) || treeUrl);
        menu.disabled = isTreeNode;
        break;
      case 'As cURL':
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
      case 'Cookie':
        var cookie = item && item.req.headers.cookie;
        menu.disabled = !cookie;
        menu.copyText = cookie;
        break;
      case 'Raw Request':
        var rawRequest = util.getRawReq(item);
        menu.disabled = !rawRequest;
        menu.copyText = rawRequest;
        break;
      case 'Raw Response':
        var rawResponse = util.getRawRes(item);
        menu.disabled = !rawResponse;
        menu.copyText = rawResponse;
        break;
      }
    });

    var list2 = contextMenuList[3].list;
    contextMenuList[3].disabled = disabled;
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
    var removeItem = contextMenuList[3].list;
    contextMenuList[3].disabled = !hasData;
    removeItem[0].disabled = !hasData;
    removeItem[1].disabled = clickBlank;
    removeItem[2].disabled = disabled || selectedCount === hasData;
    removeItem[3].disabled = !selectedCount;
    removeItem[4].disabled = selectedCount === hasData;
    removeItem[5].disabled = !modal.hasUnmarked();
    removeItem[6].disabled = clickBlank;
    removeItem[7].disabled = clickBlank;

    var filterItem = contextMenuList[6].list;
    filterItem[1].disabled = clickBlank;
    filterItem[2].disabled = clickBlank;

    var actionItem = contextMenuList[0].list;
    contextMenuList[0].disabled = disabled;
    if (item) {
      actionItem[3].disabled = false;
      if (item.selected) {
        actionItem[4].disabled = true;
        actionItem[5].disabled = true;
        selectedList.forEach(function (selectedItem) {
          if (selectedItem.mark) {
            actionItem[5].disabled = false;
          } else {
            actionItem[4].disabled = false;
          }
        });
      } else {
        var unmark = !item.mark;
        actionItem[4].disabled = !unmark;
        actionItem[5].disabled = unmark;
      }
      if (item.selected) {
        var len = selectedList.length;
        actionItem[0].disabled = !selectedList.filter(util.canAbort).length;
        actionItem[1].disabled = !len;
        actionItem[2].disabled = !len || len > 1;
      } else {
        actionItem[0].disabled = !util.canAbort(item);
        actionItem[1].disabled = false;
        actionItem[2].disabled = false;
      }
    } else {
      actionItem[0].disabled = true;
      actionItem[1].disabled = true;
      actionItem[2].disabled = true;
      actionItem[3].disabled = true;
      actionItem[4].disabled = true;
    }

    var treeItem = contextMenuList[5];
    var treeList = treeItem.list;
    treeItem.hide = !modal.isTreeView;
    treeItem.disabled = !treeNodeData && !hasData;
    if (treeNodeData) {
      var isLeaf = treeNodeData.data;
      var expand = treeNodeData.expand;

      self.treeTarget = treeId;
      self.isTreeLeafNode = isLeaf;
      treeList[0].disabled = expand || isLeaf;
      treeList[1].disabled = !expand || isLeaf;
      treeList[2].disabled = isLeaf;
      treeList[3].disabled = isLeaf;
      var count = (treeNodeData.parent || modal.root).children.length;
      removeItem[2].disabled = count <= 1;
    } else if (modal.isTreeView) {
      treeList[0].disabled = true;
      treeList[1].disabled = true;
      treeList[2].disabled = !hasData;
      treeList[3].disabled = !hasData;
    }
    var rulesItem = contextMenuList[4];
    var pluginItem = contextMenuList[10];
    rulesItem.hide = dataCenter.hideRulesEditor;
    contextMenuList[9].disabled = clickBlank && !selectedCount;
    contextMenuList[7].disabled = clickBlank && !selectedCount;
    util.addPluginMenus(
      pluginItem,
      dataCenter.getNetworkMenus(),
      (treeItem.hide ? 9 : 10) - (rulesItem.hide ? 1 : 0),
      disabled,
      treeId,
      item && item.url
    );
    var height = (treeItem.hide ? 340 : 370) - (pluginItem.hide ? 30 : 0) - (rulesItem.hide ? 30 : 0);
    pluginItem.maxHeight = height;
    var data = util.getMenuPosition(e, 110, height);
    data.list = contextMenuList;
    data.className = data.marginRight < 360 ? 'w-ctx-left' : '';
    self.refs.contextMenu.show(data);
  },
  updateList: function () {
    this.refs.content.refs.list.forceUpdateGrid();
    trigger('checkAtBottom');
  },
  onFilterChange: function (keyword) {
    var self = this;
    var modal = self.props.modal;
    var filterBody = BODY_FILTER.test(keyword);
    clearTimeout(self.networkStateChangeTimer);
    !filterBody && modal.search(keyword);
    self.networkStateChangeTimer = setTimeout(function () {
      filterBody && modal.search(keyword);
      self.setState({ filterText: keyword }, self.updateList);
      trigger('networkStateChange');
    }, 600);
  },
  onFilterTypeChange: function (type) {
    var self = this;
    var baseDom = self.container;
    var atBottom;
    if (baseDom) {
      baseDom = baseDom.find(BASE_DOM);
      var body = baseDom.find('.ReactVirtualized__Grid__innerScrollContainer')[0];
      if (body) {
        var height = baseDom[0].offsetHeight + 5;
        var ctnHeight = body.offsetHeight;
        atBottom = ctnHeight <= height || baseDom[0].scrollTop + height >= ctnHeight;
      } else {
        atBottom = true;
      }
    }
    self.props.modal.setFilterType(type);
    self.setState({ filterType: type }, function() {
      self.updateList();
      if (atBottom) {
        self.autoRefresh();
        self._scrollTimer = setTimeout(self.autoRefresh, 30);
      } else {
        clearTimeout(self._scrollTimer);
      }
    });
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
    this.container.find(BASE_DOM)[0].scrollTop = 100000000;
    this.hideBackBtn();
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
      columnKeys = {};
    } else {
      order = columnState[name];
      columnKeys[name] = util.attr(target, 'data-key');
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
          order: order,
          key: columnKeys[name]
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
    if (e.keyCode === 13) {
      if (!util.hasShortcut( e.shiftKey ? 'replaySelectedRequestsTimes' : 'replaySelectedRequests')) {
        return;
      }
      trigger('replaySessions', [null, e.shiftKey]);
    } else if (e.keyCode === 65) {
      if (!util.hasShortcut('abortRequest')) {
        return;
      }
      preventBlur(e);
      trigger('abortRequest');
    }
  },
  renderColumn: function (col) {
    var name = col.name;
    var style = getColStyle(col);
    if (columnState[name]) {
      style.color = 'var(--c-link)';
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
        data-key={col.key}
        className={col.className}
        style={style}
      >
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
    if (util.isStr(e)) {
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
    var self = this;
    if (!e) {
      var root = self.props.modal.getTree();
      root.children.forEach(util.collapseAll);
      return self.setState({});
    }
    var node = self.getTreeNode(e);
    if (node) {
      util.collapseAll(node);
      self.setState({});
    }
  },
  saveSessions: function (e) {
    var self = this;
    if (self._pendingSave || util.checkSubmit(e)) {
      return;
    }
    var list = self._sessionsList;
    self._pendingSave = true;
    dataCenter.saveSessions(util.strfy({
      filename: self.state.sessionsName.trim(),
      sessions: list
    }), function (data, xhr) {
      self._pendingSave = false;
      if (!data) {
        return util.showSysErr(xhr);
      }
      if (data.em) {
        return message.error(data.em);
      }
      self.refs.saveSessions.hide();
      self._sessionsList = null;
      self.setState({ sessionsName: '' });
      trigger('shakeSavedTab');
      trigger('savedSessionsChanged');
      message.success('Sessions saved successfully');
    });
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
        className={'w-req-data-item tree-node' + (leaf ? ' tree-leaf' : '') + (className ? ' ' + className : '')}
        data-id={leaf && leaf.id}
        data-tree={item.path}
        draggable={leaf && draggable}
        onClick={leaf ? null : this.toggleNode}
        title={leaf ? util.getUrl(leaf.url) : value}
        onKeyDown={function () {}}
      >
        {leaf ? (
          getIcon(leaf, className)
        ) : <Icon name={'triangle-' + (item.expand ? 'bottom' : 'right')} className="icon-fold" />}
        {value.length > 320 ? value.substring(0, 320) + '...' : value}
      </tr>
    );
  },
  enableRecord: function () {
    trigger('enableRecord');
  },
  getVisibleList: function () {
    var modal = this.props.modal;
    return modal.isTreeView
      ? modal.getTree().list.filter(isVisibleInTree)
      : modal.getList().filter(isVisible);
  },
  filterSessionsName: function (e) {
    this.setState({ sessionsName: util.formatFilename(e.target.value) });
  },
  showViewInspectorsBtn: function(visible) {
    var composerReqId = this._curComposerReqId;
    if (composerReqId && composerReqId.visible !== visible) {
      trigger('showViewInspectorsBtn', visible);
      composerReqId.visible = visible;
    }
  },
  render: function () {
    var self = this;
    var state = self.state;
    var modal = self.props.modal;
    var isTreeView = modal.isTreeView;
    var list = self.getVisibleList();
    var hasKeyword = modal.hasKeyword();
    var draggable = state.draggable;
    var columnList = state.columns.list;
    var colStyle = state.columns.style;
    var filterText = (state.filterText || '').trim();
    var record = state.record;
    var notQuery = storage.get('urlType') === '-';
    var composerReqId = self._curComposerReqId;
    var len = list.length;
    var hasChanged = !len;
    self.startIndex = null;
    self.endIndex = null;
    self.visibleList = list;
    hasChanged && self.showViewInspectorsBtn(false);

    return (
      <div className={'fill w-req-data-con v-box' + getHide(self.props.hide)}>
        <div
          className="w-req-data-ctn fill v-box"
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
          <div className={'w-req-data-headers' + getHide(isTreeView)}>
            <table className="table">
              <thead>
                <tr onClick={self.orderBy} onContextMenu={self.onHeadCtxMenu}>
                  <th className="order" data-name="order">#</th>
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
            style={util.getFilteredBg(
              dataCenter.hashFilterObj || filterText || state.filterType
            )}
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
                    rowCount={len}
                    rowRenderer={function (options) {
                      var index = options.index;
                      var item = list[index];
                      if (composerReqId && item.id === composerReqId.reqId) {
                        hasChanged = true;
                        self.showViewInspectorsBtn(true);
                      }
                      if (isTreeView) {
                        if (self.startIndex == null) {
                          self.startIndex = index;
                        }
                        self.endIndex = index;
                        return self.renderTreeNode(item, options);
                      }
                      var order = hasKeyword ? index + 1 : item.order;
                      !hasChanged && index === len - 1 && self.showViewInspectorsBtn(false);
                      return (
                        <Row
                          style={options.style}
                          key={options.key}
                          order={order}
                          columnList={columnList}
                          draggable={draggable}
                          notQuery={notQuery}
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
        <BackToBottomBtn ref="backBtn" hide={isTreeView} onClick={self.autoRefresh} />
        <FilterInput
          ref="filterInput"
          onKeyDown={self.onFilterKeyDown}
          onChange={self.onFilterChange}
          wStyle={colStyle}
          addonHints={HINTS}
          onFilterTypeChange={self.onFilterTypeChange}
          hintKey="networkHintList"
        />
        <ContextMenu onClick={self.onClickContextMenu} ref="contextMenu" />
        <ContextMenu onClick={self.onClickHeadMenu} ref="headContextMenu" />
        <QRCodeDialog ref="qrcodeDialog" />
        <Dialog ref="saveSessions" wstyle="w-choose-file-type">
          <div className="modal-body">
            <label className="w-choose-file-type-label w-save-sessions-label">
              Save as
              <input
                ref="sessionsName"
                onChange={self.filterSessionsName}
                onKeyDown={self.saveSessions}
                placeholder="Enter filename (optional)"
                className="form-control"
                maxLength={MAX_LEN}
                value={state.sessionsName || ''}
              />
            </label>
          </div>
          <div className="modal-footer">
            <DismissBtn />
            <button
              type="button"
              onKeyDown={self.saveSessions}
              tabIndex="0"
              onMouseDown={preventInputBlur}
              className="btn btn-primary"
              onClick={self.saveSessions}
            >
              Save
            </button>
          </div>
        </Dialog>
      </div>
    );
  }
});

module.exports = ReqData;
