require('./base-css.js');
require('../css/overview.css');
var React = require('react');
var ReactDOM = require('react-dom');
var events = require('./events');
var util = require('./util');
var storage = require('./storage');
var Properties = require('./properties');

var OVERVIEW = ['Url', 'Real Url', 'Method', 'Http Version', 'Status Code', 'Status Message', 'Client IP', 'Server IP', 'Client Port', 'Server Port', 'Request Length', 'Content Length'
                      , 'Content Encoding', 'Start Date', 'DNS Lookup', 'Request Sent', 'Response Headers', 'Content Download'];
var OVERVIEW_PROPS = ['url', 'realUrl', 'req.method', 'req.httpVersion', 'res.statusCode', 'res.statusMessage', 'req.ip', 'res.ip', 'req.port', 'res.port', 'req.size', 'res.size', 'contentEncoding'];
/**
 * statusCode://, redirect://[statusCode:]url, [req, res]speed://,
 * [req, res]delay://, method://, [req, res][content]Type://自动lookup,
 * cache://xxxs[no], params://json|string(放在url)
 */
var PROTOCOLS = require('./protocols').PROTOCOLS;
var DEFAULT_OVERVIEW_MODAL = {};
var DEFAULT_RULES_MODAL = {};
var IPV6_RE = /^host:\/\/[:\da-f]*:[\da-f]*:[\da-f]+$/i;
var PROXY_PROTOCOLS = ['socks', 'http-proxy', 'https-proxy'];

function getRuleStr(rule) {
  if (!rule) {
    return;
  }
  var matcher = rule.matcher;
  if (rule.port) {
    if (IPV6_RE.test(matcher)) {
      matcher = '[' + matcher + ']';
    }
    matcher = matcher + ':' + rule.port;
  }
  return rule.rawPattern + ' ' +  matcher;
}

OVERVIEW.forEach(function(name) {
  DEFAULT_OVERVIEW_MODAL[name] = '';
});
PROTOCOLS.forEach(function(name) {
  if (PROXY_PROTOCOLS.indexOf(name) !== -1 || /^x/.test(name)) {
    return;
  }
  DEFAULT_RULES_MODAL[name] = '';
});

var Overview = React.createClass({
  getInitialState: function() {
    return {
      showOnlyMatchRules: storage.get('showOnlyMatchRules') == 1
    };
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  componentDidMount: function() {
    var self = this;
    var container = ReactDOM.findDOMNode(self.refs.container);
    events.on('overviewScrollTop', function() {
      if (!util.getBoolean(self.props.hide)) {
        container.scrollTop = 0;
      }
    });
  },
  showOnlyMatchRules: function(e) {
    var showOnlyMatchRules = e.target.checked;
    storage.set('showOnlyMatchRules', showOnlyMatchRules ? 1 : 0);
    this.setState({
      showOnlyMatchRules: showOnlyMatchRules
    });
  },
  render: function() {
    var overviewModal = DEFAULT_OVERVIEW_MODAL;
    var rulesModal = DEFAULT_RULES_MODAL;
    var modal = this.props.modal;
    var showOnlyMatchRules = this.state.showOnlyMatchRules;
    var realUrl;

    if (modal) {
      overviewModal = {};
      OVERVIEW.forEach(function(name, i) {
        var prop = OVERVIEW_PROPS[i];
        if (prop) {
          var value = util.getProperty(modal, prop);
          if (value && prop === 'res.ip') {
            value = util.getServerIp(modal);
          }
          if (value) {
            if ((prop == 'req.size' || prop == 'res.size') && value >= 1024) {
              value += '(' + Number(value / 1024).toFixed(2) + 'k)';
            } else if (prop == 'realUrl') {
              if (value == modal.url) {
                value = '';
              } else if (modal.isHttps) {
                value = 'tunnel://' + value;
              }
              realUrl = value;
            } else if (modal.isHttps && prop === 'url') {
              value = 'tunnel://' + value;
            }
          } else if (prop == 'res.statusMessage') {
            value = util.getStatusMessage(modal.res);
          }
          overviewModal[name] = value;
        } else {
          var lastIndex = OVERVIEW.length - 1;
          var time;
          switch(name) {
          case OVERVIEW[lastIndex - 4]:
            time = new Date(modal.startTime).toLocaleString();
            break;
          case OVERVIEW[lastIndex - 3]:
            if (modal.dnsTime) {
              time = modal.dnsTime - modal.startTime + 'ms';
            }
            break;
          case OVERVIEW[lastIndex - 2]:
            if (modal.requestTime) {
              time = modal.requestTime - modal.startTime + 'ms';
            }
            break;
          case OVERVIEW[lastIndex - 1]:
            if (modal.responseTime) {
              time = modal.responseTime - modal.startTime + 'ms';
            }
            break;
          case OVERVIEW[lastIndex]:
            if (modal.endTime) {
              time = modal.endTime - modal.startTime + 'ms';
            }
            break;
          }
          overviewModal[name] = time;
        }
      });
      var rules = modal.rules;
      var titleModal = {};
      if (rules) {
        rulesModal = {};
        PROTOCOLS.forEach(function(name) {
          if (PROXY_PROTOCOLS.indexOf(name) !== -1 || /^x/.test(name)) {
            return;
          }
          var key = name;
          if (name === 'reqScript') {
            key = 'rulesFile';
          } else if (name === 'reqMerge') {
            key = 'params';
          } else if (name === 'pathReplace') {
            key = 'urlReplace';
          }
          var rule = rules[key];
          if (rule && rule.list) {
            rulesModal[name] = rule.list.map(function(rule) {
              return rule.rawPattern + ' ' + rule.matcher;
            }).join('\n');
            titleModal[name] = rule.list.map(function(rule) {
              return rule.raw;
            }).join('\n');
          } else {
            rulesModal[name] = getRuleStr(rule);
            if (rule) {
              titleModal[name] = realUrl && (name === 'proxy' || name === 'host') ? 'Raw Rule: '
                + rule.raw + '\nReal Url: ' + realUrl : rule.raw;
            } else {
              titleModal[name] = rule ? rule.raw : undefined;
            }
          }
        });
      }
    }

    return (
      <div ref="container" className={'fill orient-vertical-box w-detail-content w-detail-overview' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
        <Properties modal={overviewModal} />
        <p className="w-detail-overview-title" style={{ background: showOnlyMatchRules ? 'lightyellow' : undefined }}>
          <a href="https://avwo.github.io/whistle/rules/" target="_blank"><span className="glyphicon glyphicon-question-sign"></span></a>All Rules:
          <label><input checked={showOnlyMatchRules} onChange={this.showOnlyMatchRules} type="checkbox" />Only show matching rules</label>
        </p>
        <Properties className={showOnlyMatchRules ? 'w-hide-no-value' : undefined} modal={rulesModal} title={titleModal} />
      </div>
    );
  }
});

module.exports = Overview;
