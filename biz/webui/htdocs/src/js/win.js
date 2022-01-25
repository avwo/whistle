var $ = require('jquery');

var alertDialog;
var confirmDialog;
var handleConfirm;

function createAlert() {
  if (!alertDialog) {
    alertDialog = $(
      '<div class="modal fade w-win-dialog" tabindex="-1" role="dialog">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-body">' +
        '<pre class="alert alert-danger"></pre>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    );
  }
  return alertDialog;
}

function createConfirm() {
  if (!confirmDialog) {
    confirmDialog = $(
      '<div class="modal fade w-win-dialog" tabindex="-1" role="dialog">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-body">' +
        '<pre></pre>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-default w-win-cancel" data-dismiss="modal">Cancel</button>' +
        '<button type="button" class="btn btn-primary w-win-confirm" data-dismiss="modal">Confirm</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    );
    confirmDialog.on('click', '.w-win-cancel', function () {
      if (typeof handleConfirm === 'function') {
        handleConfirm(false);
      }
      handleConfirm = null;
    });
    confirmDialog.on('click', '.w-win-confirm', function () {
      if (typeof handleConfirm === 'function') {
        handleConfirm(true);
      }
      handleConfirm = null;
    });
  }
  return confirmDialog;
}

function mockAlert(msg) {
  createAlert();
  alertDialog.find('pre').text(msg);
  alertDialog.modal('show');
}

function mockConfirm(msg, cb) {
  createConfirm();
  if (confirmDialog.is(':visible')) {
    return;
  }
  handleConfirm = cb;
  confirmDialog.find('pre').text(msg);
  confirmDialog.modal('show');
}

exports.alert = mockAlert;
exports.confirm = mockConfirm;
