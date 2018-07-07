var React = require('react');
var BtnGroup = require('./btn-group');
var JSONViewer = require('./json-viewer');
var Textarea = require('./textarea');
var FrameComposer = require('./frame-composer');
var util = require('./util');

var BTNS = [
  {name: 'TextView'},
  {name: 'JSONView'},
  {name: 'HexView'},
  {name: 'Composer'}
];

function findActive(btn) {
  return btn.active;
}

var FrameClient = React.createClass({
  getInitialState: function() {
    return {};
  },
  onClickBtn: function(btn) {
    this.selectBtn(btn);
    this.setState({});
  },
  selectBtn: function(btn) {
    btn.active = true;
    this.state.btn = btn;
  },
  render: function() {
    var state = this.state;
    var btn = state.btn;
    if (BTNS.indexOf(btn) === -1) {
      btn = util.findArray(BTNS, findActive) || BTNS[0];
      this.selectBtn(btn);
    }
    var reqData = this.props.reqData;
    var data = this.props.data;
    var text, json, bin;
    if (data) {
      text = util.getBody(data, true);
      bin = util.getHex(data);
      json = util.getJson(data, true);
    }
    return (
      <div className={'fill orient-vertical-box w-frames-data' + (this.props.hide ? ' hide' : '')}>
        <BtnGroup onClick={this.onClickBtn} btns={BTNS} />
        <Textarea className="fill" value={text} hide={btn.name !== 'TextView'} />
        <JSONViewer data={json} hide={btn.name !== 'JSONView'} />
        <Textarea className="fill n-monospace" value={bin} hide={btn.name !== 'HexView'} />
        <FrameComposer closed={reqData && reqData.closed} hide={btn.name !== 'Composer'} />
      </div>
    );
  }
});

module.exports = FrameClient;
