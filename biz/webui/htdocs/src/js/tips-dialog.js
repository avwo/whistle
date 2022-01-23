require('./base-css.js');
var React = require('react');
var Dialog = require('./dialog');

var TipsDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (data) {
    this._hideDialog = false;
    this.setState(data);
    this.refs.tipsDialog.show();
  },
  hide: function () {
    this.refs.tipsDialog.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  render: function () {
    var state = this.state;
    return (
      <Dialog ref="tipsDialog" wstyle="w-dns-servers-dialog w-tips-dialog">
        <div className="modal-header">
          {state.title}
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <pre className="modal-body">{state.tips}</pre>
        <div className="modal-footer">
          <button
            type="button"
            data-dismiss="modal"
            className="btn btn-primary w-copy-text-with-tips"
            data-clipboard-text={state.dir}
          >
            Copy directory
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

module.exports = TipsDialog;
