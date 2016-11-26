var util = require('../util.test');

module.exports = function() {
  util.request('http://delete.test.whistlejs.com/index.html', function(res, data) {
    data.headers.should.not.have.property('x-delete-all');
    data.headers.should.not.have.property('x-delete-req');
    res.headers.should.not.have.property('x-delete-res');
  });

  util.request({
    method: 'post',
    headers: {
      'x-delete-test': 123
    },
    url: 'https://delete.test.whistlejs.com/index.html'
  }, function(res, data) {
    data.headers.should.have.property('x-delete-test');
    data.headers.should.not.have.property('x-delete-all');
    data.headers.should.not.have.property('x-delete-req');
    res.headers.should.not.have.property('x-delete-res');
  });
  
  util.request('http://delete1.test.whistlejs.com/index.html', function(res, data) {
//    data.headers.should.have.property('x-delete-all');
//    data.headers.should.have.property('x-delete-req');
//    res.headers.should.have.property('x-delete-res');
    console.log(req.headers, data.headers);
  });

  util.request({
    method: 'post',
    headers: {
      'x-delete-test': 123
    },
    url: 'https://delete1.test.whistlejs.com/index.html'
  }, function(res, data) {
//    data.headers.should.have.property('x-delete-test');
//    data.headers.should.have.property('x-delete-all');
//    data.headers.should.have.property('x-delete-req');
//    res.headers.should.have.property('x-delete-res');
    console.log(req.headers, data.headers);
  });
};
