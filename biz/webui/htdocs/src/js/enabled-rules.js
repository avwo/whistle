var React = require('react');
var util = require('./util');
var Properties = require('./properties');
var Empty = require('./empty');
var Dialog = require('./dialog');
var CloseBtn = require('./close-btn');

var EnabledRulesDialog = React.createClass({
  getInitialState: function () {
    return { list: [] };
  },
  shouldComponentUpdate: function () {
    return this.refs.enabledRules.isVisible();
  },
  handleClickLocate: function (rule) {
    this.hide();
    util.handleClickLocate(rule);
  },
  show: function (list) {
    this.refs.enabledRules.show();
    this.setState({ list: list });
  },
  hide: function () {
    this.refs.enabledRules.hide();
  },
  render: function () {
    var list = this.state.list || [];

    return (
      <Dialog ref="enabledRules" wstyle="w-enabled-rules-dialog">
          <div className="modal-header">
            <h4>Enabled Rules</h4>
            <CloseBtn />
          </div>
          {list.length ? <Properties
            name="Rules"
            wrapClass="box fill w-enabled-rules"
            onClickLocate={this.handleClickLocate}
            modal={list}
          /> : <Empty />}
      </Dialog>
    );
  }
});

module.exports = EnabledRulesDialog;
