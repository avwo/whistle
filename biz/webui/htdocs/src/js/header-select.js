var React = require('react');
var Select = require('./custom-select');

var REQ_ACTIONS = [
  '- Delete Actions',
  'Delete Request Header',
  'Delete Request Cookie'
];

var RES_ACTIONS = [
  '- Delete Actions',
  'Delete Response Header',
  'Delete Response Cookie'
];

var GENERAL_HEADERS = [
  '- General Headers',
  'Connection',
  'Date',
  'Pragma',
  'Trailer',
  'Transfer-Encoding',
  'Upgrade',
  'Via',
  'Warning'
];

var REQ_HEADERS = REQ_ACTIONS.concat(GENERAL_HEADERS).concat([
  '- Content Negotiation',
  'Content-Type',
  'Accept',
  'Accept-Charset',
  'Accept-Encoding',
  'Accept-Language',
  '- Authentication',
  'Authorization',
  'Proxy-Authorization',
  '- Client Information',
  'User-Agent',
  'From',
  'Referer',
  'Referrer-Policy',
  '- Transfer Control',
  'Host',
  'Expect',
  'Range',
  'If-Range',
  'Max-Forwards',
  'TE',
  '- Cache Control',
  'Cache-Control',
  'If-Match',
  'If-None-Match',
  'If-Modified-Since',
  'If-Unmodified-Since',
  '- CORS',
  'Origin',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
  '- Cookie',
  'Cookie',
  '- Extensions',
  'Forwarded',
  'X-Forwarded-For',
  'X-Forwarded-Host',
  'X-Request-ID',
  'X-Correlation-ID'
]);

var RES_HEADERS = RES_ACTIONS.concat(GENERAL_HEADERS).concat([
  '- Content Description',
  'Content-Type',
  'Content-Length',
  'Content-Encoding',
  'Content-Language',
  'Content-Range',
  'Content-Disposition',
  'Content-Location',
  '- Cache Control',
  'Cache-Control',
  'Expires',
  'Last-Modified',
  'ETag',
  'Age',
  'Vary',
  '- Server Information',
  'Server',
  'X-Powered-By',
  'X-AspNet-Version',
  '- Security Policies',
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'X-XSS-Protection',
  'Referrer-Policy',
  'Permissions-Policy',
  '- CORS',
  'Access-Control-Allow-Origin',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Credentials',
  'Access-Control-Expose-Headers',
  'Access-Control-Max-Age',
  '- Authentication',
  'WWW-Authenticate',
  'Proxy-Authenticate',
  '- Cookie',
  'Set-Cookie',
  '- Redirection',
  'Location',
  '- Extensions',
  'Retry-After',
  'Accept-Ranges',
  'X-Request-ID',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining'
]);

const ALL_HEADERS = [];

REQ_HEADERS.concat(RES_HEADERS).forEach(function(name) {
  if (!/\s/.test(name)) {
    name = name.toLowerCase();
    if (ALL_HEADERS.indexOf(name) === -1) {
      ALL_HEADERS.push(name);
    }
  }
});

function toFirstUpperCase(str) {
  return str.split('-').map(function(s) {
    return s[0].toUpperCase() + s.substring(1);
  }).join('-');
}

var HeaderSelect = React.createClass({
  getInitialState: function() {
    return { options: this.getOptions() };
  },
  getOptions: function() {
    var props = this.props;
    var session = props.session;
    var isReq = props.isReq;
    var isRes = props.isRes;
    var keepCase = isReq || isRes;
    var options = (isReq ? REQ_HEADERS : (isRes ? RES_HEADERS : ALL_HEADERS)).slice();
    var addOption = function(name) {
      name = keepCase ? toFirstUpperCase(name) : name;
      if (options.indexOf(name) === -1) {
        options.push(name);
      }
    };
    var hasChanged;
    if (session) {
      var headers = session.req.headers;
      if (!isRes && this._reqHeaders !== headers) {
        this._reqHeaders = headers;
        hasChanged = true;
        Object.keys(headers).forEach(addOption);
      }
      headers = session.res.headers;
      if (!isReq && this._resHeaders !== headers) {
        this._resHeaders = headers;
        hasChanged = true;
        headers && Object.keys(headers).forEach(addOption);
      }
    }
    options.hasChanged = hasChanged;
    return options;
  },
  updateOptions: function() {
    var options = this.getOptions();
    if (options.hasChanged || !this.state.options.length) {
      this.setState({ options: options });
    }
  },
  render: function() {
    var props = this.props;
    var keepCase = props.isReq || props.isRes;

    return (
      <Select name={props.name} isHeader disabled={props.disabled} options={this.state.options} toLowerCase={!keepCase}
        onChange={props.onChange} value={props.value} className={props.className} onClick={this.updateOptions}
        selectPlaceholder={props.placeholder} placeholder={'Enter new header name' + (keepCase ? '' : ' (case-insensitive)')}
        data={props.data} />
    );
  }
});

module.exports = HeaderSelect;

HeaderSelect.REQ_HEADERS = REQ_HEADERS;
HeaderSelect.RES_HEADERS = RES_HEADERS;
