var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var $ = require('jquery');
var dataCenter = require('./data-center');
var util = require('./util');
var Icon = require('./icon');

var addEvent = util.on;

var FilterBtn = React.createClass({
  getInitialState: function () {
    return {
      hasFilterText: !!dataCenter.filterIsEnabled()
    };
  },
  componentDidMount: function () {
    var self = this;
    addEvent('filterChanged', function () {
      var hasFilterText = !!dataCenter.filterIsEnabled();
      if (hasFilterText !== self.state.hasFilterText) {
        self.setState({
          hasFilterText: !!dataCenter.filterIsEnabled()
        });
      }
    });
    addEvent('shakeSettings', function () {
      setTimeout(function () {
        util.shakeElem($(findDOMNode(self.refs.settings)));
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
        style={util.getHideStyle(hide)}
        draggable="false"
      >
        <Icon name="cog" />
        Settings
      </a>
    );
  }
});
module.exports = FilterBtn;
