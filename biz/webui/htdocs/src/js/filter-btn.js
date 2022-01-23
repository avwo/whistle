var React = require('react');
var dataCenter = require('./data-center');
var events = require('./events');

var FilterBtn = React.createClass({
  getInitialState: function () {
    return {
      hasFilterText: !!dataCenter.filterIsEnabled()
    };
  },
  componentDidMount: function () {
    var self = this;
    events.on('filterChanged', function () {
      var hasFilterText = !!dataCenter.filterIsEnabled();
      if (hasFilterText !== self.state.hasFilterText) {
        self.setState({
          hasFilterText: !!dataCenter.filterIsEnabled()
        });
      }
    });
  },
  render: function () {
    var hide = this.props.hide;
    var isNetwork = this.props.isNetwork;
    var className =
      isNetwork && this.state.hasFilterText ? ' w-menu-enable' : '';
    return (
      <a
        onClick={this.props.onClick}
        className={'w-settings-menu' + className}
        style={{ display: hide ? 'none' : '' }}
        draggable="false"
      >
        <span className="glyphicon glyphicon-cog" />
        Settings
      </a>
    );
  }
});
module.exports = FilterBtn;
