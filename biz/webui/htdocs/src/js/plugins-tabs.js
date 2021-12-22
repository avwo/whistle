var React = require('react');

var PluginsTabs = React.createClass({
  render: function() {
    var tabs = this.props.tabs;
    var hide =  this.props.hide;
    return (
        <div className={'fill box w-plugins-tabs' + (hide ? ' hide' : '')}>
          <div className={'w-plugins-tabs-list' + (tabs.length < 2 ? ' hide' : '')}>

          </div>
          <div className="fill w-plugins-tabs-panel">

          </div>
        </div>
    );
  }
});


module.exports = PluginsTabs;
