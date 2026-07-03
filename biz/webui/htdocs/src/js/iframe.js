require('../css/iframe.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var dataCenter = require('./data-center');
var util = require('./util');

var IFrame = React.createClass({
  getWindow: function() {
    return findDOMNode(this.refs.iframe).contentWindow;
  },
  onload: function(e) {
    var onLoad = this.props.onLoad;
    if (util.isFunc(onLoad)) {
      onLoad(e);
    }
    dataCenter.handleIframeLoad(e);
  },
  render: function() {
    var props = this.props;
    return (
      <div className={'fill box w-fix-drag w-iframe ' + (props.className || '')} style={props.style}>
        <iframe ref="iframe" onLoad={this.onload} src={props.src} className="fill" />
      </div>
    );
  }
});

module.exports = IFrame;
