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
    events.on('accountRulesChanged', function() {
      self.setState({});
    });
  },
  render: function () {
    var props = this.props;
    var hide = props.hide;
    var isNetwork = props.isNetwork;
    var className = props.backRulesFirst ||
      (isNetwork ? this.state.hasFilterText : dataCenter.hasAccountRules) ? ' w-menu-enable' : '';
    return (
      <a
        onClick={props.onClick}
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
