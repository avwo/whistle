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
  shouldComponentUpdate: util.scu,
  onAddrChange: function(host, name) {
    this.onStateChange(name, host);
  },
  onProxyNameChange: function(option) {
    this.onStateChange('proxyName', option.value);
  },
  handleChange: function() {
    var self = this;
    var state = self.state;
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
    if (self._curRules !== rules) {
      self._curRules = rules;
      self.props.onChange(rules);
    }
  },
  render: function() {
    var self = this;
    var state = self.state;
    var proxyName = state.proxyName;
    var disabledServer = state.disabledServer;
    var disabledProxy = state.disabledProxy;
    var renderBox = self.renderBox;
    var onAddrChange = self.onAddrChange;

    return (
      <div className={'w-rules-form' + (self.props.hide ? ' w-hide' : '')}>
        <div className="w-form-item">
          <label>
            {renderBox(!disabledServer, 'disabledServer')}
            Server Address
            <HelpIcon docsUrl="rules/host.html" className="ml-10" />
          </label>
          <HostInput name="serverAddress" className="w-form-value" onChange={onAddrChange} disabled={disabledServer} />
        </div>
        <div className="w-form-item">
          <label>
            {renderBox(!disabledProxy, 'disabledProxy')}
            <Select value={proxyName} className="w-proxy-options" onChange={self.onProxyNameChange} options={PROXY_OPTIONS} />
            Address
            <HelpIcon docsUrl={'rules/' + proxyName + '.html'} className="ml-10" />
          </label>
          <HostInput name="proxyAddress" className="w-form-value" onChange={onAddrChange} disabled={disabledProxy} />
        </div>
      </div>
    );
  }
});

module.exports = NetworkRule;
