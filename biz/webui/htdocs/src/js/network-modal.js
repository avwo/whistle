var util = require('./util');
var storage = require('./storage');
var events = require('./events');

var NUM_OPTIONS = [500, 1000, 1500, 2000, 2500, 3000];
var curLength = parseInt(storage.get('maxNetworkRows'), 10) || 1500;
var MAX_LENGTH = NUM_OPTIONS.indexOf(curLength) === -1 ? 1500 : curLength;
var MAX_COUNT = MAX_LENGTH + 100;
var WIN_NAME_PRE =
  '__whistle_' + location.href.replace(/\/[^/]*([#?].*)?$/, '/') + '__';
var KW_RE =
  /^(url|u|content|c|b|body|headers|h|ip|i|status|result|s|r|method|m|mark|type|t):(.*)$/i;
var KW_LIST_RE = /([^\s]+)(?:\s+([^\s]+)(?:\s+([\S\s]+))?)?/;

function NetworkModal(list) {
  this.list = updateOrder(list);
  this.isTreeView = storage.get('isTreeView') === '1';
  this.clearRoot();
}

NetworkModal.MAX_COUNT = MAX_COUNT;

NetworkModal.setMaxRows = function (num) {
  num = parseInt(num, 10);
  if (NUM_OPTIONS.indexOf(num) !== -1) {
    MAX_LENGTH = num;
    MAX_COUNT = MAX_LENGTH + 100;
    NetworkModal.MAX_COUNT = MAX_COUNT;
    storage.set('maxNetworkRows', num);
  }
};

NetworkModal.getMaxRows = function () {
  return MAX_LENGTH;
};

var proto = NetworkModal.prototype;

/**
 * 默认根据url过滤
 * url[u]:根据url过滤
 * content[c]: 根据content过滤
 * headers[h]: 根据headers过滤
 * ip[i]: 根据ip过滤
 * status[result]: 根据status过滤
 * method[m]: 根据method过滤
 */

function parseKeyword(keyword) {
  keyword = typeof keyword != 'string' ? '' : keyword.trim();
  if (!keyword) {
    return;
  }
  var not = keyword[0] === '!';
  if (not) {
    keyword = keyword.substring(1);
  }
  var type = 'url';
  if (KW_RE.test(keyword)) {
    type = RegExp.$1.toLowerCase();
    keyword = RegExp.$2.trim();
    if (keyword[0] === '!') {
      not = true;
      keyword = keyword.substring(1);
    }
  }
  if (!keyword && type !== 'mark') {
    return;
  }
  return {
    not: not,
    type: type,
    keyword: keyword.toLowerCase(),
    regexp: util.toRegExp(keyword)
  };
}

function parseKeywordList(keyword) {
  keyword = typeof keyword != 'string' ? '' : keyword.trim();
  if (!keyword) {
    return;
  }
  var result;
  var addKw = function (kw) {
    if (kw) {
      result = result || [];
      result.push(kw);
    }
  };
  if (KW_LIST_RE.test(keyword)) {
    var k1 = RegExp.$1;
    var k2 = RegExp.$2;
    var k3 = RegExp.$3;
    addKw(parseKeyword(k1));
    addKw(parseKeyword(k2));
    addKw(parseKeyword(k3));
  } else {
    addKw(parseKeyword(keyword));
  }
  return result;
}

proto.search = function (keyword) {
  this._keyword = parseKeywordList(keyword);
  this.filter();
  return keyword;
};

function checkKeywork(str, opts) {
  if (!str) {
    return false;
  }
  if (!opts.keyword) {
    return true;
  }
  return opts.regexp
    ? opts.regexp.test(str)
    : str.toLowerCase().indexOf(opts.keyword) !== -1;
}

function checkUrl(item, opts) {
  if (checkKeywork((item.isHttps ? 'tunnel://' : '') + item.url, opts)) {
    return true;
  }
  var rawUrl = util.getRawUrl(item);
  return checkKeywork(rawUrl, opts);
}

proto.hasKeyword = function () {
  return this._keyword;
};

proto.setSortColumns = function (columns) {
  this._columns = columns;
  this.filter(false);
};

function setNot(flag, not) {
  return not ? !flag : flag;
}

function checkItem(item, opts) {
  switch (opts.type) {
  case 'mark':
    return !item.mark || setNot(!checkUrl(item, opts), opts.not);
  case 'c':
  case 'content':
  case 'b':
  case 'body':
    var reqBody = util.getBody(item.req, true);
    var resBody = util.getBody(item.res);
    return setNot(
        !checkKeywork(reqBody, opts) && !checkKeywork(resBody, opts),
        opts.not
      );
  case 'headers':
  case 'h':
    return setNot(
        !inObject(item.req.headers, opts) && !inObject(item.res.headers, opts),
        opts.not
      );
  case 'type':
  case 't':
    var type = item.res.headers;
    type = type && type['content-type'];
    return setNot(
        !(typeof type == 'string' && checkKeywork(type, opts)),
        opts.not
      );
  case 'ip':
  case 'i':
    return setNot(
        !checkKeywork(item.req.ip, opts) && !checkKeywork(item.res.ip, opts),
        opts.not
      );
  case 'status':
  case 's':
  case 'result':
  case 'r':
    var status = item.res.statusCode;
    return setNot(
        !checkKeywork(status == null ? '-' : String(status), opts),
        opts.not
      );
  case 'method':
  case 'm':
    return setNot(!checkKeywork(item.req.method, opts), opts.not);
  default:
    return setNot(!checkUrl(item, opts), opts.not);
  }
}

proto.hasUnmarked = function () {
  var list = this.list;
  for (var i = list.length - 1; i >= 0; --i) {
    if (!list[i].mark) {
      return true;
    }
  }
};

proto.getList = function () {
  return this._list || this.list;
};

proto.filter = function () {
  var self = this;
  var list = self.list;
  var keyword = self._keyword;
  list.forEach(function (item) {
    if (keyword) {
      item.hide =
        checkItem(item, keyword[0]) ||
        (keyword[1] && checkItem(item, keyword[1])) ||
        (keyword[2] && checkItem(item, keyword[2]));
    } else {
      item.hide = false;
    }
  });

  var columns = self._columns;
  if (columns && columns.length) {
    var len = columns.length;
    self._list = self.list.slice().sort(function (prev, next) {
      for (var i = 0; i < len; i++) {
        var column = columns[i];
        var prevVal = prev[column.name];
        var nextVal = next[column.name];
        var result = compare(prevVal, nextVal, column.order, column.name);
        if (result) {
          return result;
        }
      }

      return prev.order > next.order ? -1 : 1;
    });
  } else {
    self._list = null;
  }
  this.updateTree();
  this.updateDisplayCount();
  return list;
};

function compare(prev, next, order, name) {
  if (prev == next) {
    return 0;
  }
  if (prev == '-') {
    return 1;
  }
  if (next == '-') {
    return -1;
  }
  return order == 'asc'
    ? _compare(prev, next, name)
    : -_compare(prev, next, name);
}

function _compare(prev, next, name) {
  var isNull = next == null || next == '';
  if (prev == null || prev == '') {
    return isNull ? 0 : -1;
  }
  if (isNull) {
    return 1;
  }
  var isTime = 'dns,request,response,download,time'.indexOf(name) !== -1;
  if (!isTime && prev > next) {
    return 1;
  }
  var prevType = typeof prev;
  var nextType = typeof next;
  if (isTime && prevType === 'string' && nextType === 'string') {
    return prev.replace('ms', '') - next.replace('ms', '') > 0 ? 1 : -1;
  }
  if (prevType != nextType && prevType == 'number') {
    return 1;
  }

  return -1;
}

function inObject(obj, opts) {
  for (var i in obj) {
    if (checkKeywork(i, opts)) {
      return true;
    }
    var value = obj[i];
    if (typeof value == 'string' && checkKeywork(value, opts)) {
      return true;
    }
  }

  return false;
}

var MAX_FS_COUNT = 60;

proto.updateDisplayCount = function () {
  window.name = WIN_NAME_PRE + this.list.length;
};
proto.getDisplayCount = function () {
  var winName = window.name;
  if (typeof winName !== 'string' || winName.indexOf(WIN_NAME_PRE) !== 0) {
    return 0;
  }
  var count = parseInt(winName.substring(WIN_NAME_PRE.length));
  return count >= 0 && count <= MAX_FS_COUNT ? count : MAX_FS_COUNT;
};

proto.clear = function () {
  var len = this.list.length;
  this.clearNetwork = true;
  this.list.splice(0, len);
  this._list = null;
  this.updateTree();
  this.updateDisplayCount();
  if (len) {
    events.trigger('selectedSessionChange');
  }
  return this;
};

proto.removeByHostList = function (hostList) {
  var list = this.list;
  for (var i = list.length - 1; i >= 0; --i) {
    var item = list[i];
    if (hostList.indexOf(item.isHttps ? item.path : item.hostname) !== -1) {
      list.splice(i, 1);
    }
  }
  this.update();
  this.updateDisplayCount();
};

function getNodeIdMap(node, map) {
  var children = node.children;
  if (!children) {
    map[node.data.id] = 1;
    return map;
  }
  children.forEach(function (child) {
    getNodeIdMap(child, map);
  });
  return map;
}

proto.removeTreeNode = function (path, others) {
  var node = this.getTreeNode(path);
  if (!node) {
    return;
  }
  var map = getNodeIdMap(node, {});
  var list = this.list;
  for (var i = list.length - 1; i >= 0; --i) {
    if (others ? !map[list[i].id] : map[list[i].id]) {
      list.splice(i, 1);
    }
  }
  this.update();
  this.updateDisplayCount();
  return true;
};

proto.removeByUrlList = function (urlList) {
  var list = this.list;
  for (var i = list.length - 1; i >= 0; --i) {
    if (
      urlList.indexOf(list[i].url.replace(/\?.*$/, '').substring(0, 1024)) !==
      -1
    ) {
      list.splice(i, 1);
    }
  }
  this.update();
  this.updateDisplayCount();
};

proto.removeSelectedItems = function () {
  var hasSelectedItem;
  var endIndex = -1;
  var list = this.list;

  for (var i = list.length - 1; i >= 0; i--) {
    var item = list[i];
    if (item.selected) {
      hasSelectedItem = true;
      if (endIndex == -1) {
        endIndex = i;
      }
      if (!i) {
        list.splice(i, endIndex - i + 1);
      }
    } else if (endIndex != -1) {
      list.splice(i + 1, endIndex - i);
      endIndex = -1;
    }
  }

  if (hasSelectedItem) {
    this.update(false, true);
    return true;
  }
};

proto.remove = function (item) {
  var list = this.list;
  var index = list.indexOf(item);
  if (index !== -1) {
    list.splice(index, 1);
    this.update(false, true);
  }
};

proto.removeOthers = function (item) {
  var list = this.list;
  var index = list.indexOf(item);
  if (index !== -1) {
    list.splice(index + 1, list.length - index);
    if (index !== 0) {
      list.splice(0, index);
    }
    this.update(false, true);
  }
};

proto.removeUnselectedItems = function () {
  var hasUnselectedItem;
  var endIndex = -1;
  var list = this.list;

  for (var i = list.length - 1; i >= 0; i--) {
    var item = list[i];
    if (!item.selected) {
      hasUnselectedItem = true;
      if (endIndex == -1) {
        endIndex = i;
      }
      if (!i) {
        list.splice(i, endIndex - i + 1);
      }
    } else if (endIndex != -1) {
      list.splice(i + 1, endIndex - i);
      endIndex = -1;
    }
  }

  if (hasUnselectedItem) {
    this.update(false, true);
    return true;
  }
};

proto.removeUnmarkedItems = function () {
  var hasUnmarkedItem;
  var endIndex = -1;
  var list = this.list;

  for (var i = list.length - 1; i >= 0; i--) {
    var item = list[i];
    if (!item.mark) {
      hasUnmarkedItem = true;
      if (endIndex == -1) {
        endIndex = i;
      }
      if (!i) {
        list.splice(i, endIndex - i + 1);
      }
    } else if (endIndex != -1) {
      list.splice(i + 1, endIndex - i);
      endIndex = -1;
    }
  }

  if (hasUnmarkedItem) {
    this.update(false, true);
    return true;
  }
};

proto.prev = function () {
  var list = this.getList();
  var len = list.length;
  if (!len) {
    return;
  }
  var activeItem = this.getActive();
  var index = activeItem ? list.indexOf(activeItem) : len - 1;
  var i, item;
  for (i = index - 1; i >= 0; i--) {
    item = list[i];
    if (!item.hide) {
      return item;
    }
  }

  for (i = len - 1; i > index; i--) {
    item = list[i];
    if (!item.hide) {
      return item;
    }
  }
};

proto.next = function () {
  var list = this.getList();
  var len = list.length;
  if (!len) {
    return;
  }
  var activeItem = this.getActive();
  var index = activeItem ? list.indexOf(activeItem) : 0;
  var i, item;
  for (i = index + 1; i < len; i++) {
    item = list[i];
    if (!item.hide) {
      return item;
    }
  }

  for (i = 0; i < index; i++) {
    item = list[i];
    if (!item.hide) {
      return item;
    }
  }
};

function updateList(list, len, hasKeyword) {
  if (!(len > 0)) {
    return;
  }
  var activeItem = getActive(list);
  if (hasKeyword) {
    var i = 0;
    var length = list.length;
    while (len > 0 && i < length) {
      if (list[i].hide) {
        --length;
        --len;
        list.splice(i, 1);
      } else {
        ++i;
      }
    }
    len = list.length - MAX_COUNT - 2;
  }
  len > 0 && list.splice(0, len);
  if (activeItem && list.indexOf(activeItem) === -1) {
    list[0] = activeItem;
  }
}

proto.update = function (scrollAtBottom, force) {
  updateOrder(this.list, force);
  if (scrollAtBottom && !this.isTreeView) {
    var exceed = Math.min(this.list.length - MAX_LENGTH, 100);
    updateList(this.list, exceed, this.hasKeyword());
  }
  this.filter();
  return !this.isTreeView && this.list.length > MAX_LENGTH;
};

proto.hasSelected = function () {
  var list = this.list;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (!item.hide && item.selected) {
      return true;
    }
  }
  return false;
};

proto.hasUnselected = function () {
  var list = this.list;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (!item.hide && !item.selected) {
      return true;
    }
  }
  return false;
};

proto.getSelected = function () {
  return this.getActive();
};

function getActive(list) {
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (item.active) {
      return item;
    }
  }
}

