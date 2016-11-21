var util = require('../util.test');

module.exports = function() {
  util.request('http://t.tt.com/?doNotParseJson', function(res, body) {
    console.log(body);
  });
};
