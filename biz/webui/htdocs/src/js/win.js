
function alert(msg) {
  window.alert(msg);
}

function confirm(msg, cb) {
  if (window.confirm(msg)) {
    cb();
  }
}

exports.alert = alert;
exports.confirm = confirm;