proto.getActive = function () {
  return getActive(this.list) || this.getSelectedList()[0];
};

proto.getItem = function (id) {
  if (!id) {
    return;
  }
  var list = this.list;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (item.id === id) {
      return item;
    }
  }
};

proto.setSelected = function (item, selected) {
  item.selected = selected !== false;
};

proto.getSelectedList = function () {
  return this.list.filter(function (item) {
    return !item.hide && item.selected;
  });
};

function getPrevSelected(start, list) {
  for (; start >= 0; start--) {
    var item = list[start - 1];
    if (!item || (!item.selected && !item.active)) {
      return start;
    }
  }
  return start;
}

function getNextSelected(start, list) {
  for (var len = list.length; start < len; start++) {
    var item = list[start + 1];
    if (item && item.data) {
      item = item.data;
    }
    if (!item || (!item.selected && !item.active)) {
      return start;
    }
  }
  return start;
}

proto.setSelectedList = function (start, end, selectElem) {
  var list = this.getList();
  if (this.isTreeView) {
    list = this.root.list;
    start = this.getTreeNode(start.id);
    end = this.getTreeNode(end.id);
  }
  start = list.indexOf(start);
  end = list.indexOf(end);
  if (start > end) {
    var temp = getNextSelected(start, list);
    start = end;
    end = temp;
  } else {
    start = getPrevSelected(start, list);
  }
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    item = item.data || item;
    if (i >= start && i <= end) {
      item.selected = true;
      selectElem(item, true);
    } else {
      item.selected = false;
    }
  }
};

