var enableProxy = require('../../bin/proxy').enableProxy;

console.log(enableProxy({
  host: '127.0.0.1',
  port: 8899,
  bypass: '<local>',
}) + '');
