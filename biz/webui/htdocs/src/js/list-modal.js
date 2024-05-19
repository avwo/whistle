var $ = require('jquery');
var util = require('./util');

function ListModal(list, data) {
  this.reset(list, data, true);
}

var proto = ListModal.prototype;

proto.reset = function (list, data, init) {
  var self = this;
  self.list = Array.isArray(list) ? list : [];
  data = data || {};
  self.data = {};
  self.groups = {};
  self.list.forEach(function (name) {
    var item = (self.data[name] = data[name] || {});
    item.key = item.key || util.getKey();
    item.name = name;
  });
  if (!init) {
    self.filter();
  }
};

proto.getList = function () {
  var data = this.data;
  return this.list.map(function (key) {
    return data[key];
  });
};

proto._getList = function (prop) {
  var list = [];
  var data = this.data;
  Object.keys(data).forEach(function (name) {
    var item = data[name];
    if (item && item[prop]) {
      list.push(item);
    }
  });
  return list;
};

proto.getItem = function(name) {
  return this.data[name];
};

proto.hasChanged = function () {
  var data = this.data;
  return Object.keys(data).some(function (name) {
    var item = data[name];
    return item && item.changed && !util.isGroup(item.name);
  });
};

proto.getGroupName = function(name) {
  var i = this.list.indexOf(name);
  if (i !== -1) {
    for (; i >=0; i--) {
      name = this.list[i];
      if (util.isGroup(name)) {
        return name;
      }
    }
  }
};

proto._setBoolProp = function (name, prop, bool) {
  var item = this.get(name);
  if (item) {
    item[prop] = bool !== false;
  }
  this.filter();
  return item;
};

proto.getSelectedNames = function () {
  var list = [];
  var data = this.data;
  Object.keys(data).forEach(function (name) {
    var item = data[name];
    if (item && item.selected) {
      list.push(item.name);
    }
  });
  return list;
};

proto.exists = function (name) {
  return this.list.indexOf(name) != -1;
};

function push(list, name) {
  if (!util.isGroup(name)) {
    for (var i = 0, len = list.length; i < len; i++) {
      if (util.isGroup(list[i])) {
        return list.splice(i, 0, name);
      }
    }
  }
  list.push(name);
}

function add(name, value, isPre) {
  if (!name) {
    return false;
  }
  var data = this.get(name);
  value = value || '';
  if (data) {
    data.value = value;
    return;
  }
  if (isPre) {
    this.list.splice(1, 0, name);
  } else {
    push(this.list, name);
  }
  var item = (this.data[name] = {
    key: util.getKey(),
    name: name,
    value: value
  });
  this.filter();
  return item;
}

proto.add = function (name, value) {
  return add.call(this, name, value);
};

proto.unshift = function (name, value) {
  return add.call(this, name, value, true);
};

proto.set = function (name, value) {
  var item = this.get(name);
  if (item) {
    if (typeof value == 'string') {
      item.value = value;
    } else {
      $.extend(item, value);
    }
  }
};

proto.get = function (name) {
  return this.data[name];
};

proto.getByKey = function (key) {
  var list = this.list;
  var data = this.data;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = data[list[i]];
    if (item.key == key) {
      return item;
    }
  }
};

proto.setSelected = function (name, selected) {
  return this._setBoolProp(name, 'selected', selected);
};

proto.moveTo = function (fromName, toName, group, toTop) {
  var list = this.list;
  var fromIndex = list.indexOf(fromName);
  var toIndex = list.indexOf(toName);
  if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
    if (group && util.isGroup(fromName)) {
      var data = this.data;
      var children = [fromName];
      for (var i = fromIndex + 1, len = list.length; i < len; i++) {
        var name = data[list[i]].name;
        if (util.isGroup(name)) {
          break;
        }
        children.push(name);
      }
      if (fromIndex < toIndex && util.isGroup(toName)) {
        for (; toIndex < len; toIndex++) {
          if (util.isGroup(list[toIndex + 1])) {
            break;
          }
        }
      }
      len = children.length;
      if (len > 1 && fromIndex < toIndex) {
        toIndex = Math.max(0, toIndex - len + 1);
      }
      list.splice(fromIndex, len);
      children.unshift(toIndex, 0);
      list.splice.apply(list, children);
    } else if (toTop || util.isGroup(fromName) || !util.isGroup(toName) || this.getGroupName(fromName) === toName) {
      list.splice(fromIndex, 1);
      list.splice(toIndex, 0, fromName);
    } else {
      list.splice(fromIndex, 1);
      list.splice(fromIndex > toIndex ? toIndex + 1 : toIndex, 0, fromName);
    }
    return true;
  }
};

