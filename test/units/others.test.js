var util = require('../util.test');

module.exports = function() {
  util.request('http://unknownprotocol.w2.org/index.html?doNotParseJson', function(res, data) {
    res.statusCode.should.be.equal(502);
  });
};
