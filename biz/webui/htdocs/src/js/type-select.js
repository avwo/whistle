var React = require('react');
var Select = require('./custom-select');

var REQ_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'application/xml',
  'application/octet-stream'
];
var RES_TYPES = [
  'text/html;charset=utf-8',
  'text/css;charset=utf-8',
  'text/plain;charset=utf-8',
  'application/javascript;charset=utf-8',
  'application/json;charset=utf-8',
  'application/xml;charset=utf-8',
  'image/png',
  'image/jpeg',
  'image/gif'
];

var TypeSelect = React.createClass({
  getInitialState: function() {
    return {
      options: this.props.isReq ? REQ_TYPES : RES_TYPES
    };
  },
  createOption: function(type) {
    this.refs.type.createOption(type);
  },
  render: function() {
    var props = this.props;
    var options = this.state.options;
    var name = (props.isReq ? 'request' : 'response') + 'Type';

    return (
      <Select ref="type" name={name} disabled={props.disabled} value={props.value} className={props.className} onChange={props.onChange} toLowerCase
        options={options} selectPlaceholder={props.hidePlaceholder ? null : 'Select content type'}
        placeholder="Enter custom content type, e.g. image/png or text/yaml;charset=utf-8" />
    );
  }
});

module.exports = TypeSelect;
