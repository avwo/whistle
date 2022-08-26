var net = require('net');
var fs = require('fs');
var path = require('path');
var installRootCA = require('./index');
var util = require('../util');
var fileMgr = require('../../lib/util/file-mgr');
var httpMgr = require('../../lib/util/http-mgr');
var commonUtil = require('../../lib/util/common');
var config = require('../../lib/config');

var NUM_RE = /^\d+$/;
var HOST_SUFFIX_RE = /\:(\d+|auto)?$/;
var HOST_RE = /^[a-z\d_-]+(?:\.[a-z\d_-]+)*$/i;
var URL_RE = /^https?:\/\/./i;
var MAX_LEN = 1024 * 1024;

function installCert(certFile, url) {
  try {
    installRootCA(fileMgr.convertSlash(certFile));
    util.info('Install root CA (' + (url || certFile) + ') successful.');
  } catch (e) {
    util.error(e.message);
  }
}

function install(addr) {
  if (addr.file) {
    return installCert(addr.file);
  }
  addr.needRawData = true;
  addr.maxLength = MAX_LEN;
  addr.headers = {
    'user-agent': 'whistle/' + config.name
  };
  httpMgr.request(addr, function(err, body, res) {
    if (err) {
      return util.error(err.message);
    }
    if (res.statusCode != 200) {
      return util.error('Bad response (' + res.statusCode + ').');
    }
    if (!body || !body.length) {
      return util.error('No content.');
    }
    var tempFile = path.join(commonUtil.getWhistlePath(), Date.now() + '-' + util.getHash(addr.url) + '.crt');
    fs.writeFileSync(tempFile, body);
    installCert(tempFile, addr.url);
    fs.unlinkSync(tempFile);
  });
}

module.exports = function(argv) {
  var options = {};
  argv.forEach(function(arg) {
    if (NUM_RE.test(arg)) {
      delete options.addr;
      options.port = parseInt(arg, 10) || options.port;
    } else if (net.isIP(arg)) {
      delete options.addr;
      options.host = arg || options.host;
    } else if (HOST_SUFFIX_RE.test(arg)) {
      delete options.port;
      delete options.addr;
      var port = RegExp.$1;
      if (port > 0) {
        options.port = parseInt(port, 10) || options.port;
      }
      var host = arg.slice(0, - port.length - 1);
      if (host[0] === '[') {
        host = host.substring(1);
      }
      var lastIndex = host.length - 1;
      if (host[lastIndex] === ']') {
        host = host.substring(0, lastIndex);
      }
      if (host && (net.isIP(host) || HOST_RE.test(host))) {
        options.host = host || options.host;
      }
    } else {
      delete options.port;
      delete options.host;
      if (URL_RE.test(arg)) {
        options.addr = { url: arg };
      } else {
        options.addr = { file: arg };
      }
    }
  });
  if (!options.addr) {
    var host = options.host || '127.0.0.1';
    var port = options.port || util.getDefaultPort();
    options.addr = { url: 'http://' + host + ':' + port + '/cgi-bin/rootca' };
  }
  install(options.addr);
};
