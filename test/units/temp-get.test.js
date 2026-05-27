
var util = require('../util.test');

module.exports = function() {
  // Path traversal: absolute path should be blocked (no auth configured)
  util.request('http://local.whistlejs.com/cgi-bin/temp/get?filename=/etc/passwd', function(res, data) {
    data.should.have.property('forbidden', true);
  });
  // Path traversal: relative path should be blocked
  util.request('http://local.whistlejs.com/cgi-bin/temp/get?filename=../../etc/passwd', function(res, data) {
    data.should.have.property('forbidden', true);
  });
  // Empty filename should be blocked
  util.request('http://local.whistlejs.com/cgi-bin/temp/get?filename=', function(res, data) {
    data.should.have.property('forbidden', true);
  });
  // Valid temp file (64-char hex) should not be forbidden (file not found is ok)
  util.request('http://local.whistlejs.com/cgi-bin/temp/get?filename=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', function(res, data) {
    data.should.have.property('ec');
    data.should.not.have.property('forbidden');
  });
};
