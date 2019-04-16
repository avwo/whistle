var React = require('react');
var events = require('./events');

var UpdateAllBtn = React.createClass({
  getInitialState: function() {
    return { disabled: true };
  },
  componentDidMount: function() {
    var self = this;
    events.on('setUpdateAllBtnState', function(_, hasNewPlugin) {
      self.setState({ disabled: !hasNewPlugin });
    });
  },
  updateAllPlugins: function() {
    events.trigger('updateAllPlugins');
  },
  render: function() {
    return (
      <a onClick={this.updateAllPlugins} className={'w-plugins-menu' +
        (this.state.disabled ? '' : ' w-disabed')} href="javascript:;" draggable="false">
        <span className="glyphicon glyphicon-refresh" />
        UploadAll
      </a>
    );
  }
});

module.exports = UpdateAllBtn;
