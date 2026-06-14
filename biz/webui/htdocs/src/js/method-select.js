var React = require('react');
var Select = require('./custom-select');
var METHODS = require('./util').METHODS;

var MethodSelect = React.createClass({
  render: function() {
    var props = this.props;
    return (
      <Select disabled={props.disabled} name="method" value={props.value} className="mx-10 w-300" options={METHODS}
        toUpperCase placeholder="Enter new method (case-insensitive)" onChange={props.onChange} />
    );
  }
});

module.exports = MethodSelect;
