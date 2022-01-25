require('./base-css.js');
require('../css/properties.css');
var React = require('react');
var util = require('./util');
var CopyBtn = require('./copy-btn');
var ExpandCollapse = require('./expand-collapse');

var Properties = React.createClass({
  getInitialState: function () {
    return { viewSource: false };
  },
  toggle: function () {
    this.setState({ viewSource: !this.state.viewSource });
  },
  render: function () {
    var props = this.props;
    var sourceText = props.enableViewSource;
    var copyValue = props.enableCopyValue;
    var hasPluginRule = props.hasPluginRule;
    var viewSource = this.state.viewSource;
    var onHelp = props.onHelp;
    var rawName = props.rawName;
    var rawValue = props.rawValue;
    var modal = props.modal || {};
    var title = props.title || {};
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
      copyValue = copyValue && result.filter(util.noop).join('\n').trim();
    }
    if (this.textStr !== sourceText) {
      this.textStr = sourceText;
      try {
        this.jsonStr = JSON.stringify(modal, null, '  ');
      } catch (e) {
        this.jsonStr = undefined;
      }
    }

    return (
      <div
        className={
          'w-properties-wrap ' +
          (viewSource
            ? 'w-properties-view-source '
            : 'w-properties-view-parsed ') +
          (props.hide ? 'hide' : '')
        }
      >
        {sourceText ? (
          <div className="w-textarea-bar">
            <CopyBtn value={sourceText} name="AsText" />
            {this.jsonStr ? (
              <CopyBtn value={this.jsonStr} name="AsJSON" />
            ) : undefined}
            <a onClick={this.toggle}>{viewSource ? 'Form' : 'Text'}</a>
          </div>
        ) : undefined}
        {copyValue ? (
          <div className="w-textarea-bar">
            <CopyBtn value={copyValue} name={props.name} />
          </div>
        ) : undefined}
        {sourceText ? (
          <pre className="w-properties-source">
            {sourceText.length >= 2100 ? (
              <ExpandCollapse text={sourceText} />
            ) : (
              sourceText
            )}
          </pre>
        ) : undefined}
        <table
          className={
            'table w-properties w-properties-parsed ' + (props.className || '')
          }
        >
          <tbody>
            {rawValue ? (
              <tr key="raw" className={rawValue ? undefined : 'w-no-value'}>
                <th>{rawName}</th>
                <td className="w-prop-raw-data" title={rawValue}>
                  {rawValue.length > 2100
                    ? rawValue.substring(2100) + '...'
                    : rawValue}
                </td>
              </tr>
            ) : null}
            {keys.map(function (name) {
              var value = modal[name];
              if (Array.isArray(value)) {
                return value.map(function (val, i) {
                  val = util.toString(val);
                  return (
                    <tr key={i} className={val ? undefined : 'w-no-value'}>
                      <th>
                        {onHelp ? (
                          <span
                            data-name={name}
                            onClick={onHelp}
                            className="glyphicon glyphicon-question-sign"
                          ></span>
                        ) : undefined}
                        {name && name.length >= 2100 ? (
                          <ExpandCollapse text={name} />
                        ) : (
                          name
                        )}
                      </th>
                      <td>
                        <pre>
                          {val && val.length >= 2100 ? (
                            <ExpandCollapse text={val} />
                          ) : (
                            val
                          )}
                        </pre>
                      </td>
                    </tr>
                  );
                });
              }
              value = util.toString(value);
              return (
                <tr
                  key={name}
                  title={title[name]}
                  className={value ? undefined : 'w-no-value'}
                >
                  <th>
                    {onHelp ? (
                      <span
                        data-name={name}
                        onClick={onHelp}
                        className="glyphicon glyphicon-question-sign"
                      ></span>
                    ) : undefined}
                    {name && name.length >= 2100 ? (
                      <ExpandCollapse text={name} />
                    ) : (
                      name
                    )}
                  </th>
                  <td>
                    <pre>
                      {value && value.length >= 2100 ? (
                        <ExpandCollapse text={value} />
                      ) : (
                        value
                      )}
                    </pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
});

module.exports = Properties;
