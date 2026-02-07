var assert = require('assert');

exports.server = function(server, options) {
  const streamUtils = options.streamUtils;

  server.on('request', function(req, res) {
    var remoteAddr = req.originalReq.remoteAddress;
    assert(remoteAddr === '127.0.0.1' || remoteAddr === '6.6.6.6');
    assert(req.clientIp === '3.3.5.5' || req.clientIp === '5.5.5.5');
    switch (req.headers['x-test-cmd']) {
    case 'reqBuffer':
      // 出错不用管
      streamUtils.readBuffer(req, function(buffer) {
        // url 为空自动采用当前请求的 url
        var body = Buffer.concat([buffer, Buffer.from(' reqBuffer')]);
        // 不用自己处理错误，可以忽略回调函数，Whistle 会自动返回给客户端
        req.request({ body: body }/*, function(svrRes) {
          res.writeHead(svrRes.statusCode, svrRes.statusMessage, svrRes.headers);
          svrRes.pipe(res);
        }*/);
      });
      return;
    case 'reqText':
      // 出错不用管
      streamUtils.readText(req, function(text) {
        req.request({ body: text + ' reqText' }/*, function(svrRes) {
          res.writeHead(svrRes.statusCode, svrRes.statusMessage, svrRes.headers);
          svrRes.pipe(res);
        }*/);
      });
      return;
    case 'reqJson':
      // 出错不用管
      streamUtils.readJson(req, function(data) {
        data.a.b.c = 'streamUtils.readJson';
        req.request({ body: JSON.stringify(data) }/*, function(svrRes) {
          res.writeHead(svrRes.statusCode, svrRes.statusMessage, svrRes.headers);
          svrRes.pipe(res);
        }*/);
      });
      return;
    case 'reqJson2':
      // 另外一种获取请求体的方式，功能和上面完全一样，参数和回调函数的用法也完全一样
      req.passThrough({
        transformReq: function(req, next) {
          // getBuffer, getText, getJson 都可以用来获取请求体，参数和回调函数的用法也完全一样
          req.getJson(function(err, data) {
            if (err) {
              return next();
            }
            data.a.b.c = 'streamUtils.readJson';
            next(JSON.stringify(data));
          });
        }
      });
      return;
    case 'resBuffer':
      var client = req.request(function(svrRes) {
        streamUtils.readBuffer(svrRes, function(buffer) {
          var body = Buffer.concat([Buffer.from('['), buffer, Buffer.from(']')]);
          delete svrRes.headers['content-length'];
          res.writeHead(svrRes.statusCode, svrRes.statusMessage, svrRes.headers);
          res.end(body);
        });
      });
      req.pipe(client);
      return;
    case 'resText':
      req.passThrough({
        transformRes: function(svrRes, next) {
          svrRes.getText(function(err, text) {
            if (err) {
              return next();
            }
            next('[' + text + ', 123' + ']');
          });
        }
      });
      return;
    case 'resJson':
      req.passThrough({
        transformRes: function(svrRes, next) {
          svrRes.getJson(function(err, data) {
            if (err) {
              return next();
            }
            data.type = {a: {b: {c: 'readJson'}}};
            next(JSON.stringify(data));
          });
        }
      });
      return;
    default:
      req.passThrough();
    }
  });
};
