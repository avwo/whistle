
function getRuleValue(req) {
  return req.originalReq.ruleValue;
}

exports.getRuleValue = getRuleValue;

function getFullUrl(req) {
  var fullUrl = req.fullUrl;
  return fullUrl || '';
}

exports.getFullUrl = getFullUrl;

function getRealUrl(req) {
  return req.originalReq.realUrl;
}

exports.getRealUrl = getRealUrl;

function getReqId(req) {
  return req.originalReq.reqId;
}

exports.getReqId = getReqId;

function getStatusCode(req) {
  return req.originalReq.statusCode;
}

exports.getStatusCode = getStatusCode;


function getHost(req) {
  return req.originalReq.hostValue;
}

exports.getHost = getHost;
