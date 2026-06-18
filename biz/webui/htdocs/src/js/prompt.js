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
    var self = this;
    var isNum = self.props.isNum;
    var isHeader = self.props.isHeader;
    self.setState({value: e.target.value.replace(isNum ? NUM_RE : isHeader ? HEADER_RE : DEF_RE, '')});
  },
  show: function(callback, value) {
    var self = this;
    self.setState({ value: value || '' });
    self._callback = callback;
    self.refs.prompt.show();
    setTimeout(self.focus, 300);
  },
  focus: function() {
    var input = this.refs.value;
    input.focus();
    input.select();
  },
  onConfirm: function() {
    var self = this;
    var cb = self._callback;
    if (cb && cb(self.state.value) === false) {
      return self.focus();
    }
    self.refs.prompt.hide();
  },
  render: function() {
    var self = this;
    var props = self.props;
    var state = self.state;
    var title = props.title;
    var value = state.value;

    return (
      <Dialog ref="prompt" wstyle="w-prompt">
      {title ? <div className="modal-header">
        <h4>{title}</h4>
      </div> : null}
      <div className="modal-body">
        <input ref="value" className="form-control" maxLength={props.maxLength || 64}
          onChange={self.onChange} value={value} placeholder={props.placeholder || 'Enter new option'} />
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
          onClick={self.onConfirm}
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
