var net = require('net');
var util = require('../util.test');

module.exports = function() {
  var normalizeConnectArgs = function() {
    return net._normalizeConnectArgs(arguments);
  };
  var path1 = normalizeConnectArgs('test');
  var path2 = normalizeConnectArgs('test', util.noop);
  var port1 = normalizeConnectArgs('8899');
  var port2 = normalizeConnectArgs('8899', 'www.test.com');
  var port3 = normalizeConnectArgs('8899', 'www.test.com', util.noop);
  path1.length.should.be.equal(1);
  path1[0].path.should.be.equal('test');
  path2.length.should.be.equal(2);
  path2[0].path.should.be.equal('test');
  path2[1].should.be.equal(util.noop);
  port1.length.should.be.equal(1);
  port1[0].port.should.be.equal('8899');
  port2.length.should.be.equal(1);
  port2[0].port.should.be.equal('8899');
  port2[0].host.should.be.equal('www.test.com');
  port3.length.should.be.equal(2);
  port3[0].port.should.be.equal('8899');
  port3[0].host.should.be.equal('www.test.com');
  port3[1].should.be.equal(util.noop);
};
