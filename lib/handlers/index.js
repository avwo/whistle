
module.exports = [
  './file-proxy',
  './plugin-handler',
  './http-proxy',
  './final-handler',
  './error-handler'].map(function(mod) {
    return require(mod);
  });
