var util = require('./util');
var MAX_FRAMES_LENGTH = require('./data-center').MAX_FRAMES_LENGTH;

var lowerBody;

var filterItem = function (keyword, item) {
  if (!keyword) {
    return true;
  }
  if (lowerBody == null) {
    lowerBody = util.getBody(item, true).toLowerCase();
  }
  return lowerBody.indexOf(keyword) !== -1;
};

function FramesModal() {
  this.list = [];
}

var proto = FramesModal.prototype;

proto.getItem = function(frameId) {
  if (frameId) {
    for (var i = 0, len = this.list.length; i < len; i++) {
      var item = this.list[i];
      if (item.frameId === frameId) {
        return item;
      }
    }
  }
};

proto.search = function (keyword) {
  keyword = typeof keyword !== 'string' ? '' : keyword.trim().toLowerCase();
  if (keyword) {
    var k = (this._keyword = {});
    var i = 0;
    keyword
      .split(/\s+/g)
      .slice(0, 3)
      .forEach(function (key) {
        if (/^(c|s):(\S*)$/i.test(key)) {
          k[RegExp.$1.toLowerCase()] = RegExp.$2;
        } else {
          k['k' + i++] = key;
        }
      });
  } else {
    this._keyword = '';
  }
};

proto.filter = function () {
  var keyword = this._keyword;
  var list = this.list;
  if (!keyword) {
    list.forEach(function (item) {
      item.hide = false;
    });
    return;
  }

  list.forEach(function (item) {
    item.hide = false;
    lowerBody = null;
    if (
      !filterItem(keyword.k0, item) ||
      !filterItem(keyword.k1, item) ||
      !filterItem(keyword.k2, item)
    ) {
      item.hide = true;
      return;
    }
    var hasClientKeyword = 'c' in keyword;
    var hasServerKeyword = 's' in keyword;
    if (!hasClientKeyword && !hasServerKeyword) {
      return;
    }
    if (hasClientKeyword && hasServerKeyword) {
      item.hide = !filterItem(keyword[item.isClient ? 'c' : 's'], item);
      return;
    }
    if (hasClientKeyword) {
      item.hide = !item.isClient || !filterItem(keyword.c, item);
      return;
    }
    item.hide = item.isClient || !filterItem(keyword.s, item);
  });
};

proto.setActive = function (item, active) {
  this.list.forEach(function (item) {
    item.active = false;
  });
  item.active = active !== false;
};

function getActive(list) {
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (item.active) {
      return item;
    }
  }
}

function updateList(list, len) {
  var activeItem = getActive(list);
  list.splice(0, len);
  if (activeItem && list.indexOf(activeItem) === -1) {
    list[0] = activeItem;
  }
}

proto.getActive = function () {
  return getActive(this.list);
};

proto.getList = function () {
  this.filter();
  return this.list;
};

proto.update = function () {
  var list = this.list;
  var len = list.length;
  var overflow = len - MAX_FRAMES_LENGTH;
  if (overflow > 0) {
    if (this._keyword) {
      var i = 0;
      while (i < len && overflow > 0) {
        var item = list[i];
        if (item.hide && !item.active) {
          --len;
          --overflow;
          list.splice(i, 1);
        } else {
          ++i;
        }
      }
    }
    if (overflow > 0) {
      updateList(list, overflow);
    }
  }
};

proto.clear = function () {
  this.list.splice(0, this.list.length);
  return this;
};

proto.reset = function (list) {
  if (!list || this.list === list) {
    return list;
  }
  this.list = list;
  this.filter();
  return list;
};

module.exports = FramesModal;
