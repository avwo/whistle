require('../css/assistant.css');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var events = require('./events');
var Teleport = require('./teleport');
var dataCenter = require('./data-center');
var getServiceBridge = require('./bridge').getServiceBridge;
var CloseBtn = require('./close-btn');

var SIZE = 26;
var POS = 30;
var bridgeApi;

var Assistant = React.createClass({
  componentDidMount: function() {
    var self = this;
    var width;
    var height;
    var timer;
    var updateSize = function() {
      width = document.documentElement.clientWidth;
      height = document.documentElement.clientHeight;
    };
    events.on('stopDrag', function() {
      setTimeout(function () {
        self._preventClick = false;
      },30);
    });
    events.on('whistleIdChanged', function () {
      self.setState({});
    });
    events.on('showAssistant', function(_, text) {
      self.show(text);
    });
    window.addEventListener('resize', function() {
      timer = timer || setTimeout(function() {
        timer = null;
        updateSize();
      }, 300);
    });
    var translate = function(target, x, y, elemWidth, elemHeight, right, bottom) {
      self._preventClick = true;
      width == null && updateSize();
      x = Math.min(right, (parseInt(target.css('--x'), 10) || 0) + x);
      y = Math.min(bottom, (parseInt(target.css('--y'), 10) || 0) + y);
      target.css({ '--x': Math.max(x, -width + elemWidth + right) + 'px', '--y': Math.max(y, -height + elemHeight + bottom) + 'px' });
    };
    util.addDragEvent('.w-assistant', function(target, x, y) {
      translate(target, x, y, SIZE, SIZE, POS, POS);
    });
  },
  show: function(text) {
    if (this._preventClick) {
      return;
    }
    this.refs.dialog.show();
    var iframe = ReactDOM.findDOMNode(this.refs.iframe);
    bridgeApi = bridgeApi || getServiceBridge(this.hideService);
    var query = util.notEStr(text) ? '?text=' + encodeURIComponent(text) : '';
    iframe.src = util.getServiceUrl(iframe.contentWindow, '/assistant' + query, bridgeApi);
  },
  hide: function() {
    !this._preventClick && this.refs.dialog.hide();
  },
  render: function() {
    return (
      <div className={'w-assistant' + (dataCenter.whistleId ? '' : ' hide')} title="Whistle Assistant" onClick={this.show}>
        <Teleport ref="dialog" className="w-assistant-dialog">
          <div>
            <CloseBtn onClick={this.hide} />
            <div className="w-fix-drag">
              <iframe ref="iframe" onLoad={dataCenter.handleIframeLoad} />
            </div>
          </div>
        </Teleport>
      </div>
    );
  }
});

module.exports = Assistant;
