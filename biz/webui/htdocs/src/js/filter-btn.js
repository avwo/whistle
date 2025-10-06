var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var dataCenter = require('./data-center');
var events = require('./events');
var util = require('./util');

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
    events.on('shakeSettings', function () {
      setTimeout(function () {
        util.shakeElem($(ReactDOM.findDOMNode(self.refs.settings)));
      }, 100);
    });
  },
  render: function () {
    var props = this.props;
    var hide = props.hide;
    var isNetwork = props.isNetwork;
    var className = props.backRulesFirst || (isNetwork && this.state.hasFilterText ? ' w-menu-enable' : '');
    return (
      <a
        ref="settings"
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
