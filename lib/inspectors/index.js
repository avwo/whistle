module.exports = [
  './rules',
  './req',
  './data',
  './res'
].map(function (mod) {
  return require(mod);
});
