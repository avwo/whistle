var React = require('react');

var PluginsTabs = React.createClass({
  render: function() {
    var hide = this.props.hide;
    return (
        <div className={'fill box w-plugins-tabs' + (hide ? ' hide' : '')}>
        </div>
    );
  }
});


module.exports = PluginsTabs;
