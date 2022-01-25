var React = require('react');
var events = require('./events');

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
    var hide = this.state.disabled || this.props.hide;
    return (
      <a
        onClick={this.updateAllPlugins}
        className={'w-plugins-menu w-plugin-update-btn' + (hide ? ' hide' : '')}
        draggable="false"
      >
        <span className="glyphicon glyphicon-refresh" />
        UpdateAll
      </a>
    );
  }
});

module.exports = UpdateAllBtn;
