var options;

exports.init = function(opts) {
  options = opts;
};

function getRuleValue(req) {
  var ruleValue = req.headers[options.RULE_VALUE_HEADER];
  return ruleValue ? decodeURIComponent(ruleValue) : '';
}

exports.getRuleValue = getRuleValue;

function getFullUrl(req) {
  var fullUrl = req.headers[options.FULL_URL_HEADER];
  return fullUrl ? decodeURIComponent(fullUrl) : '';
}

exports.getFullUrl = getFullUrl;

function getRealUrl(req) {
  var realUrl = req.headers[options.REAL_URL_HEADER];
  return realUrl ? decodeURIComponent(realUrl) : '';
}

exports.getRealUrl = getRealUrl;

function getNextRule(req) {
  var nextRule = req.headers[options.NEXT_RULE_HEADER];
  return nextRule ? decodeURIComponent(nextRule) : '';
}

exports.getNextRule = getNextRule;

function getReqId(req) {
  var reqId = req.headers[options.REQ_ID_HEADER];
  return reqId ? decodeURIComponent(reqId) : '';
}

exports.getReqId = getReqId;

function getDataId(req) {
  var dataId = req.headers[options.DATA_ID_HEADER];
  return dataId ? decodeURIComponent(dataId) : '';
}

exports.getDataId = getDataId;

function getStatusCode(req) {
  var statusCode = req.headers[options.STATUS_CODE_HEADER];
  return statusCode ? decodeURIComponent(statusCode) : '';
}

exports.getStatusCode = getStatusCode;


function getHost(req) {
  var host = req.headers[options.LOCAL_HOST_HEADER];
  return host ? decodeURIComponent(host) : '';
}

exports.getHost = getHost;

function getPort(req) {
  var port = req.headers[options.HOST_PORT_HEADER];
  return port ? decodeURIComponent(port) : '';
}

exports.getPort = getPort;

function getMethod(req) {
  var method = req.headers[options.METHOD_HEADER];
  return method ? decodeURIComponent(method) : '';
}

exports.getMethod = getMethod;