proto.moveToGroup = function(name, groupName, isTop) {
  if (!groupName) {
    return;
  }
  var list = this.list;
  var index = list.indexOf(name);
  if (index === -1 || list.indexOf(groupName) === -1) {
    return;
  }
  list.splice(index, 1);
  index = list.indexOf(groupName) + 1;
  if (isTop) {
    return list.splice(index, 0, name);
  }
  for (var len = list.length; index < len; index++) {
    if (util.isGroup(list[index])) {
      break;
    }
  }
  list.splice(index, 0, name);
};

proto.getSelectedList = function () {
  return this._getList('selected');
};

proto.setChanged = function (name, changed) {
  return this._setBoolProp(name, 'changed', changed);
};

proto.getChangedList = function () {
  return this._getList('changed');
};

proto.getChangedGroupList = function(item) {
  if (!util.isGroup(item.name)) {
    return [item];
  }
  var result = [];
  var list = this.list;
  var data = this.data;
  var i = list.indexOf(item.name) + 1;
  if (i > 0) {
    for (var len = list.length; i < len; i++) {
      item = data[list[i]];
      if (util.isGroup(item.name)) {
        break;
      }
      item.changed && result.push(item);
    }
  }
  return result;
};

proto.clearAllActive = function () {
  var data = this.data;
  Object.keys(data).forEach(function (name) {
    data[name].active = false;
  });
};

proto.clearAllSelected = function () {
  var data = this.data;
  Object.keys(data).forEach(function (name) {
    data[name].selected = false;
  });
};

proto.setActive = function (name, active) {
  var item = this.get(name);
  if (item && !util.isGroup(item.name)) {
    active = active !== false;
    active && this.clearAllActive();
    item.active = active;
  }
  return item;
};

proto.getActiveObj = function() {
  var obj = {};
  var list = this.list;
  var data = this.data;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = data[list[i]];
    if (util.isGroup(item.name)) {
      if (item._isNewGroup) {
        delete item._isNewGroup;
        obj.groupItem = item;
        if (obj.activeItem) {
          return obj;
        }
      }
    } else {
      if (item.active) {
        obj.activeItem = item;
        if (obj.groupItem) {
          return obj;
        }
      }
    }
  }
  return obj;
};

proto.getActive = function (ensure) {
  var first;
  ensure = ensure === true;
  var list = this.list;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = this.data[list[i]];
    if (!util.isGroup(item.name)) {
      if (item.active) {
        return item;
      }
      if (ensure) {
        first = first || item;
      }
    }
  }
  if (first) {
    first.active = true;
  }
  return first;
};

proto.remove = function (name) {
  var index = this.getIndex(name);
  if (index != -1) {
    this.list.splice(index, 1);
    delete this.data[name];
    return true;
  }
};

proto.removeGroup = function (name) {
  var list = this.list;
  var index = list.indexOf(name) + 1;
  if (!index) {
    return;
  }
  var result = [name];
  var data = this.data;
  var hasActive;
  for (var len = list.length; index < len; index++) {
    name = list[index];
    if (util.isGroup(name)) {
      break;
    }
    result.push(name);
    var item = data[name];
    hasActive = hasActive || (item && item.active);
  }
  result.forEach(function(file) {
    list.splice(list.indexOf(file), 1);
    delete data[file];
  });
  return hasActive && this.getSibling(name); 
};

proto.rename = function (name, newName) {
  if (!name || !newName || name == newName) {
    return;
  }

  var index = this.getIndex(name);
  if (index != -1) {
    this.list[index] = newName;
    var item = this.data[name];
    delete this.data[name];
    this.data[newName] = item;
    item.name = newName;
    this.filter();
    return true;
  }
};

