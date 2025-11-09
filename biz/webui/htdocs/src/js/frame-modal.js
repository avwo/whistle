var util = require('./util');
var MAX_FRAMES_LENGTH = require('./data-center').MAX_FRAMES_LENGTH;

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

var KW_RE = /^(c|s):(\S*)$/i;
proto.search = function (keyword) {
  keyword = typeof keyword !== 'string' ? '' : keyword.trim();
  if (!keyword) {
    this._keyword = '';
    return;
  }
  var k = (this._keyword = {});
  keyword.split(/\s+/).forEach(function (key) {
    var type = '';
    var not = key[0] === '!';
    if (not) {
      key = key.substring(1).trim();
    }
    if (KW_RE.test(key)) {
      type = RegExp.$1.toLowerCase();
      key = RegExp.$2;
      if (key[0] === '!') {
        not = true;
        key = key.substring(1);
      }
    }
    var list = k[type] || (k[type] = []);
    if (key && list.length < 3) {
      list.push({
        not: not,
        keyword: key.toLowerCase(),
        regexp: util.toRegExp(key)
      });
    }
  });
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
  var lowerBody;
  var isHide = function (item, type) {
    var list = keyword[type || ''];
    if (!list) {
      return false;
    }
    if (type === 's') {
      if (item.isClient) {
        return true;
      }
    } else if (type === 'c') {
      if (!item.isClient) {
        return true;
      }
    }
    if (list.length === 0) {
      return false;
    }
    for (var i = 0, len = list.length; i < len; i++) {
      var key = list[i];
      if (lowerBody == null) {
        lowerBody = util.getBody(item, true).toLowerCase();
      }
      var flag = key.regexp ? key.regexp.test(lowerBody) : lowerBody.indexOf(key.keyword) !== -1;
      if (key.not ? !flag : flag) {
        return false;
      }
    }
    return true;
  };
  list.forEach(function (item) {
    lowerBody = null;
    item.hide = isHide(item) || isHide(item, 's') || isHide(item, 'c');
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
