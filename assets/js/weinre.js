
;(function() {
  if (typeof window === 'undefined' || window.WeinreServerURL) {
    return;
  }
  window.WeinreServerURL = '$WEINRE_PATH';
  var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  var script = document.createElement('script');
  script.async = true;
  script.charset = 'utf8';
  script.src = '$WEINRE_URL';
  if (head.firstChild) {
    head.insertBefore(script, head.firstChild);
  } else {
    head.appendChild(script);
  }
})();
