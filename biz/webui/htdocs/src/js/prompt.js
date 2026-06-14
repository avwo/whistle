var React = require('react');
var Dialog = require('./dialog');

var DEF_RE = /\s+/g;
var NUM_RE = /(^0+|\D+)/g;
var HEADER_RE = /[=:\s]+/;

var Prompt = React.createClass({
  getInitialState: function() {
    return { value: '' };
  },
  onChange: function(e) {
    var isNum = this.props.isNum;
    var isHeader = this.props.isHeader;
    this.setState({value: e.target.value.replace(isNum ? NUM_RE : isHeader ? HEADER_RE : DEF_RE, '')});
  },
  show: function(callback, value) {
    this.setState({ value: value || '' });
    this._callback = callback;
    this.refs.prompt.show();
    setTimeout(this.focus, 300);
  },
  focus: function() {
    var input = this.refs.value;
    input.focus();
    input.select();
  },
  onConfirm: function() {
    var cb = this._callback;
    if (cb && cb(this.state.value) === false) {
      return this.focus();
    }
    this.refs.prompt.hide();
  },
  render: function() {
    var props = this.props;
    var state = this.state;
    var title = props.title;
    var value = state.value;

    return (
      <Dialog ref="prompt" wstyle="w-prompt">
      {title ? <div className="modal-header">
        <h4>{title}</h4>
      </div> : null}
      <div className="modal-body">
        <input ref="value" className="form-control" maxLength={props.maxLength || 64}
          onChange={this.onChange} value={value} placeholder={props.placeholder || 'Enter new option'} />
      </div>
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-default"
          data-dismiss="modal"
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={this.onConfirm}
          disabled={!value && !props.allowEmpty}
        >
          Confirm
        </button>
      </div>
    </Dialog>
    );
  }
});

module.exports = Prompt;
