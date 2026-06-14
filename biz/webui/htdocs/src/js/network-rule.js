var React = require('react');
var HostInput = require('./host-input');
var Select = require('./custom-select');
var HelpIcon = require('./help-icon');
var util = require('./util');
var ruleMixin = require('./rule-mixin');

var PROXY_OPTIONS = [
  { value: 'proxy', label: 'HTTP Proxy' },
  { value: 'https-proxy', label: 'HTTPS Proxy' },
  { value: 'socks', label: 'SOCKS5 Proxy' }
];

var NetworkRule = React.createClass({
  mixins: [ruleMixin],
  getInitialState: function() {
    return {
      disabledServer: false,
      disabledProxy: false,
      proxyName: 'proxy',
      proxyAddress: '',
      serverAddress: ''
    };
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
  onAddressChange: function(host, name) {
    this.setState({ [name]: host }, this.handleChange);
  },
  onProxyNameChange: function(option) {
    this.setState({ proxyName: option.value }, this.handleChange);
  },
  handleChange: function() {
    var state = this.state;
    var proxyName = state.proxyName;
    var proxyAddress = !state.disabledProxy && state.proxyAddress;
    var serverAddress = !state.disabledServer && state.serverAddress;
    var rules = [];
    if (serverAddress) {
      rules.push('host://' + serverAddress);
    }
    if (proxyAddress) {
      rules.push(proxyName + '://' + proxyAddress);
      if (serverAddress) {
        rules.push('lineProps://proxyHost');
      }
    }
    rules = rules.join(' ');
    if (this._curRules !== rules) {
      this._curRules = rules;
      this.props.onChange(rules);
    }
  },
  render: function() {
    var state = this.state;
    var proxyName = state.proxyName;
    var hide = this.props.hide;
    var disabledServer = state.disabledServer;
    var disabledProxy = state.disabledProxy;

    return (
      <div className={'w-rules-form' + (hide ? ' w-hide' : '')}>
        <div className="w-form-item">
          <label>
            <input type="checkbox" className="mr-10" checked={!disabledServer} data-name="disabledServer" onChange={this.onDisableCheckChange} />
            Server Address
            <HelpIcon docsUrl="rules/host.html" className="ml-10" />
          </label>
          <HostInput name="serverAddress" className="w-form-value" onChange={this.onAddressChange} disabled={disabledServer} />
        </div>
        <div className="w-form-item">
          <label>
            <input type="checkbox" className="mr-10" checked={!disabledProxy} data-name="disabledProxy" onChange={this.onDisableCheckChange} />
            <Select value={proxyName} className="w-proxy-options" onChange={this.onProxyNameChange} options={PROXY_OPTIONS} />
            Address
            <HelpIcon docsUrl={'rules/' + proxyName + '.html'} className="ml-10" />
          </label>
          <HostInput name="proxyAddress" className="w-form-value" onChange={this.onAddressChange} disabled={disabledProxy} />
        </div>
      </div>
    );
  }
});

module.exports = NetworkRule;
