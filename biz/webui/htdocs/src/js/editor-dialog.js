require('./base-css.js');
var React = require('react');
var Dialog = require('./dialog');

var EditorDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (data) {
    this._hideDialog = false;
    this.setState(data);
    this.refs.editorDialog.show();
  },
  hide: function () {
    this.refs.editorDialog.hide();
    this._hideDialog = true;
  },
  onChange: function (e) {
    this.setState({ value: e.target.value });
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  render: function () {
    var state = this.state;
    var value = state.value;
    return (
      <Dialog ref="editorDialog" wstyle="w-editor-dialog">
        <div className="modal-header">
          Edit the copied text
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <textarea onChange={this.onChange} value={value} />
        </div>
        <div className="modal-footer">
          <button
            type="button"
            data-dismiss="modal"
            className="btn btn-primary w-copy-text-with-tips"
            data-clipboard-text={state.value}
            disabled={!value}
          >
            Copy
          </button>
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Close
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = EditorDialog;
