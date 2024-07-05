
;(function() {
  if (typeof window === 'undefined' || window.WeinreServerURL) {
    return;
  }
  var prefixPath = window.__WHISTLE_PATH_PREFIX__;
  if (/^\/[\w./-]+$/.test(prefixPath) && prefixPath.length <= 128) {
    var len = prefixPath.length - 1;
    if (prefixPath[len] === '/') {
      prefixPath = prefixPath.substring(0, len);
    }
  } else {
    prefixPath = '';
  }
  var baseUrl = '$BASE_URL' + prefixPath;
  window.WeinreServerURL = baseUrl + '$WEINRE_PATH';
  var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  var script = document.createElement('script');
  script.async = true;
  script.charset = 'utf8';
  script.src = baseUrl + '$WEINRE_URL';
  if (head.firstChild) {
    head.insertBefore(script, head.firstChild);
  } else {
    head.appendChild(script);
  }
})();
