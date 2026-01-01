module.exports = [
  './file-proxy',
  './http-proxy',
  './error-handler'
].map(function (mod) {
  return require(mod);
});
