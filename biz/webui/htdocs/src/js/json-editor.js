var React = require('react');
var util = require('./util');

var PLACEHOLDER = 'Enter JSON object to merge, e.g.\n a.b[3]: 123 (i.e., {"a": {"b": [..., 123, ...]}} ... denotes existing items) or\n' + JSON.stringify({a:{b:1}}, null, 2);

var JSONEditor = React.createClass({
  getEvent: function(value) {
    return {
      value: value || '',
      target: this.refs.target
    };
  },
  onFormat: function() {
    var props = this.props;
    var obj = util.parseRawJson(props.value);
    obj && props.onChange(this.getEvent(JSON.stringify(obj, null, 2)));
  },
  onClear: function() {
    this.props.onChange(this.getEvent());
  },
  render: function() {
    var props = this.props;
    var value = props.value;
    return (
      <div className="w-json-editor">
        {value ? <div className="w-mock-action">
          <a onClick={this.onFormat}>Format</a>
          <a onClick={this.onClear}>Clear</a>
        </div> : null}
        <textarea ref="target" className="form-control" value={value} maxLength="256000" disabled={props.disabled}
          onChange={props.onChange} placeholder={PLACEHOLDER} data-keep-space="1" />
      </div>
    );
  }
});

module.exports = JSONEditor;
