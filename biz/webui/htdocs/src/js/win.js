var $ = require('jquery');

var alertDialog;
var confirmDialog;

function createAlert() {
  if (!alertDialog) {
    alertDialog = $('<div class="modal fade w-win-dialog" tabindex="-1" role="dialog">' + 
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
                    '</div>');
  }
  return alertDialog;
}

function createConfirm() {
  if (!confirmDialog) {
    confirmDialog  = $('<div class="modal fade w-win-dialog" tabindex="-1" role="dialog">' + 
                        '<div class="modal-dialog" role="document">' + 
                          '<div class="modal-content">' +
                            '<div class="modal-body">' +
                              '<pre></pre>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                              '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
                              '<button type="button" class="btn btn-primary">Confirm</button>' +
                            '</div>' +
                          '</div>' +
                        '</div>' +
                      '</div>');
  }
  return confirmDialog;
}

function mockAlert(msg) {
  createAlert();
  alertDialog.find('pre').text(msg);
  alertDialog.modal('show');
}

function mockConfirm(msg, cb) {
  cb(window.confirm(msg));
}

exports.alert = mockAlert;
exports.confirm = mockConfirm;
