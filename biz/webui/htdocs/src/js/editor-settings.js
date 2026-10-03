require('../css/editor-settings.css');
var React = require('react');
var util = require('./util');
var Select = require('./custom-select');

var fontSizeOptions = ['12px', '13px'];
for (var i = 14; i <= 36; i += 2) {
  fontSizeOptions.push(i + 'px');
}

var EditorSettings = React.createClass({
  componentDidMount: function () {
    var self = this;
    util.on('toggle' + (self.props.name === 'rules' ? 'Rules' : 'Values') + 'LineNumbers', function () {
      var props = self.props;
      props.onLineNumberChange({
        target: {
          checked: !props.lineNumbers
        }
      });
    });
  },
  render: function () {
    var props = this.props;

    return (
      <div className="w-editor-settings">
        <p>
          <label>
            <span className="w-label">Theme:</span>
            <Select value={props.theme} onChange={props.onThemeChange} options={util.EDITOR_THEMES} />
          </label>
        </p>
        <p>
          <label>
            <span className="w-label">Font Size:</span>
            <Select value={props.fontSize} onChange={props.onFontSizeChange} options={fontSizeOptions} />
          </label>
        </p>
        <p className="w-editor-option">
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
        <p className="w-editor-option">
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
