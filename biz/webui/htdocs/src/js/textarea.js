require('../css/textarea.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var $ = require('jquery');
var TextView = require('./textview');
var CopyBtn = require('./copy-btn');
var util = require('./util');
var dataCenter = require('./data-center');
var Tips = require('./panel-tips');
var Icon = require('./icon');
var textareaMixin = require('./textarea-mixin');

var MAX_LENGTH = 1024 * 6;
var getHide = util.getHide;
var getBool = util.getBool;

var Textarea = React.createClass({
  mixins: [textareaMixin],
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    var refs = this.refs;
    var bar = $(findDOMNode(refs.bar));
    $(findDOMNode(refs.textarea))
    .on('mousedown', function() {
      bar.css('visibility', 'hidden');
    })
    .on('mouseup mouseenter blur', function() {
      bar.css('visibility', 'visible');
    });
  },
  shouldComponentUpdate: function (nextProps) {
    var self = this;
    var props = self.props;
    var hide = getBool(props.hide);
    var nextHide = getBool(nextProps.hide);
    if (self._isCaptured !== dataCenter.isCapture) {
      self._isCaptured = dataCenter.isCapture;
      return true;
    }
    if (hide !== nextHide || !props.value) {
      return true;
    }
    if (hide) {
      return false;
    }
    return props.value !== nextProps.value;
  },
  edit: function () {
    util.openEditor(this.props.value);
  },
  download: function () {
    var self = this;
    var props = self.props;
    var target = findDOMNode(self.refs.nameInput);
    var name = target.value.trim();
    target.value = '';
    var base64 = props.base64;
    var refs = self.refs;
    findDOMNode(refs.filename).value = name;
    findDOMNode(refs.type).value = base64 ? 'base64' : '';
    findDOMNode(refs.headers).value = props.headers || '';
    findDOMNode(refs.content).value =
      base64 != null ? base64 : props.value || '';
    findDOMNode(refs.downloadForm).submit();
    self.hideNameInput();
  },
  getText: function() {
    return (this.props.value || '').replace(/\r\n|\r/g, '\n');
  },
  render: function () {
    var self = this;
    var props = self.props;
    var value = props.value || '';
    var exceed = value.length - MAX_LENGTH;
    if (exceed > 512) {
      value = value.substring(0, MAX_LENGTH) +
        '...\r\n\r\n(' +
        exceed +
        ' characters remaining, click "ViewAll" in top-right corner)\r\n';
    }
    var isHexView = props.isHexView;
    self.state.value = value;
    return (
      <div
        className={
          'fill v-box w-textarea' +
          getHide(props.hide)
        }
      >
        <Tips data={props.tips} />
        <div ref="bar" className={'w-textarea-bar' + getHide(!value)}>
          {props.reqType === 'reqRaw' ? <a onClick={props.onEdit}>
            <Icon name="send" />
            Edit
          </a> : null}
          <CopyBtn value={value} />
          {isHexView ? <CopyBtn name="AsHex" value={util.getHexText(value)} /> : null}
          <a
            onDoubleClick={self.download}
            onClick={self.showNameInput}
            className="w-download"
            draggable="false"
          >
            Download
          </a>
          {self.renderAddBtn()}
          <a onClick={self.edit} draggable="false">
            ViewAll
          </a>
          {self.renderInput()}
        </div>
        <TextView ref="textarea" className={props.className || ''} value={value} />
        <form
          ref="downloadForm"
          action="cgi-bin/download"
          style={util.HIDE_STYLE}
          method="post"
          target="downloadTargetFrame"
        >
          <input ref="filename" name="filename" type="hidden" />
          <input ref="type" name="type" type="hidden" />
          <input ref="headers" name="headers" type="hidden" />
          <input ref="content" name="content" type="hidden" />
        </form>
      </div>
    );
  }
});

module.exports = Textarea;
