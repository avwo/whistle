var React = require('react');
var Icon = require('./icon');
var RulesDialog = require('./rules-dialog');

var RulesMiniEditor = React.createClass({
  onResise: function() {
    var self = this;
    self.showRules(self.props.value);
  },
  showRules: function(rules) {
    this.refs.rulesDialog.show(rules);
  },
  onChange: function(e) {
    var onChange = this.props.onChange;
    if (onChange) {
      onChange(e && e.target ? e.target.value : e);
    }
  },
  render: function() {
    var self = this;
    var props = self.props;
    var disabled = props.disabled;
    var rules = props.value;

    return (
        <div className="fill v-box w-rules-mini-editor">
          <Icon name="resize-full" title="Edit rules in dialog" onClick={self.onResise} />
          <textarea
            readOnly={disabled}
            value={rules}
            onKeyDown={props.onKeyDown}
            onChange={self.onChange}
            onDoubleClick={props.onDoubleClick}
            style={{background: !disabled && rules ? 'var(--b-filtered)' : undefined}}
            maxLength="33000"
            className="fill"
            placeholder={props.placeholder || 'Enter rules (Higher priority than Whistle Rules)'}
          />
          <RulesDialog ref="rulesDialog" onSave={self.onChange} />
        </div>
      );
  }
});

module.exports = RulesMiniEditor;
