var React = require('react');

var json2 = require('./components/json');
var BtnGroup = require('./btn-group');
var JSONViewer = require('./json-viewer');
var Textarea = require('./textarea');
var FrameComposer = require('./frame-composer');
var util = require('./util');

var BTNS = getBtns();
var COMPOSER_BTNS = getBtns(true);

function getBtns(composer) {
  var btns = [
    {name: 'TextView'},
    {name: 'JSONView'},
    {name: 'HexView'}
  ];
  if (composer) {
    btns.push({name: 'Composer'});
  }
  return btns;
}

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
    var cId = this.props.cId;
    var btns = cId ? COMPOSER_BTNS : BTNS;
    if (btns.indexOf(btn) === -1) {
      btn = util.findArray(btns, findActive) || btns[0];
      this.selectBtn(btn);
    }
    var reqData = this.props.reqData;
    var data = this.props.data;
    var text, json, bin;
    if (data) {
      text = data.text || '';
      bin = data.bin;
      if (data.json) {
        json = data.json;
      } else if (json = util.resolveJSON(text)) {
        json = data.json = {
          json: json,
          str: (window._$hasBigNumberJson ? json2 : JSON).stringify(json, null, '    ')
        };
      }
    }
    return (
      <div className={'fill orient-vertical-box w-frames-data' + (this.props.hide ? ' hide' : '')}>
        <BtnGroup onClick={this.onClickBtn} btns={btns} />
        <Textarea className="fill" value={text} hide={btn.name !== 'TextView'} />
        <JSONViewer data={json} hide={btn.name !== 'JSONView'} />
        <Textarea className="fill" value={bin} hide={btn.name !== 'HexView'} />
        <FrameComposer closed={reqData && reqData.closed} cId={cId} hide={btn.name !== 'Composer'} />
      </div>
    );
  }
});

module.exports = FrameClient;
