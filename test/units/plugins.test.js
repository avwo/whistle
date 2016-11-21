var util = require('../util.test');

module.exports = function() {
  util.request('http://t.tt.com/index.html?doNotParseJson', function(res, body) {
    console.log(body);
  });
};
