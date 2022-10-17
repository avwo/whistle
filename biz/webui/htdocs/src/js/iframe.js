require('../css/iframe.css');
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');

var IFrame = React.createClass({
  getWindow: function() {
    return ReactDOM.findDOMNode(this.refs.iframe).contentWindow;
  },
  componentDidMount: function() {
    $(document).on('mousedown', '.w-iframe-mask', function() {
      $('.w-iframe-mask').hide();
    })
    .on('mouseenter', '.w-iframe[allow-dragover=1]', function() {
      $('.w-iframe-mask').hide().parent().removeAttr('allow-dragover');
    });
  },
  render: function() {
    var props = this.props;
    var className = props.className;
    return (
      <div className={'fill box w-iframe' + (className ? ' ' + className : '')} style={props.style}>
        <iframe ref="iframe" onLoad={props.onLoad} src={props.src} className="fill" />
        <div className="w-iframe-mask"></div>
      </div>
    );
  }
});

module.exports = IFrame;
