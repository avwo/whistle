var React = require('react');
var util = require('./util');
var dataCenter = require('./data-center');

var TabFrame = React.createClass({
  getInitialState: function() {
    var url = this.props.src;
    url += (url.indexOf('?') === -1 ? '?' : '&');
    return {
      url: url + '???_WHISTLE_PLUGIN_INSPECTOR_TAB_' + dataCenter.getPort() + '???'
    };
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    return <iframe src={this.state.url} style={{display: this.props.hide ? 'none' : undefined}} className="fill w-tab-frame"  />;
  }
});

module.exports = TabFrame;
