var React = require('react');
var Dialog = require('./dialog');
var Detail = require('./detail');

var MIN_HEIGHT = 550;

var DetailDialog = React.createClass({
  show: function (data) {
    if (!data) {
      return;
    }
    var self = this;
    self.refs.detail.show();
    var height = Math.max(
      MIN_HEIGHT,
      document.documentElement.clientHeight - 110
    );
    setTimeout(function () {
      self.setState({ data: data, height: height });
    }, 500);
  },
  hide: function () {
    this.refs.detail.hide();
    this.setState({ data: null });
  },
  shouldComponentUpdate: function () {
    return (
      !this.state || (this.state.data ? this.refs.detail.isVisible() : false)
    );
  },
  render: function () {
    var state = this.state;
    var height = (state && state.height) || MIN_HEIGHT;
    return (
      <Dialog ref="detail" wstyle="w-detail-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div className="w-detail-wrap box" style={{ height: height }}>
            {state ? <Detail data={state.data} /> : undefined}
          </div>
        </div>
        <div className="modal-footer">
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

module.exports = DetailDialog;
