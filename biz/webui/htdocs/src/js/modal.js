var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');

function createModal(options, callback) {
  var container = document.createElement('div');
  document.body.appendChild(container);
  ReactDOM.render((<Dialog customRef={function(d) {
    document.body.removeChild(container);
    callback(d);
  }} onClose={options.onClose}>
    <div className="modal-header">
    <h4>asfasfsadf</h4>
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

exports.show = function(options) {
  var destroyed, dialog;
  var onClose = options.onClose;
  options.onClose = function() {
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
  });
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
  options.onClose = function() {
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
  });
  return {
    show: function(html) {
      if (!dialog) {
        return;
      }
      dialog.show();
    },
    hide: function(destroy) {
      destroyed = destroy;
      dialog && dialog.hide();
    }
  };
};
