
function mockAlert(msg) {
  window.alert(msg);
}

function mockConfirm(msg, cb) {
  cb(window.confirm(msg));
}

exports.alert = mockAlert;
exports.confirm = mockConfirm;
