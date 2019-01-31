var util = require('../util.test');

module.exports = function() {
  util.request('http://js1.test.whistlejs.com/index.html?resBody=_', function(res, body) {
    body.should.equal('_\r\n<script>js</script>');
  });

  util.request({
    method: 'post',
    url: 'https://js2.test.whistlejs.com/index.html?resBody=_'
  }, function(res, body) {
    body.should.equal('_\r\njs');
  });

  util.request({
    method: 'post',
    url: 'https://js3.test.whistlejs.com/index.html?resBody=_'
  }, function(res, body) {
    body.should.equal('_');
  });
  util.request('http://jsbody2.whistlejs.com/index.html?resBody=_', function(res, body) {
    body.should.equal('<!DOCTYPE html>\r\n<script src="http://1"></script>\r\n0\r\n<script src="https://2"></script>');
  });
};