proto.clearSelection = function () {
  this.list.forEach(function (item) {
    item.selected = false;
  });
};

proto.clearActive = function () {
  this.list.forEach(function (item) {
    item.active = false;
  });
};

function parsePaths(url) {
  var index = url.indexOf('?');
  var search = '';
  if (index !== -1) {
    search = url.substring(index);
    url = url.substring(0, index);
  }
  index = url.indexOf('://');
  if (index === -1) {
    return ['tunnel://' + url, '/'];
  }
  index = url.indexOf('/', index + 3);
  if (index === -1) {
    return [url, '/'];
  }
  var paths = url.substring(index).split('/');
  paths[0] = url.substring(0, index);
  var lastIndex = paths.length - 1;
  paths[lastIndex] = '/' + paths[lastIndex] + search;
  return paths;
}

function checkHide(item) {
  var children = item.children;
  if (!children || item.hide) {
    return item.hide;
  }
  var hide = true;
  for (var i = 0, len = children.length; i < len; i++) {
    var child = children[i];
    if (checkHide(child)) {
      child.hide = true;
    } else {
      hide = false;
      child.hide = false;
    }
  }
  item.hide = hide;
  return hide;
}

function handleTree(root, list) {
  var children = root.children;
  for (var i = 0, len = children.length; i < len; i++) {
    var item = children[i];
    if (!item.hide) {
      list.push(item);
      item.children && handleTree(item, list);
    }
  }
  return root;
}

