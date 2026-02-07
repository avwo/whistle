
var extend = require('extend');

var propsMap = {
  fullUrl: 'FULL_URL_HEADER',
  _extraUrl: 'EXTRA_URL_HEADER',
  reqId: 'REQ_ID_HEADER',
  _existsCustomCert: 'CUSTOM_CERT_HEADER',
  _enableCapture: 'ENABLE_CAPTURE_HEADER',
  _ruleProtocol: 'RULE_PROTO_HEADER',
  _ruleValue: 'RULE_VALUE_HEADER',
  sniRuleValue: 'SNI_VALUE_HEADER',
  _ruleUrl: 'RULE_URL_HEADER',
  _finalUrl: 'REAL_URL_HEADER',
  _relativeUrl: 'RELATIVE_URL_HEADER',
  _pipeValue: 'PIPE_VALUE_HEADER',
  customParser: 'CUSTOM_PARSER_HEADER',
  _statusCode: 'STATUS_CODE_HEADER',
  host: 'HOST_VALUE_HEADER',
  proxy: 'PROXY_VALUE_HEADER',
  pac: 'PAC_VALUE_HEADER',
  method: 'METHOD_HEADER',
  clientIp: 'CLIENT_IP_HEADER',
  clientPort: 'CLIENT_PORT_HEADER',
  _isUIRequest: 'UI_REQUEST_HEADER',
  hostIp: 'HOST_IP_HEADER',
  _pluginVarsValue: 'GLOBAL_VALUE_HEADER',
  serverName: 'SERVER_NAME_HEADER',
  commonName: 'COMMON_NAME_HEADER',
  isPluginReq: 'PLUGIN_REQUEST_HEADER',
  hasCertCache: 'CERT_CACHE_INFO',
  fromComposer: 'REQ_FROM_HEADER'
};

var specValues = {
  fromComposer: 'W2COMPOSER'
};

var constsMap = {
  CUSTOM_CERT_HEADER: 'x-whistle-exists-custom-cert',
  ENABLE_CAPTURE_HEADER: 'x-whistle-enable-capture',
  RULE_VALUE_HEADER: 'x-whistle-rule-value',
  RULE_PROTO_HEADER: 'x-whistle-rule-proto',
  SNI_VALUE_HEADER: 'x-whistle-sni-value',
  RULE_URL_HEADER: 'x-whistle-rule-url',
  FULL_URL_HEADER: 'x-whistle-full-url',
  REAL_URL_HEADER: 'x-whistle-real-url',
  EXTRA_URL_HEADER: 'x-whistle-extra-url',
  RELATIVE_URL_HEADER: 'x-whistle-relative-url',
  REQ_ID_HEADER: 'x-whistle-req-id',
  PIPE_VALUE_HEADER: 'x-whistle-pipe-value',
  CUSTOM_PARSER_HEADER: 'x-whistle-frame-parser',
  STATUS_CODE_HEADER: 'x-whistle-status-code',
  PLUGIN_REQUEST_HEADER: 'x-whistle-plugin-request',
  LOCAL_HOST_HEADER: 'x-whistle-local-host',
  HOST_VALUE_HEADER: 'x-whistle-local-host',
  PROXY_VALUE_HEADER: 'x-whistle-proxy-value',
  PAC_VALUE_HEADER: 'x-whistle-pac-value',
  METHOD_HEADER: 'x-whistle-method',
  CLIENT_IP_HEADER: 'x-forwarded-for',
  UI_REQUEST_HEADER:  'x-whistle-auth-ui-request',
  CERT_CACHE_INFO: 'x-whistle-cert-cache-info',
  HOST_IP_HEADER: 'x-whistle-host-ip',
  REQ_FROM_HEADER: 'x-whistle-request-from',
  CLIENT_PORT_HEADER: 'x-whistle-client-port',
  GLOBAL_VALUE_HEADER: 'x-whistle-global-value',
  SERVER_NAME_HEADER: 'x-whistle-server-name',
  COMMON_NAME_HEADER: 'x-whistle-common-name',
  CLIENT_PORT_HEAD: 'x-whistle-client-port',
  GLOBAL_VALUE_HEAD: 'x-whistle-global-value',
  SERVER_NAME_HEAD: 'x-whistle-server-name',
  COMMON_NAME_HEAD: 'x-whistle-common-name'
};

function compat(headers, key, value) {
  Object.defineProperty(headers, key, {
    enumerable: false,
    configurable: true,
    get: function() {
      return value;
    },
    set: function(val) {
      Object.defineProperty(headers, key, {
        enumerable: true,
        writable: true,
        configurable: true,
        value: val
      });
    }
  });
}


exports.compatHeaders = function(req, sessionInfo) {
  var headers = req.headers;
  var rawData = sessionInfo._;
  Object.keys(propsMap).forEach(function(key) {
    var name = constsMap[propsMap[key]];
    var value = rawData[key] || sessionInfo[key];
    value = (value && specValues[key]) || value;
    compat(headers, name, value);
  });
  return sessionInfo;
};

exports.compatKeys = function(obj) {
  extend(obj, constsMap);
};
