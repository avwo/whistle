var React = require('react');
var Dialog = require('./dialog');
var ModalHeader = require('./modal-header');
var DismissBtn = require('./dismiss-btn');
var util = require('./util');

var TipsDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (data) {
    this.refs.dialog.show();
    this.setState(data);
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  shouldComponentUpdate: util.scuDialog,
  render: function () {
    var state = this.state;
    return (
      <Dialog ref="dialog" wstyle="w-dns-servers w-tips-dialog">
        <ModalHeader>
          {state.title}
        </ModalHeader>
        <pre className="modal-body">{state.tips}</pre>
        <div className="modal-footer">
          <DismissBtn />
          <button
            type="button"
            data-dismiss="modal"
            className="btn btn-primary w-copy-text-with-tips"
            data-clipboard-text={state.dir}
          >
            Copy directory
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = TipsDialog;
