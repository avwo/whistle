var React = require('react');
var events = require('./events');
var Icon = require('./icon');

var UpdateAllBtn = React.createClass({
  getInitialState: function () {
    return { disabled: true };
  },
  componentDidMount: function () {
    var self = this;
    events.on('setUpdateAllBtnState', function (_, hasNewPlugin) {
      self.setState({ disabled: !hasNewPlugin });
    });
  },
  updateAllPlugins: function () {
    !this.state.disabled && events.trigger('updateAllPlugins');
  },
  render: function () {
    var self = this;
    var hide = self.state.disabled || self.props.hide;
    return (
      <a
        onClick={self.updateAllPlugins}
        className={'w-plugins-menu w-plugin-update-btn' + (hide ? ' hide' : '')}
        draggable="false"
      >
        <Icon name="refresh" />
        Update
      </a>
    );
  }
});

module.exports = UpdateAllBtn;
