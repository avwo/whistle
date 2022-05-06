var enableProxy = require('../../bin/proxy').enableProxy;

enableProxy({
  host: '127.0.0.1',
  port: 8899,
  bypass: '<local>',
});
