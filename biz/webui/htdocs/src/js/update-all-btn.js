var React = require('react');
var events = require('./events');

var DISABLED = {
  color: '#888',
  cursor: 'not-allowed'
};

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
    !this.state.disabled && events.trigger('updateAllPlugins');
  },
  render: function() {
    return (
      <a style={this.state.disabled ? DISABLED : undefined}
        onClick={this.updateAllPlugins} className={'w-plugins-menu' +
        (this.props.hide ? ' hide' : '')} draggable="false">
        <span className="glyphicon glyphicon-refresh" />
        UpdateAll
      </a>
    );
  }
});

module.exports = UpdateAllBtn;
