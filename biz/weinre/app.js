
module.exports = function init(server) {
  require('E:/workbench/workspace/github/weinre').run({
    server: server,
    verbose: false,
    debug: false,
    readTimeout: 10,
    deathTimeout: 60
  });
};
