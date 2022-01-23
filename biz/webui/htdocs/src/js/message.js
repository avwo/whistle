var $ = require('jquery');
require('../css/message.css');

var cache = {};

function showMessage(msg, level) {
  if (level === 'warn') {
    level = 'warning';
  } else if (level === 'error') {
    level = 'danger';
  }
  var elem = cache[level];
  if (!elem) {
    elem = $('<div class="alert alert-' + level + ' w-message"></div>');
    elem.appendTo(document.body);
    cache[level] = elem;
  }
  elem.text(msg);
  elem.stop(true, true).show();
  elem.css('marginLeft', -elem[0].offsetWidth / 2);
  elem.delay(2000).fadeOut(1600);
  return elem;
}

['error', 'warn', 'info', 'success'].forEach(function (level) {
  exports[level] = function (msg) {
    return showMessage(msg, level);
  };
});
