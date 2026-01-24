exports.statsServer = function(server, options) {
  server.on('request', function(req, res) {
    res.end();
  });
};

exports.auth = function(req) {
  var url = req.fullUrl;
  if (url.indexOf('/test-plugin-auth-hook/') === -1) {
    return true;
  }
  if (url.indexOf('/test-plugin-auth-hook/forbidden/login') !== -1) {
    req.setLogin(true);
    req.setHtml('test-plugin-auth-hook/login');
    return false;
  }
  if (url.indexOf('/test-plugin-auth-hook/redirect') !== -1) {
    req.setRedirect('https://test/test-plugin-auth-hook/redirect');
    return false;
  }
  if (url.indexOf('/test-plugin-auth-hook/forbidden') !== -1) {
    req.setHtml('test-plugin-auth-hook');
    return false;
  }
  req.setUrl('http://127.0.0.1:8080');
  return false;
};
