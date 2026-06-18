require('../css/editor-settings.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var $ = require('jquery');
var events = require('./events');
var themes = require('./util').EDITOR_THEMES;

var fontSizeOptions = [13];
for (var i = 14; i <= 36; i += 2) {
  fontSizeOptions.push(i);
}

var EditorSettings = React.createClass({
  componentDidMount: function () {
    var self = this;
    events.on('toggle' + (self.props.name === 'rules' ? 'Rules' : 'Values') + 'LineNumbers', function () {
      $(findDOMNode(self.refs.showLineNumbers)).trigger('click');
    });
  },
  render: function () {
    var props = this.props;

    return (
      <div className="w-editor-settings">
        <p>
          <label>
            <span className="w-label">Theme:</span>
            <select
              value={props.theme}
              onChange={props.onThemeChange}
              className="form-control"
            >
              {themes.map(function(theme) {
                return <option key={theme} value={theme}>{theme}</option>;
              })}
            </select>
          </label>
        </p>
        <p>
          <label>
            <span className="w-label">Font Size:</span>
            <select
              value={props.fontSize}
              onChange={props.onFontSizeChange}
              className="form-control"
            >
              {
                fontSizeOptions.map(function(size) {
                  return <option key={size} value={size + 'px'}>{size + 'px'}</option>;
                })
              }
            </select>
          </label>
        </p>
        <p className="w-editor-settings-box">
          <label className="w-middle">
            <input
              ref="showLineNumbers"
              checked={props.lineNumbers}
              onChange={props.onLineNumberChange}
              type="checkbox"
            />{' '}
            Show line number
          </label>
        </p>
        <p className="w-editor-settings-box">
          <label className="w-middle">
            <input
              checked={props.lineWrapping}
              onChange={props.onLineWrappingChange}
              type="checkbox"
            />{' '}
            Auto line wrapping
          </label>
        </p>
      </div>
    );
  }
});

module.exports = EditorSettings;
