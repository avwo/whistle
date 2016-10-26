var util = require('../util.test');

module.exports = function() {
  util.request('http://ssi-include.whistlejs.com/index.html?doNotParseJson', function(res, data) {
    data.should.be.containEql('ssi1.html');
    data.should.be.containEql('ssi2.html');
    data.should.be.containEql('ssi3.html');
  });
};