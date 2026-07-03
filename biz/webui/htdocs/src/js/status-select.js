var React = require('react');
var Select = require('./custom-select');
var util = require('./util');

var STATUS_CODES = util.STATUS_CODES;

var STATUS_CODE_OPTIONS = Object.keys(STATUS_CODES).map(function(code) {
  var msg = STATUS_CODES[code];
  msg = msg ? '(' + msg + ')' : '';
  return { value: code, label: code + ' ' + msg };
});

var StatusSelect = React.createClass({
  render: function() {
    var props = this.props;

    return (
      <Select name="statusCode" value={props.value} disabled={props.disabled}
        className={'w-300 ml-10 ' + (props.className || '')} options={STATUS_CODE_OPTIONS}
        isNum maxLength="3" placeholder="Enter new status code (100-999)" onChange={props.onChange} />
    );
  }
});

module.exports = StatusSelect;