proto.clearRoot = function () {
  var root = {
    children: [],
    map: {},
    list: []
  };
  this.root = root;
  return root;
};

proto.getListByPath = function (path) {
  var isTunnel = path.indexOf('tunnel://') === 0;
  if (isTunnel) {
    path = path.substring(9);
  } else {
    path = path + '/';
  }
  return this.list.filter(function (item) {
    return (
      !item.hide && (isTunnel ? item.url === path : !item.url.indexOf(path))
    );
  });
};

proto.updateTree = function () {
  if (!this.isTreeView) {
    this._updateOnTreeView = true; // 非树状展示模式，不更新 tree 数据，等切换 view 时更新
    return this.root;
  }
  this._updateOnTreeView = false;
  var allData = this.list;
  var len = allData.length;
  if (!len) {
    return this.clearRoot();
  }
  var oldRoot = this.root;
  var root = this.clearRoot();
  for (var i = 0; i < len; i++) {
    var item = allData[i];
    var paths = parsePaths(item.url);
    var lastIndex = paths.length - 1;
    var parent = root;
    var pre = oldRoot;
    var path;
    var top;
    for (var j = 0; j < lastIndex; j++) {
      var value = paths[j];
      var next = parent.map[value];
      var old = pre && pre.map[value];
      path = j ? path + '/' + value : value;
      if (!next) {
        next = {
          depth: j,
          path: path,
          value: value,
          children: [],
          map: {}
        };
        if (old) {
          next.expand = old.expand;
          next.pExpand = old.pExpand;
        }
        parent.map[value] = next;
        parent.children.push(next);
      }
      if (j) {
        next.parent = parent;
      } else {
        top = next;
      }
      parent = next;
      pre = old;
    }
    var leaf = {
      depth: lastIndex,
      parent: parent,
      value: paths[lastIndex],
      hide: item.hide,
      data: item
    };
    top.map[item.id] = leaf;
    parent.children.push(leaf);
  }
  root.children.forEach(checkHide);
  handleTree(root, root.list);
  return root;
};

proto.setTreeView = function (isTreeView, quiet) {
  isTreeView = isTreeView !== false;
  if (this.isTreeView !== isTreeView) {
    this.isTreeView = isTreeView;
    !quiet && storage.set('isTreeView', isTreeView ? '1' : '');
    isTreeView && this._updateOnTreeView && this.updateTree();
  }
};

proto.getTree = function () {
  return this.root;
};

proto.getTreeNode = function (id) {
  var list = this.root.list;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (item.data ? item.data.id === id : item.path === id) {
      return item;
    }
  }
};

function updateOrder(list, force) {
  var len = list.length;
  if (len && (force || !list[len - 1].order)) {
    var order = list[0].order || 1;
    list.forEach(function (item, i) {
      item.order = order + i;
    });
  }

  return list;
}

module.exports = NetworkModal;
