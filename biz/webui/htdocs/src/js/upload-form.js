var React = require('react');
var util = require('./util');

var UploadForm = React.createClass({
  getForm: function () {
    return this.refs.form;
  },
  getInput: function () {
    return this.refs.input;
  },
  render: function () {
    var props = this.props;

    return (
      <form
        ref="form"
        encType="multipart/form-data"
        style={util.HIDE_STYLE}
      >
        <input
          ref="input"
          accept={props.accept}
          onChange={props.onChange}
          type="file"
          name={props.name || 'localFile'}
        />
      </form>
    );
  }
});

module.exports = UploadForm;
