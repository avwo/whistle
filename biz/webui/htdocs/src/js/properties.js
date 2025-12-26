require('../css/properties.css');
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var util = require('./util');
var CopyBtn = require('./copy-btn');
var ExpandCollapse = require('./expand-collapse');
var ContextMenu = require('./context-menu');
var JSONTree = require('./components/react-json-tree')['default'];
var EnableHttpsBtn = require('./enable-https-btn');
var dataCenter = require('./data-center');

var TUNNEL_RE = /^tunnel:\/\//;

function getSrcInfo(val, sep) {
  var index = sep ? val.indexOf(sep) : -1;
  var btnText = '';
  if (index !== -1) {
    btnText = val.substring(index);
    val = val.substring(0, index);
  }
  return { value: val, btnText: btnText };
}

var Properties = React.createClass({
  getInitialState: function () {
    return { viewSource: false };
  },
  onLocate: function(text) {
    var onClickLocate = this.props.onClickLocate;
    onClickLocate && onClickLocate(text);
  },
  componentDidMount: function() {
    var self = this;
    if (this.props.name === 'Rules') {
      $(ReactDOM.findDOMNode(self.refs.properties)).on('mouseenter', 'td pre', function (e) {
        if (!e.ctrlKey && !e.metaKey) {
          return;
        }
        var target = e.target;
        var text = target.innerText;
        var index = text && text.indexOf(util.SOURCE_SEP);
        if (index > 0 && text.substring(index).indexOf(':') !== -1) {
          target.setAttribute('data-rule-source', '1');
        }
      }).on('mouseleave', 'td pre', function (e) {
        e.target.removeAttribute('data-rule-source');
      }).on('click', 'td pre', function (e) {
        if (!e.ctrlKey && !e.metaKey) {
          return;
        }
        self.onLocate(e.target.innerText);
      });
    }
  },
  toggle: function () {
    this.setState({ viewSource: !this.state.viewSource });
  },
  renderValue: function(val) {
    return val && val.length >= 2100 ? <ExpandCollapse text={val} /> : val;
  },
  renderKey: function(name, value) {
    if (this.props.hideKeys) {
      return null;
    }
    var onHelp = this.props.onHelp;
    var showEnableBtn = this.props.showEnableBtn && name === 'URL' && TUNNEL_RE.test(value);
    var index = this.props.richKey ? name.indexOf('\r\u0000(') : -1;
    return (<th>
      {onHelp ? (
        <span
          data-name={name}
          onClick={onHelp}
          className="glyphicon glyphicon-question-sign" />
      ) : undefined}
      {showEnableBtn ? <EnableHttpsBtn /> : null}
      {this.renderValue(index === -1 ? name : name.substring(0, index))}
      {index === -1 ? null : <span className="w-gray">{name.substring(index + 2)}</span>}
    </th>);
  },
  onContextMenu: function(e) {
    util.handlePropsContextMenu(e, this.refs.contextMenu);
  },
  getElemRef: function() {
    return this.refs.properties;
  },
  handleClick: function(e) {
    this.onLocate(e.target.dataset.text);
  },
  render: function () {
    var self = this;
    var props = self.props;
    var isRules = props.name === 'Rules';
    var showEnableBtn = props.showEnableBtn;
    var sourceText = props.enableViewSource;
    var copyValue = props.enableCopyValue;
    var hasPluginRule = props.hasPluginRule;
    var viewSource = self.state.viewSource;
    var rawName = props.rawName;
    var showJsonView = props.showJsonView;
    var cssMap = props.cssMap;
    var rawValue = props.rawValue;
    var modal = props.modal || {};
    var title = props.title || {};
    var clazz = props.wrapClass || '';
    var itemSep = isRules ? util.SOURCE_SEP : null;
    var isArr = Array.isArray(modal);
    var keys = Object.keys(modal);
    if (sourceText || copyValue) {
      var result = [];
      keys.forEach(function (name) {
        if (hasPluginRule && name === 'rule') {
          return;
        }
        var value = modal[name];
        name = sourceText ? name + ': ' : '';
        result.push(
          Array.isArray(value)
            ? value
                .map(function (val) {
                  return name + util.toString(val);
                })
                .join('\n')
            : name + util.toString(value)
        );
      });
      sourceText = sourceText && result.join('\n');
      if (copyValue) {
        copyValue = result.filter(util.noop).join('\n').trim();
        if (isRules) {
          copyValue = util.removeRulesComments(copyValue);
        }
      }
    }
    if (self.textStr !== sourceText) {
      self.textStr = sourceText;
      try {
        self.jsonStr = JSON.stringify(modal, null, '  ');
      } catch (e) {
        self.jsonStr = undefined;
      }
    }

    return (
      <div
        ref="properties"
        className={
          'w-properties-wrap ' +
          (viewSource
            ? 'w-properties-view-source '
            : 'w-properties-view-parsed ') +
          (props.hide ? 'hide' : '') +
          (clazz ? ' ' + clazz : '')
        }
      >
        {sourceText ? (
          <div className="w-textarea-bar">
            <CopyBtn value={sourceText} name="AsText" />
            {self.jsonStr ? (
              <CopyBtn value={self.jsonStr} name="AsJSON" />
            ) : undefined}
            <a onClick={self.toggle}>{viewSource ? 'Form' : 'Text'}</a>
          </div>
        ) : undefined}
        {copyValue ? (
          <div className="w-textarea-bar">
            <CopyBtn value={copyValue} name={props.name} />
          </div>
        ) : undefined}
        {sourceText ? (
          <pre className="w-properties-source">
            {self.renderValue(sourceText)}
          </pre>
        ) : undefined}
        <table
          className={
            'table w-properties w-properties-parsed ' + (props.className || '')
          }
          onContextMenu={self.onContextMenu}
        >
          <tbody>
            {rawValue ? (
              <tr key="raw" className={rawValue ? undefined : 'w-no-value'}
                data-name={rawName}  data-value={rawValue}>
                <th>{rawName}</th>
                <td className="w-prop-raw-data w-user-select-none" title={rawValue}>
                  <pre>
                    {self.renderValue(rawValue)}
                  </pre>
                </td>
              </tr>
            ) : null}
            {keys.map(function (name, i) {
              var value = modal[name];
              if (Array.isArray(value)) {
                return value.map(function (val, i) {
                  val = util.toString(val);
                  var json = showJsonView && util.likeJson(val) && util.parseJSON(val);
                  return (
                    <tr key={i} className={val ? undefined : 'w-no-value'}
                    data-name={name}  data-value={val}>
                      {self.renderKey(name, val)}
                      <td
                        className={json ? 'w-properties-json' : 'w-user-select-none'}
                        onContextMenu={json ? util.stopPropagation : null}
                      >
                        {
                          json ? <JSONTree data={json}
                            onSearch={function() {
                              util.showJSONDialog(json);
                            }}
                          /> : <pre>
                            {self.renderValue(val)}
                          </pre>
                        }
                      </td>
                    </tr>
                  );
                });
              }
              value = util.toString(value);
              var json = showJsonView && util.likeJson(value) && util.parseJSON(value);
              var css = cssMap && cssMap[name];
              var style = css && css.style;
              var className = css && css.className;
              var showInfo = !json && showEnableBtn && name === 'Status Code' && value === 'captureError';
              var list = isRules ? value.split(util.CRLF_RE) : null;

              return (
                <tr
                  key={name}
                  title={title[name]}
                  className={value ? undefined : 'w-no-value'}
                  data-name={name}  data-value={value}
                >
                  {self.renderKey(isArr ? i + 1 + '' : name, value)}
                  <td
                    className={(json ? 'w-properties-json ' : 'w-user-select-none ') + (className || '')}
                    style={style}
                    onContextMenu={json ? util.stopPropagation : null}
                  >
                    {
                      json ? <JSONTree data={json} onSearch={function() {
                        util.showJSONDialog(json);
                      }} /> : (list ? list.map(function(val) {
                        var info = getSrcInfo(val, itemSep);
                        var btnText = info.btnText;
                        var noLocate = btnText.indexOf(':') === -1 && (!dataCenter.whistleId || (btnText !== '# (From Mock Rules)' && btnText !== '# (From Service Rules)'));
                        return (
                          <pre>
                            {self.renderValue(info.value)}
                            {noLocate ? <span className="w-src-info">{btnText}</span> : <a className="w-src-info" onClick={self.handleClick} data-text={val}>{btnText}</a> }
                          </pre>
                        );
                      }) : <pre className={showInfo ? 'w-align-items' : null}>{showInfo ? <a
                              className="glyphicon glyphicon-info-sign w-prop-icon"
                              href={util.getDocsBaseUrl('faq.html#capture-error')}
                              target="_blank" /> : null}{self.renderValue(value)}</pre>)
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <ContextMenu ref="contextMenu" />
      </div>
    );
  }
});

module.exports = Properties;
