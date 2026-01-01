require('../css/editor-settings.css');
var React = require('react');
var ReactDOM = require('react-dom');
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
    events.on('toggle' + (this.props.name === 'rules' ? 'Rules' : 'Values') + 'LineNumbers', function () {
      $(ReactDOM.findDOMNode(self.refs.showLineNumbers)).trigger('click');
    });
  },
  render: function () {
    return (
      <div className="w-editor-settings">
        <p>
          <label>
            <span className="w-label">Theme:</span>
            <select
              value={this.props.theme}
              onChange={this.props.onThemeChange}
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
              value={this.props.fontSize}
              onChange={this.props.onFontSizeChange}
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
          <label className="w-align-items">
            <input
              ref="showLineNumbers"
              checked={this.props.lineNumbers}
              onChange={this.props.onLineNumberChange}
              type="checkbox"
            />{' '}
            Show line number
          </label>
        </p>
        <p className="w-editor-settings-box">
          <label className="w-align-items">
            <input
              checked={this.props.lineWrapping}
              onChange={this.props.onLineWrappingChange}
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
