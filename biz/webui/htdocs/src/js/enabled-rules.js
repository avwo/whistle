var React = require('react');
var util = require('./util');
var Properties = require('./properties');
var Dialog = require('./dialog');
var ModalHeader = require('./modal-header');
var DismissBtn = require('./dismiss-btn');
var PanelTips = require('./panel-tips');

var EMPTY = { message: 'No enabled rules' };

var EnabledRulesDialog = React.createClass({
  getInitialState: function () {
    return { list: [] };
  },
  shouldComponentUpdate: util.scuDlg,
  handleClickLocate: function (rule) {
    this.hide();
    util.handleClickLocate(rule);
  },
  show: function (list) {
    this.refs.dialog.show();
    this.setState({ list: list });
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  render: function () {
    var list = this.state.list || [];

    return (
      <Dialog ref="dialog" wstyle="w-enabled-rules-dialog">
          <ModalHeader>
            Enabled Rules
          </ModalHeader>
          {list.length ? <Properties
            name="Rules"
            wrapClass="box fill w-enabled-rules"
            onClickLocate={this.handleClickLocate}
            modal={list}
          /> : <PanelTips data={EMPTY} className="w-empty-tips" />}
          <div className="modal-footer">
            <DismissBtn />
          </div>
      </Dialog>
    );
  }
});

module.exports = EnabledRulesDialog;
