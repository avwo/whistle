var React = require('react');
var dataCenter = require('./data-center');
var events = require('./events');

var FilterBtn = React.createClass({
  getInitialState: function() {
    return {
      hasFilterText: dataCenter.filterIsEnabled()
    };
  },
  componentDidMount: function() {
    var self = this;
    events.on('filterChanged', function() {
      self.setState({
        hasFilterText: dataCenter.filterIsEnabled()
      });
    });
  },
  render: function() {
    var hide = this.props.hide;
    var isNetwork = this.props.isNetwork;
    var hasFilterText = this.state.hasFilterText;
    var className = hasFilterText ? ' w-menu-enable'  : '';
    return (
      <a
        onClick={this.props.onClick}
        className={'w-settings-menu' + className}
        style={{display: hide ? 'none' : ''}}
        href="javascript:;"
        draggable="false"
      >
        <span
          className={'glyphicon glyphicon-' + (isNetwork ? 'filter' : 'cog')}
        />{isNetwork ? 'Filter' : 'Settings'}
      </a>
    );
  }
});
module.exports = FilterBtn;
