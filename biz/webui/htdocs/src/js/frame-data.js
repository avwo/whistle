var React = require('react');
var BtnGroup = require('./btn-group');
var JSONViewer = require('./json-viewer');
var Textarea = require('./textarea');
var FrameComposer = require('./frame-composer');
var util = require('./util');
var events = require('./events');
var Properties = require('./properties');

var BTNS = [
  {name: 'Overview'},
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
  showTab: function(i) {
    BTNS.forEach(function(btn) {
      btn.active = false;
    });
    this.selectBtn(BTNS[i]);
    this.setState({});
  },
  componentDidMount: function() {
    var self = this;
    events.on('composeFrame', function(e, frame) {
      if (frame) {
        self.showTab(4);
      }
    });
    events.on('showFrameOverview', function() {
      self.showTab(0);
    });
  },
  onDragEnter: function(e) {
    if (e.dataTransfer.types.indexOf('framedataid') != -1) {
      this.showTab(4);
      e.preventDefault();
    }
  },
  onDrop: function(e) {
    var id = e.dataTransfer.getData('frameDataId');
    id && events.trigger('composeFrameId', id);
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
    var frame = this.props.frame;
    var text, json, bin, base64, overview;
    if (frame) {
      if (!frame.closed) {
        var len = frame.length;
        overview = {
          Date: util.toLocaleString(new Date(parseInt(frame.frameId, 10))),
          Path: frame.isClient ? 'Client -> Server' : 'Server -> Client',
          Opcode: frame.opcode,
          Type: frame.opcode == 1 ? 'Text' : 'Binary',
          Compressed: frame.compressed ? 'Yes' : 'No',
          Mask: frame.mask ? 'Yes' : 'No',
          Length: len >= 1024 ? len + '(' + Number(len / 1024).toFixed(2) + 'k)' : (len >= 0 ? len : '')
        };
      } else {
        overview = {
          Date: util.toLocaleString(new Date(parseInt(frame.frameId, 10)))
        };
      }
      text = util.getBody(frame, true);
      bin = util.getHex(frame);
      json = util.getJson(frame, true);
      base64 = frame.base64;
    }
    base64 = base64 || '';
    return (
      <div className={'fill orient-vertical-box w-frames-data' + (this.props.hide ? ' hide' : '')} onDragEnter={this.onDragEnter} onDrop={this.onDrop}>
        <BtnGroup onClick={this.onClickBtn} btns={BTNS} />
        <Properties modal={overview} hide={btn.name !== 'Overview'} />
        <Textarea className="fill" base64={base64} value={text} hide={btn.name !== 'TextView'} />
        <JSONViewer data={json} hide={btn.name !== 'JSONView'} />
        <Textarea className="fill n-monospace" isHexView="1" base64={base64} value={bin} hide={btn.name !== 'HexView'} />
        <FrameComposer data={this.props.data} hide={btn.name !== 'Composer'} />
      </div>
    );
  }
});

module.exports = FrameClient;
