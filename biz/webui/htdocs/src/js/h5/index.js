require('bootstrap/dist/css/bootstrap.css');
require('../../css/h5.css');

var React = require('react');
var ReactDOM = require('react-dom');
var Network = require('./network');
var Rules = require('./rules');
var Values = require('./values');
var Plugins = require('./plugins');
var common = require('../common');

const App = React.createClass({
  getInitialState: function() {
    var state = {};
    var pageName = common.getPageName(state);
    if (!pageName || pageName.indexOf('rules') != -1) {
      state.hasRules = true;
      state.name = 'rules';
    } else if (pageName.indexOf('values') != -1) {
      state.hasValues = true;
      state.name = 'values';
    } else if (pageName.indexOf('plugins') != -1) {
      state.hasPlugins = true;
      state.name = 'plugins';
    } else if (state.showAccount && pageName === 'account') {
      state.hasAccount = true;
      state.name = 'account';
    } else {
      state.hasNetwork = true;
      state.name = 'network';
    }

    return state;
  },
  switchTab: function(e) {
    var name = e.target.getAttribute('data-name');
    if (!name) {
      return;
    }
    this.setState({
      name: name
    });
  },
  getActiveClass: function() {
    var name = this.state.name;
    return [
      name === 'network' ? 'w-active' : '',
      name === 'rules' ? 'w-active' : '',
      name === 'values' ? 'w-active' : '',
      name === 'plugins' ? 'w-active' : ''
    ];
  },
  render: function() {
    var classes = this.getActiveClass();

    return (
      <div className="w-h5-wrap">
        <div className="w-h5-tabs" onClick={this.switchTab}>
          <div data-name="network" className={classes[0]}>
            Network
          </div>
          <div data-name="rules" className={classes[1]}>
            Rules
          </div>
          <div data-name="values" className={classes[2]}>
            Values
          </div>
          <div data-name="plugins" className={classes[3]}>
            Plugins
          </div>
        </div>
        <Network className={classes[0]} />
        <Rules className={classes[1]} />
        <Values className={classes[2]} />
        <Plugins className={classes[3]} />
      </div>
    );
  }
});

ReactDOM.render(<App />, document.getElementById('container'));
