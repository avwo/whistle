var React = require('react');


function formatPort(port) {
  return port > 65535 ? '65535' : port;
}

var HostInput = React.createClass({
  getInitialState: function() {
    return { host: '', port: '' };
  },
  handleChange: function() {
    var self = this;
    var props = self.props;
    var onChange = props.onChange;
    if (onChange) {
      var state = self.state;
      var host = state.host;
      var port = state.port;
      if (port) {
        if (host.indexOf(':') !== -1) {
          host = '[' + host + ']';
        }
        host += ':' + port;
      }
      onChange(host, props.name);
    }
  },
  onHostChange: function(e) {
    var host = e.target.value.trim();
    var state = {};
    var index = host[0] === '[' ? host.indexOf(']:') : -1;
    if (index !== -1) {
      var port = host.substring(index + 2);
      if (port > 0) {
        state.port = formatPort(port);
      }
      host = host.substring(1, index);
    }
    state.host = host.replace(/[^\w.:-]+/g, '');
    this.setState(state, this.handleChange);

  },
  onPortChange: function(e) {
    var port = e.target.value.replace(/(?:^0|\D)+/g, '');
    this.setState({ port: formatPort(port) }, this.handleChange);
  },
  render: function() {
    var self = this;
    var state = self.state;
    var props = self.props;
    var disabled = props.disabled;

    return (
      <div className={'w-host-input ' + (props.className || '')}>
        <input type="text" className="form-control w-host-input-name" placeholder="Enter IP or Domain"
          maxLength="256" value={state.host} onChange={self.onHostChange} disabled={disabled} />
        :
        <input type="number" className="form-control w-host-input-port" placeholder="Port"
          maxLength="5" value={state.port} onChange={self.onPortChange} disabled={disabled} />
      </div>
    );
  }
});

module.exports = HostInput;
