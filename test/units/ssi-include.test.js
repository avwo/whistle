var util = require('../util.test');

module.exports = function() {
  util.request('http://ssi-include.whistlejs.com/index.html?doNotParseJson', function(res, data) {
    data.should.be.containEql('include1.html');
    data.should.be.containEql('include2.html');
    data.should.be.containEql('include3.html');
  });
};
