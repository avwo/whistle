var $ = require('jquery');
var dataCenter = require('./data-center');
const events = require('./events');
var storage = require('./storage');
var util = require('./util');

var settings = dataCenter.getNetworkColumns();
var sortedCols = Array.isArray(settings.columns) ? settings.columns : [];
var pluginColList = dataCenter.getPluginColumns();

var pluginColsMap = {};

function getDefaultColumns() {
  return [
    {
      title: 'Date',
      name: 'date',
      className: 'date',
      showTitle: true,
      width: 160
    },
    {
      title: 'Result',
      name: 'result',
      className: 'result',
      selected: true,
      width: 65
    },
    {
      title: 'Method',
      name: 'method',
      className: 'method',
      showTitle: true,
      selected: true,
      width: 75
    },
    {
      title: 'Protocol',
      name: 'protocol',
      className: 'protocol',
      selected: true,
      showTitle: true,
      width: 95
    },
    {
      title: 'ClientIP',
      name: 'clientIp',
      className: 'clientIp',
      showTitle: true,
      width: 110
    },
    {
      title: 'ServerIP',
      name: 'hostIp',
      className: 'hostIp',
      selected: true,
      showTitle: true,
      width: 110
    },
    {
      title: 'ClientPort',
      name: 'clientPort',
      className: 'clientPort',
      width: 90
    },
    {
      title: 'ServerPort',
      name: 'serverPort',
      className: 'serverPort',
      width: 90
    },
    {
      title: 'Host',
      name: 'hostname',
      className: 'hostname',
      selected: true,
      showTitle: true,
      width: 150
    },
    {
      title: 'URL',
      name: 'path',
      className: 'path',
      selected: true,
      locked: true,
      minWidth: 60
    },
    {
      title: 'Type',
      name: 'type',
      className: 'type',
      selected: true,
      showTitle: true,
      width: 125
    },
    {
      title: 'Body',
      showTitle: true,
      name: 'body',
      className: 'body',
      width: 90
    },
    {
      title: 'Encoding',
      name: 'contentEncoding',
      className: 'contentEncoding',
      width: 90
    },
    {
      title: 'DNS',
      name: 'dns',
      className: 'dns',
      width: 70
    },
    {
      title: 'Request',
      name: 'request',
      className: 'request',
      width: 90
    },
    {
      title: 'Response',
      name: 'response',
      className: 'response',
      width: 90
    },
    {
      title: 'Download',
      name: 'download',
      className: 'download',
      width: 90
    },
    {
      title: 'Time',
      name: 'time',
      className: 'time',
      selected: true,
      width: 70
    },
    {
      title: 'Custom1',
      name: 'custom1',
      className: 'custom1',
      showTitle: true,
      width: 120
    },
    {
      title: 'Custom2',
      name: 'custom2',
      className: 'custom2',
      showTitle: true,
      width: 160
    }
  ];
}

var columnsMap;
var curColumns;
var buildInCols;
var colWidthData;

function updateColumns(reseted) {
  buildInCols = buildInCols || getDefaultColumns();
  curColumns = buildInCols.concat(pluginColList);
  curColumns.forEach(function (col) {
    var menus = [];
    var curWidth = colWidthData[col.name];
    var hasSelected;
    var width = col.minWidth || col.width;
    var icon = col.minWidth ? '>= ' : '';
    var round = width % 2 ? 5 : 0;
    for (var i = 0; i < 11; i++) {
      var w = width + i * 60 + round;
      var selected = curWidth === w;
      hasSelected = hasSelected || selected;
      if (i) {
        menus.push({ name: icon + w + 'px', action: w, selected: selected });
      } else {
        menus.push({ name: icon + width + 'px (Default)', action: w, selected: selected });
      }
    }
    columnsMap[col.name] = col;
    col.menus = menus;
    if (!hasSelected) {
      menus[0].selected = true;
      colWidthData[col.name] = menus[0].action;
    }
  });
  if (reseted) {
    sortedCols = curColumns;
  }
  sortColumns();
}

function reset(init) {
  columnsMap = {};
  if (init) {
    try {
      colWidthData = JSON.parse(storage.get('networkColumnsWidth'));
    } catch (e) {}
    colWidthData = colWidthData || {};
  } else {
    colWidthData = {};
  }
  updateColumns(!init);
  if (!init) {
    save();
    storage.set('networkColumnsWidth');
  }
}

