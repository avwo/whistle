var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
require('../css/modal.css');

var GLOBAL_VAR = '__WHISTLE_MODAL_' + Date.now() + '_' + Math.floor(Math.random() * 1000) + '_';
var flag = 0;

function getFlag() {
  if (++flag > 100) {
    flag = 0;
  }
  return flag;
}

function removeWinField(name) {
  try {
    delete window[name];
  } catch (e) {
    window[name] = undefined;
  }
}

function createModal(options, callback, gVarName) {
  var container = document.createElement('div');
  document.body.appendChild(container);
  if (options.methods) {
    window[gVarName] = options.methods;
  }
  ReactDOM.render((<Dialog width={options.width} height={options.height}
    wclassName="w-dialog-for-plguin"
    customRef={function(d) {
      document.body.removeChild(container);
      initModal(d, options, gVarName);
      callback(d);
    }} onClose={options.onClose}>
    <div className="modal-header">
      <h4></h4>
      <button type="button" className="close" data-dismiss="modal">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div className="modal-body"></div>
    <div className="modal-footer">
      <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
    </div>
  </Dialog>), container);
}

function addEvents(html, gVarName) {
  if (!html || typeof html !== 'string') {
    return html;
  }
  return html.replace(/\s(on[a-z]+=)"([^"]+)"/g, function(all, name, handle) {
    var index = handle.indexOf('(');
    var args;
    if (index === -1) {
      args = '(event)';
    } else {
      args = handle.substring(index);
      handle = handle.substring(0, index);
    }
    handle = gVarName + '[\'' + handle + '\']' + args;
    return ' ' + name + '"' + handle + '"';
  });
}

function updateCtn(con, html, name) {
  var elem = con.find('.modal-content>.modal-' + name + ':first');
  if (html != null) {
    elem.html(html);
  } else if (html === false || html === null) {
    elem.hide();
  }
}

function initModal(dialog, options, gVarName) {
  options = options || '';
  var title = options.title;
  var body = addEvents(options.body, gVarName);
  var footer = addEvents(options.footer, gVarName);
  var con = dialog.container;
  var headerElem = con.find('.modal-content>.modal-header:first');
  if (!title || typeof title !== 'string') {
    if (title === false || title === '') {
      headerElem.hide();
    }
  } else {
    headerElem.show().find('h4').html(title);
  }
  updateCtn(con, body, 'body');
  updateCtn(con, footer, 'footer');
}

exports.show = function(options) {
  var destroyed, dialog;
  var onClose = options.onClose;
  var gVarName = GLOBAL_VAR + getFlag();
  options.onClose = function() {
    removeWinField(gVarName);
    dialog && dialog.destroy();
    dialog = null;
    if (typeof onClose === 'function') {
      onClose.call(options);
    }
  };
  createModal(options, function(d) {
    dialog = d;
    if (destroyed) {
      d.hide();
    } else {
      d.show();
    }
  }, gVarName);
  return function() {
    if (!destroyed && dialog) {
      destroyed = true;
      dialog.hide();
    }
  };
};

exports.create = function(options) {
  var destroyed, dialog;
  var onClose = options.onClose;
  var gVarName = GLOBAL_VAR + getFlag();
  options.onClose = function() {
    removeWinField(gVarName);
    if (destroyed) {
      dialog && dialog.destroy();
      dialog = null;
    }
    if (typeof onClose === 'function') {
      onClose.call(options);
    }
  };
  createModal(options, function(d) {
    dialog = d;
    if (destroyed) {
      d.destroy();
    }
  }, gVarName);
  return {
    show: function(options) {
      if (dialog) {
        if (options && options.methods) {
          window[gVarName] = options.methods;
        }
        dialog.show();
        initModal(dialog, options, gVarName);
      }
    },
    hide: function(destroy) {
      destroyed = destroy;
      if (dialog) {
        if (dialog.container.is(':visible')) {
          dialog.hide();
        } else if (destroyed) {
          dialog.destroy();
        }
      }
    }
  };
};
