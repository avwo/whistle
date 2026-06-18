require('../css/divider.css');
var $ = require('jquery');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var util = require('./util');

var getHideStyle = util.getHideStyle;

util.addDragEvent('.w-divider', function (target, x, y) {
  target = target.parent();
  var con = target.parent();
  var isVertical = !con.hasClass('box');
  var isRight = target.hasClass('w-divider-right');
  var size = isVertical
    ? target[0].offsetHeight - (isRight ? y : -y)
    : target[0].offsetWidth - (isRight ? x : -x);
  var conSize = con[0][isVertical ? 'offsetHeight' : 'offsetWidth'];
  target[isVertical ? 'height' : 'width'](
    Math.min(conSize - 5, Math.max(5, size))
  );
});

var Divider = React.createClass({
  componentDidMount: function () {
    this.reset();
  },
  componentDidUpdate: function () {
    this._needReset && this.reset();
  },
  triggerDOMReady: function () {
    var self = this;
    if (self.__inited) {
      return;
    }
    self.__inited = true;
    self.props.onDOMReady && self.props.onDOMReady();
  },
  reset: function () {
    var self = this;
    var divider = findDOMNode(self.refs.divider);
    if (!divider.offsetHeight) {
      self._needReset = true;
      return;
    }
    self._needReset = false;
    var vertical = util.getBool(self.props.vertical);
    var prop = vertical ? 'height' : 'width';
    var con = $(divider);
    var leftElem = con.children('.w-divider-left');
    var rightElem = con.children('.w-divider-right');
    leftElem.add(rightElem).css({ height: 'auto', width: 'auto' });
    if (self._leftWidth > 0) {
      leftElem[prop](self._leftWidth);
      self.triggerDOMReady();
      return;
    }

    var rightWidth = parseInt(self.props.rightWidth, 10);
    if (!(rightWidth > 0)) {
      setTimeout(function () {
        var ratio = self.props.splitRatio;
        rightWidth =
          (vertical ? divider.offsetHeight : divider.offsetWidth) * (ratio > 0 ? ratio : 1 / 2);
        rightElem[prop](Math.max(rightWidth, 5));
        self.triggerDOMReady();
      }, 10);
      return;
    }

    rightElem[prop](Math.max(rightWidth, 5));
    self.triggerDOMReady();
  },
  render: function () {
    var self = this;
    var vertical = util.getBool(self.props.vertical);
    var divider = <div className="w-divider" onDoubleClick={self.reset} />;
    var hideLeft = self.props.hideLeft;
    var hideRight = self.props.hideRight;
    var leftWidth = parseInt(self.props.leftWidth, 10);
    if (leftWidth > 0) {
      self._leftWidth = leftWidth;
    } else {
      leftWidth = 0;
    }
    var noLeft = leftWidth || hideLeft;

    return (
      <div
        ref="divider"
        className={
          (vertical ? 'v-box' : 'box') +
          ' fill w-divider-con ' +
          (self.props.className || '') +
          (util.getBool(self.props.hide) ? ' hide' : '')
        }
      >
        <div
          style={getHideStyle(hideLeft)}
          className={
            (leftWidth ? '' : 'fill ') +
            'w-divider-left v-box ' +
            (self.props.leftClassName || '')
          }
        >
          {leftWidth && !hideRight ? divider : null}
          {self.props.children[0]}
        </div>
        <div
          style={getHideStyle(hideRight)}
          className={
            (noLeft ? 'fill ' : '') +
            'w-divider-right v-box ' +
            (self.props.rightClassName || '')
          }
        >
          {noLeft ? null : divider}
          {self.props.children[1]}
        </div>
      </div>
    );
  }
});

module.exports = Divider;
