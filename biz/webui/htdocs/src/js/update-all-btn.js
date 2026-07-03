var React = require('react');
var util = require('./util');
var Icon = require('./icon');

var UpdateAllBtn = React.createClass({
  getInitialState: function () {
    return { disabled: true };
  },
  componentDidMount: function () {
    var self = this;
    util.on('setUpdateAllBtnState', function (_, hasNewPlugin) {
      self.setState({ disabled: !hasNewPlugin });
    });
  },
  updateAllPlugins: function () {
    !this.state.disabled && util.trigger('updateAllPlugins');
  },
  render: function () {
    var self = this;
    var hide = self.state.disabled || self.props.hide;
    return (
      <a
        onClick={self.updateAllPlugins}
        className={'w-plugins-menu w-plugin-update-btn' + util.getHide(hide)}
        draggable="false"
      >
        <Icon name="refresh" />
        Update
      </a>
    );
  }
});

module.exports = UpdateAllBtn;
