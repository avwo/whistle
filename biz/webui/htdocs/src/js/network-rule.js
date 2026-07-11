var React = require('react');
var HostInput = require('./host-input');
var Select = require('./custom-select');
var HelpIcon = require('./help-icon');
var util = require('./util');
var ruleMixin = require('./rule-mixin');
var UrlInput = require('./url-input');

var PROXY_OPTIONS = [
  { value: 'proxy', label: 'HTTP Proxy' },
  { value: 'https-proxy', label: 'HTTPS Proxy' },
  { value: 'socks', label: 'SOCKS5 Proxy' },
  { value: 'pac', label: 'PAC Script' }
];
var getHide = util.getHide;

var NetworkRule = React.createClass({
  mixins: [ruleMixin],
  getInitialState: function() {
    return {
      disabledServer: false,
      disabledProxy: false,
      proxyName: 'proxy',
      proxyAddress: '',
      serverAddress: '',
      pac: ''
    };
  },
  shouldComponentUpdate: util.scu,
  onPacChange: function(url) {
    this.onStateChange('pac', url);
  },
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
    var proxyAddress = !state.disabledProxy && (proxyName === 'pac' ? state.pac.replace(/^file:\/\//, '') : state.proxyAddress);
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
    var isPac = proxyName === 'pac';

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
          <div className={'w-form-value' + getHide(!isPac)}><UrlInput enableFile enableService onChange={self.onPacChange} disabled={disabledProxy} /></div>
          <HostInput name="proxyAddress" className={'w-form-value' + getHide(isPac)} onChange={onAddrChange} disabled={disabledProxy} />
        </div>
      </div>
    );
  }
});

module.exports = NetworkRule;
