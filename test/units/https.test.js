var util = require('../util.test');
var config = require('../config.test');

module.exports = function() {
  util.request('https://127.0.0.1:8080/auto2http.html', function(res, data) {
    data.url.should.be.equal('/auto2http.html');
  });
  util.request('https://https.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });

  util.request('https://https1.w2.org:' + config.httpsPort + '/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });
  
  util.request('http://https1.w2.org:' + config.serverPort + '/index.html', function(res, data) {
    data.type.should.be.equal('server');
  });
  
  util.request('https://https2.w2.org:' + config.httpsPort + '/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });
  
  util.request('http://https2.w2.org/index.html', function(res, data) {
    data.type.should.be.equal('server');
  });
  
  util.request('https://https3.w2.org:5566/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });
};
