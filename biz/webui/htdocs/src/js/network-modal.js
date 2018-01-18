var MAX_LENGTH = 560;
var MAX_COUNT = 720;

function NetworkModal(list) {
  this._list = updateOrder(list);
  this.list =list.slice(0, MAX_LENGTH);
}

NetworkModal.MAX_COUNT = MAX_COUNT;

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
proto.search = function(keyword) {
  this._type = 'url';
  this._keyword = typeof keyword != 'string' ? '' : keyword.trim();
  if (this._keyword && /^(url|u|content|c|headers|h|ip|i|status|result|s|r|method|m|type|t):(.*)$/.test(keyword)) {
    this._type = RegExp.$1;
    this._keyword = RegExp.$2.trim();
  }
  this.filter();
  return keyword;
};

proto.hasKeyword = function() {
  return !!this._keyword;
};

proto.setSortColumns = function(columns) {
  this._columns = columns;
  this.filter();
};

proto.filter = function(newList) {
  var keyword = this._keyword;
  var list = this.list;
  if (!keyword) {
    list.forEach(function(item) {
      item.hide = false;
    });
  } else {
    switch(this._type) {
    case 'c':
    case 'content':
    case 'b':
    case 'body':
      list.forEach(function(item) {
        var reqBody = item.req.body;
        var resBody = item.res.body;
        item.hide = (!reqBody || reqBody.indexOf(keyword) == -1) &&
                 (!resBody || resBody.indexOf(keyword) == -1);
      });
      break;
    case 'headers':
    case 'h':
      list.forEach(function(item) {
        item.hide = !inObject(item.req.headers, keyword)
                && !inObject(item.res.headers, keyword);
      });
      break;
    case 'type':
    case 't':
      list.forEach(function(item) {
        var type = item.res.headers;
        type = type && type['content-type'];
        item.hide = !(typeof type == 'string' && type.indexOf(keyword) != -1);
      });
      break;
    case 'ip':
    case 'i':
      list.forEach(function(item) {
        var ip = item.req.ip || '';
        var host = item.res.ip || '';
        item.hide = ip.indexOf(keyword) == -1
                && host.indexOf(keyword) == -1;
      });
      break;
    case 'status':
    case 's':
    case 'result':
    case 'r':
      list.forEach(function(item) {
        item.hide = item.res.statusCode == null ? true :
            (item.res.statusCode + '').indexOf(keyword) == -1;
      });
      break;
    case 'method':
    case 'm':
      keyword = keyword.toUpperCase();
      list.forEach(function(item) {
        item.hide = (item.req.method || '').indexOf(keyword) == -1;
      });
      break;
    default:
      keyword = keyword.toLowerCase();
      list.forEach(function(item) {
        item.hide = item.url.toLowerCase().indexOf(keyword) == -1;
      });
    }
  }

  var columns = this._columns;
  if (columns && columns.length) {
    var len = columns.length;
    this.list.sort(function(prev, next) {
      for (var i = 0; i < len; i++) {
        var column = columns[i];
        var prevVal = prev[column.name];
        var nextVal = next[column.name];
        var result = compare(prevVal, nextVal, column.order);
        if (result) {
          return result;
        }
      }

      return prev.order > next.order ? 1 : -1;
    });
  } else if (!newList) {
    this.list = this._list.slice(0, MAX_LENGTH);
  }

  return list;
};


function compare(prev, next, order) {
  if (prev == next) {
    return 0;
  }
  if (prev == '-') {
    return 1;
  }
  if (next == '-') {
    return -1;
  }
  return order == 'asc' ? -_compare(prev, next) : _compare(prev, next);
}

function _compare(prev, next) {
  if (prev == null || prev == '') {
    return -1;
  }
  if (next == null || next == '') {
    return 1;
  }
  if (prev > next) {
    return 1;
  }
  var prevType = typeof prev;
  var nextType = typeof next;
  if (prevType != nextType && prevType == 'number') {
    return 1;
  }

  return -1;
}

function inObject(obj, keyword) {
  for (var i in obj) {
    if (i.indexOf(keyword) != -1) {
      return true;
    }
    var value = obj[i];
    if (typeof value == 'string'
        && value.indexOf(keyword) != -1) {
      return true;
    }
  }

  return false;
}

proto.clear = function clear() {
  this._list.splice(0, this._list.length);
  this.list = [];
  return this;
};

proto.removeSelectedItems = function() {
  var hasSelectedItem;
  var endIndex = -1;
  var list = this._list;

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

proto.remove = function(item) {
  var list = this._list;
  var index = list.indexOf(item);
  if (index !== -1) {
    list.splice(index ,1);
    this.update(false, true);
  }
};

proto.removeOthers = function(item) {
  var list = this._list;
  var index = list.indexOf(item);
  if (index !== -1) {
    list.splice(index + 1, list.length - index);
    if (index !== 0) {
      list.splice(0, index);
    }
    this.update(false, true);
  }
};

proto.removeUnselectedItems = function() {
  var hasUnselectedItem;
  var endIndex = -1;
  var list = this._list;

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

proto.prev = function() {
  var list = this.list;
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

proto.next = function() {
  var list = this.list;
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

proto.update = function(scrollAtBottom, force) {
  updateOrder(this._list, force);
  if (scrollAtBottom) {
    var exceed = Math.min(this._list.length - MAX_LENGTH, 100);
    if (this.hasKeyword()) {
      for (var i = 0; i < exceed; i++) {
        var item = this._list[i];
        if (!item.hide) {
          if (i > 0) {
            this._list.splice(0, i);
          }
          break;
        }
      }
    } if (exceed > 0) {
      this._list.splice(0,exceed);
    }
  }

  this.list = this._list.slice(0, MAX_LENGTH);
  this.filter(true);
  return this._list.length > MAX_LENGTH;
};

proto.hasSelected = function() {
  var list = this.list;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (!item.hide && item.selected) {
      return true;
    }
  }
  return false;
};

proto.hasUnselected = function() {
  var list = this.list;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (!item.hide && !item.selected) {
      return true;
    }
  }
  return false;
};

proto.getSelected = function() {

  return this.getActive();
};

proto.getActive = function() {
  var list = this.list;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (item.active) {
      return item;
    }
  }

  return this.getSelectedList()[0];
};

proto.getItem = function(id) {
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

proto.setSelected = function(item, selected) {
  item.selected = selected !== false;
};

proto.getSelectedList = function() {

  return this.list.filter(function(item) {
    return !item.hide && item.selected;
  });
};

proto.setSelectedList = function(startId, endId) {
  if (!startId || !endId) {
    return;
  }

  var selected, item;
  for (var i = 0, len = this.list.length; i < len; i++) {
    item = this.list[i];
    if (item.id == startId) {
      selected = !selected;
      item.selected = true;
    } else {
      item.selected = selected;
    }

    if (item.id == endId) {
      selected = !selected;
    }
  }
};

proto.clearSelection = function() {
  this.list.forEach(function(item) {
    item.selected = false;
  });
};

proto.clearActive = function() {
  this.list.forEach(function(item) {
    item.active = false;
  });
};

function updateOrder(list, force) {
  var len = list.length;
  if (len && (force || !list[len - 1].order)) {
    var order = list[0].order || 1;
    list.forEach(function(item, i) {
      item.order = order + i;
    });
  }

  return list;
}

module.exports = NetworkModal;

