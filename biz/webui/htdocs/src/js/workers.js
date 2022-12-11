var events = require('./events');

var workers = {};
var modal;
var updateTimer;

function isEnd(item) {
  return item.endTime || item.lost;
}

function assign(o1, o2) {
  if (typeof Object.assign === 'function') {
    Object.assign(o1, o2);
  } else {
    Object.keys(o2).forEach(function(key) {
      o1[key] = o2[key];
    });
  }
}

function getString(str) {
  if (!str || typeof str !== 'string') {
    return;
  }
  return str;
}

function setCustomData(item, newData) {
  var data = item.customData || {};
  item.customData = data;
  assign(data, newData);
  var style = data.style;
  if (style) {
    var color = getString(style.color);
    var fontStyle = getString(style.fontStyle);
    var backgroundColor = getString(style.backgroundColor || style.bgColor);
    if (color || fontStyle || backgroundColor) {
      style = item.style || {};
      item.style = style;
      style.color = style.color || color;
      style.fontStyle = style.fontStyle || fontStyle;
      style.backgroundColor = style.backgroundColor || backgroundColor;
    }
  }
}

function updateUI() {
  if (updateTimer) {
    return;
  }
  updateTimer = setTimeout(function() {
    updateTimer = null;
    events.trigger('updateUI');
  }, 300);
}

function setWorker(id) {
  if (workers[id] || !window.Worker) {
    return;
  }
  var worker = new Worker('web-worker.js?id=' + id);
  var _destroy = function() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      destroy(worker);
    }
  };
  var timer = setTimeout(_destroy, 16000);
  worker.onerror = _destroy;
  worker.onmessage = function(e) {
    var data = e.data;
    if (data === true) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        modal.list.forEach(function(item) {
          if (isEnd(item)) {
            worker.postMessage(item);
          }
        });
        workers[id] = worker;
      }
      return;
    }
    if (data && data.id && data.data) {
      var item = modal.getItem(data.id);
      if (item) {
        setCustomData(item, data.data);
        updateUI();
      }
    }
  };
}

function destroy(worker) {
  worker.terminate();
  worker.onmessage = null;
  worker.onerror = null;
  worker.onmessageerror = null;
}

function removeWorker(id) {
  var worker = workers[id];
  if (worker) {
    delete workers[id];
    destroy(worker);
  }
}

exports.updateWorkers = function(list) {
  Object.keys(workers).forEach(function(id) {
    if (list.indexOf(id) === -1) {
      removeWorker(id);
    }
  });
  list.forEach(setWorker);
};

exports.postMessage = function(item) {
  if (isEnd(item)) {
    Object.keys(workers).forEach(function(key) {
      workers[key].postMessage(item);
    });
  }
};

exports.setup = function(m) {
  modal = m;
};
