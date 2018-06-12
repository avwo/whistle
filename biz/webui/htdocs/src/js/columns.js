var $ = require('jquery');
var dataCenter = require('./data-center');
var util = require('./util');

var settings = dataCenter.getNetworkColumns();

function getDefaultColumns() {

  return [
    {
      title: 'Date',
      name: 'date',
      className: 'date',
      showTitle: true
    },
    {
      title: 'Result',
      name: 'result',
      className: 'result',
      selected: true
    },
    {
      title: 'Method',
      name: 'method',
      className: 'method',
      selected: true
    },
    {
      title: 'Protocol',
      name: 'protocol',
      className: 'protocol',
      selected: true
    },
    {
      title: 'ClientIP',
      name: 'clientIp',
      className: 'clientIp',
      showTitle: true
    },
    {
      title: 'ServerIP',
      name: 'hostIp',
      className: 'hostIp',
      selected: true,
      showTitle: true
    },
    {
      title: 'ClientPort',
      name: 'clientPort',
      className: 'clientPort'
    },
    {
      title: 'ServerPort',
      name: 'serverPort',
      className: 'serverPort'
    },
    {
      title: 'Host',
      name: 'hostname',
      className: 'hostname',
      selected: true,
      showTitle: true
    },
    {
      title: 'URL',
      name: 'path',
      className: 'path',
      selected: true
    },
    {
      title: 'Type',
      name: 'type',
      className: 'type',
      selected: true,
      showTitle: true
    },
    {
      title: 'Body',
      name: 'body',
      className: 'body'
    },
    {
      title: 'Encoding',
      name: 'contentEncoding',
      className: 'contentEncoding'
    },
    {
      title: 'DNS',
      name: 'dns',
      className: 'dns'
    },
    {
      title: 'Request',
      name: 'request',
      className: 'request'
    },
    {
      title: 'Response',
      name: 'response',
      className: 'response'
    },
    {
      title: 'Download',
      name: 'download',
      className: 'download'
    },
    {
      title: 'Time',
      name: 'time',
      className: 'time',
      selected: true
    }
  ];
}

function filterSelected(item) {
  return item.selected;
}

var columnsMap;
var curColumns;
var DEFAULT_SELECTED_COLUMNS = getDefaultColumns().filter(filterSelected);

function reset() {
  columnsMap = {};
  curColumns = getDefaultColumns();
  curColumns.forEach(function(col) {
    columnsMap[col.name] = col;
  });
}

reset();
if (Array.isArray(settings.columns)) {
  var flagMap = {};
  var checkColumn = function(col) {
    var name = col && col.name;
    if (!name || flagMap[name] || !columnsMap[name]) {
      return false;
    }
    flagMap[name] = 1;
    return true;
  };
  var columns = settings.columns.filter(checkColumn);
  if (columns.length === curColumns.length) {
    curColumns = columns.map(function(col) {
      var curCol = columnsMap[col.name];
      curCol.selected = !!col.selected;
      return curCol;
    });
  }
}

settings = {
  disabledColumns: !!settings.disabledColumns,
  columns: curColumns
};

function save() {
  settings.columns = curColumns;
  dataCenter.setNetworkColumns(settings);
}

exports.isDisabled = function() {
  return settings.disabledColumns;
};

function moveTo(name, targetName) {
  if (settings.disabledColumns || name === targetName) {
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

exports.disable = function(disabled) {
  settings.disabledColumns = disabled !== false;
  save();
};

exports.getAllColumns = function() {
  return curColumns;
};
exports.reset = function() {
  reset();
  save();
};
exports.setselected = function(name, selected) {
  var col = columnsMap[name];
  if (col) {
    col.selected = selected !== false;
    save();
  }
};
exports.getSelectedColumns = function() {
  if (settings.disabledColumns) {
    return DEFAULT_SELECTED_COLUMNS;
  }
  return curColumns.filter(filterSelected);
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
  var type = util.findArray(e.dataTransfer.types, function(type) {
    if (type.indexOf(COLUMN_TYPE_PREFIX) === 0) {
      return true;
    }
  });
  return type && type.substring(COLUMN_TYPE_PREFIX.length);
}

$(document).on('drop', function() {
  if (curTarget) {
    curTarget.style.background = '';
  }
  curTarget = null;
});

exports.getDragger = function() {

  return {
    onDragStart: function(e) {
      var target = getTarget(e);
      var name = target && target.getAttribute('data-name');
      e.dataTransfer.setData(COLUMN_TYPE_PREFIX + name, 1);
      e.dataTransfer.setData('-' + COLUMN_TYPE_PREFIX, name);
    },
    onDragEnter: function(e) {
      var info = getDragInfo(e);
      if (info) {
        curTarget = info.target;
        curTarget.style.background = '#ddd';
      }
    },
    onDragLeave: function(e) {
      var info = getDragInfo(e);
      if (info) {
        info.target.style.background = '';
      }
    },
    onDrop: function(e) {
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
