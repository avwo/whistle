var fs = require('fs');
var path = require('path');
var parseUrl = require('../../lib/util/parse-url');
var zlib = require('../../lib/util/zlib');

var delims = ['<', '>', '"', '`', ' '];
var unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims);
var autoEscape = ['\''].concat(unwise).join('');
var emptyGzipContent = fs.readFileSync(path.join(__dirname, '../assets/files/empty.txt'));
var testGzipContent = fs.readFileSync(path.join(__dirname, '../assets/files/test.txt'));


module.exports = function() {
  var path = '/$%^{}?{{}}嗖嗖嗖' + autoEscape;
  var options = parseUrl('http://www.qq.com:8888' + path + '#hash' + autoEscape);
  options.path.should.be.equal(path);
  options.port.should.be.equal('8888');
  options.host.should.be.equal('www.qq.com:8888');
  options.hostname.should.be.equal('www.qq.com');
  options.pathname.should.be.equal(path.replace(/[\?#].*$/, ''));
  options.protocol.should.be.equal('http:');
  options = parseUrl('http://www.qq.com' + path + '#hash' + autoEscape);
  options.path.should.be.equal(path);
  (options.port + '').should.be.equal('null');
  options.host.should.be.equal('www.qq.com');
  options.hostname.should.be.equal('www.qq.com');
  options.pathname.should.be.equal(path.replace(/[\?#].*$/, ''));
  options.protocol.should.be.equal('http:');
  zlib.gunzip(emptyGzipContent, function(err, content) {
    content.length.should.be.equal(0);
  });
  zlib.gunzip(testGzipContent, function(err, content) {
    (content + '').should.be.equal('test');
  });
};

