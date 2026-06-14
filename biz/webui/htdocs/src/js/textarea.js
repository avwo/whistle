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

var Textarea = React.createClass({
  mixins: [textareaMixin],
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    var bar = $(findDOMNode(this.refs.bar));
    $(findDOMNode(this.refs.textarea))
    .on('mousedown', function() {
      bar.css('visibility', 'hidden');
    })
    .on('mouseup mouseenter blur', function() {
      bar.css('visibility', 'visible');
    });
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBool(this.props.hide);
    var nextHide = util.getBool(nextProps.hide);
    if (this._isCaptured !== dataCenter.isCapture) {
      this._isCaptured = dataCenter.isCapture;
      return true;
    }
    if (hide !== nextHide || !this.props.value) {
      return true;
    }
    if (hide) {
      return false;
    }
    return this.props.value !== nextProps.value;
  },
  edit: function () {
    util.openEditor(this.props.value);
  },
  download: function () {
    var target = findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    target.value = '';
    var base64 = this.props.base64;
    findDOMNode(this.refs.filename).value = name;
    findDOMNode(this.refs.type).value = base64 ? 'base64' : '';
    findDOMNode(this.refs.headers).value = this.props.headers || '';
    findDOMNode(this.refs.content).value =
      base64 != null ? base64 : this.props.value || '';
    findDOMNode(this.refs.downloadForm).submit();
    this.hideNameInput();
  },
  getText: function() {
    return (this.props.value || '').replace(/\r\n|\r/g, '\n');
  },
  render: function () {
    var props = this.props;
    var value = props.value || '';
    var exceed = value.length - MAX_LENGTH;
    if (exceed > 512) {
      value = value.substring(0, MAX_LENGTH) +
        '...\r\n\r\n(' +
        exceed +
        ' characters remaining, click "ViewAll" in top-right corner)\r\n';
    }
    var isHexView = props.isHexView;
    this.state.value = value;
    return (
      <div
        className={
          'fill v-box w-textarea' +
          (props.hide ? ' hide' : '')
        }
      >
        <Tips data={props.tips} />
        <div ref="bar" className={'w-textarea-bar' + (value ? '' : ' hide')}>
          {props.reqType === 'reqRaw' ? <a onClick={props.onEdit}>
            <Icon name="send" />
            Edit
          </a> : undefined}
          <CopyBtn value={props.value} />
          {isHexView ? (
            <CopyBtn name="AsHex" value={util.getHexText(props.value)} />
          ) : undefined}
          <a
            onDoubleClick={this.download}
            onClick={this.showNameInput}
            className="w-download"
            draggable="false"
          >
            Download
          </a>
          {this.renderAddBtn()}
          <a onClick={this.edit} draggable="false">
            ViewAll
          </a>
          {this.renderInput()}
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
