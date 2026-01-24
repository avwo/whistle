require('../css/iframe.css');
var React = require('react');
var ReactDOM = require('react-dom');
var dataCenter = require('./data-center');

var IFrame = React.createClass({
  getWindow: function() {
    return ReactDOM.findDOMNode(this.refs.iframe).contentWindow;
  },
  onload: function(e) {
    var onLoad = this.props.onLoad;
    if (typeof onLoad === 'function') {
      onLoad(e);
    }
    dataCenter.handleIframeLoad(e);
  },
  render: function() {
    var props = this.props;
    var className = props.className;
    return (
      <div className={'fill box w-fix-drag w-iframe' + (className ? ' ' + className : '')} style={props.style}>
        <iframe ref="iframe" onLoad={this.onload} src={props.src} className="fill" />
      </div>
    );
  }
});

module.exports = IFrame;