function sortColumns() {
  var columns = [];
  sortedCols.forEach(function(col) {
    var name = col && col.name;
    col = name && columnsMap[name];
    if (col && curColumns.indexOf(col) !== -1 && columns.indexOf(col) === -1) {
      columns.push(col);
    }
  });
  curColumns.forEach(function(col) {
    if (columns.indexOf(col) === -1) {
      columns.push(col);
    }
  });
  curColumns = columns;
  settings = { columns: curColumns };
}

reset(true);

function save() {
  settings.columns = curColumns;
  dataCenter.setNetworkColumns(settings);
}

exports.getColumn = function (name) {
  return columnsMap[name];
};

function moveTo(name, targetName) {
  if (name === targetName) {
    return;
  }
  var col = columnsMap[name];
  var target = columnsMap[targetName];
  if (!col || !target) {
    return;
  }
  var fromIndex = curColumns.indexOf(col);
  var toIndex = curColumns.indexOf(target);
  curColumns.splice(fromIndex, 1);
  curColumns.splice(toIndex, 0, col);
  save();
}

exports.getAllColumns = function () {
  return curColumns;
};
exports.reset = reset;
exports.setSelected = function (name, selected) {
  var col = columnsMap[name];
  if (col) {
    col.selected = selected !== false;
    save();
  }
};
exports.getSelectedColumns = function () {
  var width = 50;
  var list = curColumns.filter(function (col) {
    if (col.selected || col.locked || col.isPlugin) {
      width += colWidthData[col.name] || col.width || col.minWidth;
      return true;
    }
  });
  return {
    width: width,
    style: { minWidth: width },
    list: list
  };
};

var COLUMN_TYPE_PREFIX = 'networkcolumn$';
var curTarget;

function getTarget(e) {
  var target = e.target;
  var nodeName = target.nodeName;
  if (nodeName === 'TH' || nodeName === 'LABEL') {
    return target;
  }
  target = target.parentNode;
  if (target) {
    nodeName = target.nodeName;
    if (nodeName === 'TH' || nodeName === 'LABEL') {
      return target;
    }
  }
}

function getDragInfo(e) {
  var target = getTarget(e);
  var name = target && target.getAttribute('data-name');
  if (!name) {
    return;
  }
  var fromName = getNameFromTypes(e);
  if (fromName && name.toLowerCase() !== fromName) {
    return {
      target: target,
      toName: name
    };
  }
}

function getNameFromTypes(e) {
  var type = util.findArray(e.dataTransfer.types, function (type) {
    if (type.indexOf(COLUMN_TYPE_PREFIX) === 0) {
      return true;
    }
  });
  return type && type.substring(COLUMN_TYPE_PREFIX.length);
}

$(document).on('drop', function () {
  if (curTarget) {
    curTarget.style.background = '';
  }
  curTarget = null;
});

exports.getDragger = function () {
  return {
    onDragStart: function (e) {
      var target = getTarget(e);
      var name = target && target.getAttribute('data-name');
      e.dataTransfer.setData(COLUMN_TYPE_PREFIX + name, 1);
      e.dataTransfer.setData('-' + COLUMN_TYPE_PREFIX, name);
    },
    onDragEnter: function (e) {
      var info = getDragInfo(e);
      if (info) {
        curTarget = info.target;
        curTarget.style.background = '#ddd';
      }
    },
    onDragLeave: function (e) {
      var info = getDragInfo(e);
      if (info) {
        info.target.style.background = '';
      }
    },
    onDrop: function (e) {
      var info = getDragInfo(e);
      if (info) {
        var fromName = e.dataTransfer.getData('-' + COLUMN_TYPE_PREFIX);
        moveTo(fromName, info.toName);
        info.target.style.background = '';
        if (typeof this.onColumnsResort === 'function') {
          this.onColumnsResort();
        }
      }
    }
  };
};

exports.setWidth = function(name, width) {
  colWidthData[name] = parseInt(width);
  storage.set('networkColumnsWidth', JSON.stringify(colWidthData));
};

exports.getWidth = function(col) {
  return colWidthData[col.name] || col.width || col.minWidth;
};

events.on('pluginColumnsChange', function() {
  var map = {};
  pluginColList = dataCenter.getPluginColumns().map(function(col) {
    map[col.name] = col;
    var oldCol = pluginColsMap[col.name];
    if (oldCol) {
      oldCol.title = col.title;
      oldCol.key = col.key;
      oldCol.width = col.width;
      return oldCol;
    }
    return col;
  });
  pluginColsMap = map;
  updateColumns();
  events.trigger('onColumnsChanged');
});
