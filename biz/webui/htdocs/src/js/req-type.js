var React = require('react');
var util = require('./util');

var REV_TYPES = {};
var TYPES = {
  form: 'application/x-www-form-urlencoded',
  upload: 'multipart/form-data',
  text: 'text/plain',
  json: 'application/json',
  custom: ''
};
var TYPE_CONF_RE = /;.+$/;

Object.keys(TYPES).forEach(function (name) {
  REV_TYPES[TYPES[name]] = name;
});

function getType(headers) {
  var keys = Object.keys(headers);
  var type;
  for (var i = 0, len = keys.length; i < len; i++) {
    var name = keys[i];
    if (name.toLowerCase() === 'content-type') {
      if (type) {
        return 'custom';
      }
      var value = headers[name];
      if (!value || typeof value !== 'string') {
        return 'custom';
      }
      value = value.split(';')[0].trim().toLowerCase();
      type = REV_TYPES[value] || 'custom';
    }
  }
  return type || 'custom';
}

function setType(headers, type, lowerCase) {
  headers = util.parseHeaders(headers);
  Object.keys(headers).forEach(function (name) {
    if (name.toLowerCase() === 'content-type') {
      if (type) {
        var addon = TYPE_CONF_RE.test(headers[name]) ? RegExp['$&'] : '';
        headers[name] = type + addon;
        type = null;
      } else {
        delete headers[name];
      }
    }
  });
  if (type) {
    headers[lowerCase ? 'content-type' : 'Content-Type'] = type;
  }
  return util.objectToString(headers);
}

function isUpload(headers) {
  return headers === 'upload' || getType(headers) === 'upload';
}

var ReqType = React.createClass({
  render: function() {
    var props = this.props;
    var disabled = props.disabled;
    var value = props.value;
    return (
      <div className={'w-middle flex-1 ' + (props.className || '')} onChange={props.onChange}>
        <label className="w-com-label">Type:</label>
        <label>
          <input
            disabled={disabled}
            data-type="form"
            type="radio"
            checked={value === 'form'}
          />
          Form
        </label>
        <label>
          <input
            disabled={disabled}
            data-type="upload"
            type="radio"
            checked={value === 'upload'}
          />
          Upload
        </label>
        <label>
          <input
            disabled={disabled}
            data-type="json"
            type="radio"
            checked={value === 'json'}
          />
          JSON
        </label>
        <label>
          <input
            disabled={disabled}
            data-type="text"
            type="radio"
            checked={value === 'text'}
          />
          Text
        </label>
        <label>
          <input
            disabled={disabled}
            data-type="custom"
            type="radio"
            checked={value === 'custom'}
          />
          Raw
        </label>
      </div>
    );
  }
});

ReqType.TYPES = TYPES;
ReqType.getType = getType;
ReqType.setType = setType;
ReqType.isUpload = isUpload;

module.exports = ReqType;