proto.getIndex = function (name) {
  return this.list.indexOf(name);
};

proto.getSibling = function (name) {
  var index = this.getIndex(name);
  var list = this.list;
  name = list[index + 1];
  name = util.isGroup(name) && list[index - 1];
  if (name && !util.isGroup(name)) {
    return this.data[name];
  }
  for (var i = index + 1, len = list.length; i < len; i++) {
    name = list[i];
    if (!util.isGroup(name)) {
      return this.data[name];
    }
  }
  for (i = index - 1; i >= 0; i--) {
    name = list[i];
    if (!util.isGroup(name)) {
      return this.data[name];
    }
  }
};

/**
 * 默认根据name过滤
 * selected[s, active, a]: 根据激活的过滤
 */
proto.search = function (keyword, disabledType) {
  keyword = typeof keyword === 'string' ? keyword.trim() : '';
  if (keyword &&(disabledType ? /^(b|v):(.*)$/ : /^(selected|s|active|a|b|v):(.*)$/).test(keyword)) {
    this._type = RegExp.$1;
    keyword = RegExp.$2.trim();
  } else {
    this._type = ''; // reset
  }
  this._keyword = keyword && (util.toRegExp(keyword) || keyword.toLowerCase());
  this.filter();
  return !keyword;
};

proto.filter = function () {
  var keyword = this._keyword;
  var list = this.list;
  var filterBody = this._type === 'b' || this._type === 'v';
  var filterSelected = !!this._type && !filterBody;
  var data = this.data;

  list.forEach(function (name) {
    var item = data[name];
    var hideSelected = filterSelected && !item.selected;
    if (!keyword || hideSelected) {
      item.hide = hideSelected;
      return;
    }
    if (filterBody) {
      item.hide = !item.value || util.checkKey(item.value, item.value.toLowerCase(), keyword);
    } else {
      item.hide = !name || util.checkKey(name, name.toLowerCase(), keyword);
    }
  });
  return list;
};

proto.up = function () {
  var list = this.list;
  var len = list.length;
  if (!len) {
    return;
  }
  var activeItem = this.getActive();
  if (activeItem.fixed) {
    return;
  }

  var index = activeItem ? list.indexOf(activeItem.name) : len - 1;
  if (!index || this.data[list[index - 1]].fixed) {
    return;
  }

  list[index] = list[index - 1];
  list[index - 1] = activeItem.name;
  return activeItem;
};

proto.down = function () {
  var list = this.list;
  var len = list.length;
  if (!len) {
    return;
  }
  var activeItem = this.getActive();
  if (activeItem.fixed) {
    return;
  }

  var index = activeItem ? list.indexOf(activeItem.name) : len - 1;
  if (index >= len - 1 || this.data[list[index + 1]].fixed) {
    return;
  }

  list[index] = list[index + 1];
  list[index + 1] = activeItem.name;
  return activeItem;
};

function isVisibleItem(item) {
  return !item.hide && !util.isGroup(item.name);
}

proto.prev = function () {
  var list = this.list;
  var len = list.length;
  if (!len) {
    return;
  }
  var activeItem = this.getActive();
  var index = activeItem ? list.indexOf(activeItem.name) : len - 1;
  var data = this.data;
  var i, item;
  for (i = index - 1; i >= 0; i--) {
    item = data[list[i]];
    if (isVisibleItem(item)) {
      return item;
    }
  }

  for (i = len - 1; i > index; i--) {
    item = data[list[i]];
    if (isVisibleItem(item)) {
      return item;
    }
  }
};

proto.next = function () {
  var list = this.list;
  var len = list.length;
  if (!len) {
    return;
  }
  var activeItem = this.getActive();
  var index = activeItem ? list.indexOf(activeItem.name) : 0;
  var data = this.data;
  var i, item;
  for (i = index + 1; i < len; i++) {
    item = data[list[i]];
    if (isVisibleItem(item)) {
      return item;
    }
  }

  for (i = 0; i < index; i++) {
    item = data[list[i]];
    if (isVisibleItem(item)) {
      return item;
    }
  }
};

module.exports = ListModal;
