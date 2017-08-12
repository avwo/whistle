var ws = require('ws');
var http = require('http');
var https = require('https');

function WebSocket(address, protocols, options) {
  if (this instanceof WebSocket === false) {
    return new WebSocket(address, protocols, options);
  }
  var self = this;
  var httpReq = http.request;
  var httpsReq = https.request;
  http.request = function(opts) {
    self.req = opts;
    httpReq.apply(this, arguments);
  };
  https.request = function(opts) {
    self.req = opts;
    httpsReq.apply(this, arguments);
  };
  ws.apply(this, arguments);
  http.request = httpReq;
  https.request = httpsReq;
  ws.call(this, address, protocols, options);
}
WebSocket.prototype = ws.prototype;

module.exports = WebSocket;
