var React = require('react');
var Dialog = require('./dialog');
var CloseBtn = require('./close-btn');
var Console = require('./console');

var LogDialog = React.createClass({
  getInitialState: function () {
    return { visible: false };
  },
  shouldComponentUpdate: function (_, nextState) {
    return this.state.visible !== nextState.visible;
  },
  onVisibleChange: function (visible) {
    this.setState({ visible: visible });
  },
  show: function () {
    this.refs.dialog.show();
  },
  render: function () {
    return (
      <Dialog ref="dialog" wclassName="w-tools w-console-dialog" onVisibleChange={this.onVisibleChange}>
        <div className="modal-header">
          <h4>Console</h4>
          <CloseBtn />
        </div>
        <Console hide={!this.state.visible} className="modal-body" />
      </Dialog>
    );
  }
});

module.exports = LogDialog;
