var React = require('react');
var Properties = require('./properties');
var util = require('./util');
var protocols = require('./protocols');
var PanelTips = require('./panel-tips');

var getHelpUrl = protocols.getHelpUrl;
var PROTOCOLS = protocols.PROTOCOLS;
var DEFAULT_RULES_MODAL = {};
var PROXY_PROTOCOLS = ['socks', 'http-proxy', 'https-proxy'];
var EMPTY = {message: 'No matched rules'};

function ignoreProtocol(name) {
  return PROXY_PROTOCOLS.indexOf(name) !== -1 || name === 'skip' || /^x/.test(name);
}

PROTOCOLS.forEach(function (name) {
  if (ignoreProtocol(name)) {
    return;
  }
  DEFAULT_RULES_MODAL[name] = '';
});

function getAtRule(rule) {
  return rule.rawPattern + ' @' + getMatcher(rule).substring(4) + getPluginName(rule);
}

function getVarRule(rule) {
  return rule.rawPattern + ' %' + getMatcher(rule).substring(4) + getPluginName(rule);
}

function getStr(str) {
  return str ? ' ' + str : '';
}

function filterImportant(item) {
  return item.indexOf('important') !== -1;
}

function getPluginName(rule) {
  return rule && rule.file ? util.SOURCE_SEP + rule.file + ')' : '';
}

function getRawProps(rule, all) {
  var filter = getStr(rule.filter);
  rule = rule.rawProps;
  if (!rule) {
    return filter;
  }
  if (!all) {
    rule = rule.filter(filterImportant);
  }
  return getStr(rule.join(' ')) + filter;
}

function getInjectProps(rule) {
  if (rule.strictHtml) {
    return ' enable://strictHtml';
  }

  return rule.safeHtml ? ' enable://safeHtml' : '';
}

function getMatcher(rule) {
  return rule._matcher || rule.matcher;
}

function getRuleStr(rule) {
  if (!rule) {
    return;
  }
  var matcher = getMatcher(rule);
  if (rule.port) {
    var protoIndex = matcher.indexOf(':') + 3;
    var proto = matcher.substring(0, protoIndex);
    if (matcher.indexOf(':', protoIndex) !== -1) {
      matcher = proto + '[' + matcher.substring(protoIndex) + ']';
    }
    matcher = matcher + ':' + rule.port;
  }
  return rule.rawPattern + ' ' + matcher + getRawProps(rule, true);
}

function onHelp(e) {
  var name = util.attr(e.target, 'data-name');
  var helpUrl = getHelpUrl(name);
  helpUrl && util.trigger('openUrl', name === 'rule' ? helpUrl + 'rule/' : helpUrl);
}

var MatchedRule = React.createClass({
  render: function() {
    var props = this.props;
    var modal = props.modal;
    var rules = modal && modal.rules;
    var realUrl = modal && modal.realUrl;
    var rulesModal = DEFAULT_RULES_MODAL;
    var hasPluginRule;
    var titleModal = {};
    var showOnlyMatchRules = props.showOnlyMatchRules;
    if (rules) {
      rulesModal = {};
      var atRule = rules.G;
      var clientCert = rules.clientCert;
      var atCtn;
      var atTitle;
      if (atRule) {
        atCtn = [getAtRule(atRule)];
        atTitle = [atRule.raw];
      }
      var pList = rules.P;
      if (pList) {
        pList.forEach(function (item) {
          atCtn = atCtn || [];
          atCtn.push(getVarRule(item));
          atTitle = [item.raw];
        });
      }
      if (clientCert) {
        atCtn = atCtn || [];
        atTitle = atTitle || [];
        atCtn.push(getAtRule(clientCert));
        atTitle.push(clientCert.raw);
      }
      if (atCtn) {
        rulesModal['@'] = atCtn.join('\n');
        titleModal['@'] = atTitle.join('\n');
      }
      PROTOCOLS.forEach(function (name) {
        if (ignoreProtocol(name)) {
          return;
        }
        var key = name;
        if (name === 'reqScript') {
          key = 'rulesFile';
        } else if (name === 'reqMerge') {
          key = 'params';
        } else if (name === 'tlsOptions') {
          key = 'cipher';
        } else if (name === 'pathReplace') {
          key = 'urlReplace';
        }
        var rule = rules[key];
        var pluginRule = name === 'plugin' && rules._pluginRule;
        if (pluginRule) {
          hasPluginRule = true;
          var ruleList = [
            pluginRule.rawPattern + ' ' + getMatcher(pluginRule) + getRawProps(pluginRule) + getPluginName(pluginRule)
          ];
          var titleList = [pluginRule.raw];
          rule && Array.isArray(rule.list) &&
              rule.list.forEach(function (item) {
                ruleList.push(item.rawPattern + ' ' + getMatcher(item) + getRawProps(item) + getPluginName(item));
                titleList.push(item.raw);
              });
          rulesModal[name] = ruleList.join('\n');
          titleModal[name] = titleList.join('\n');
        } else if (rule && Array.isArray(rule.list)) {
          var prop = getInjectProps(rule);
          rulesModal[name] = rule.list
              .map(function (rule) {
                return rule.rawPattern + ' ' + getMatcher(rule) + getRawProps(rule, true) + prop + getPluginName(rule);
              })
              .join('\n');
          titleModal[name] = rule.list
              .map(function (rule) {
                return rule.raw;
              })
              .join('\n');
        } else {
          var ruleStr = getRuleStr(rule);
          rulesModal[name] = ruleStr;
          titleModal[name] = rule ? rule.raw : undefined;
          if (name === 'host') {
            var result = [];
            if (ruleStr) {
              result.push(ruleStr + (realUrl ? ' (URL: ' + realUrl + ')' : '') + getPluginName(rule));
            }
            var proxy = rules.proxy;
            if (proxy && proxy.host) {
              result.push(
                  getRuleStr(proxy.host) + ' (URL: ' + getMatcher(proxy) + ')' + getPluginName(rule)
                );
            }
            rulesModal[name] = result.join('\n');
          } else {
            if (name === 'proxy') {
              if (realUrl && ruleStr) {
                rulesModal[name] += ' (URL: ' + realUrl + ')';
              }
            }
            if (rulesModal[name]) {
              rulesModal[name] += getPluginName(rule);
            }
          }
        }
      });
    }

    if (showOnlyMatchRules && (!rules || Object.keys(rules).length === 0)) {
      return <PanelTips data={EMPTY}  className="w-empty-tips" />;
    }
    return (
      <Properties
        name="Rules"
        noSource={props.noSource}
        onHelp={onHelp}
        className={showOnlyMatchRules ? 'w-hide-no-value w-rules-overview' : 'w-rules-overview'}
        onClickLocate={util.handleClickLocate}
        modal={rulesModal}
        title={titleModal}
        enableCopyValue
        hasPluginRule={hasPluginRule}
      />
    );
  }
});

module.exports = MatchedRule;
