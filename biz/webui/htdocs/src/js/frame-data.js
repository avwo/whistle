var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var BtnGroup = require('./btn-group');
var JSONViewer = require('./json-viewer');
var Textarea = require('./textarea');
var FrameComposer = require('./frame-composer');
var util = require('./util');
var Properties = require('./properties');


function findActive(btn) {
  return btn.active;
}

var FrameClient = React.createClass({
  getInitialState: function () {
    return {
      btns: [
        { name: 'Overview' },
        { name: 'TextView' },
        { name: 'JSONView' },
        { name: 'HexView' },
        { name: 'Composer', icon: 'send' }
      ]
    };
  },
  showTab: function (i) {
    var btns = this.state.btns;
    btns.forEach(function (btn) {
      btn.active = false;
    });
    this.selectBtn(btns[i]);
    this.setState({});
  },
  componentDidMount: function () {
    var self = this;
    var btns = self.state.btns;
    var framesCtx = self.props.framesCtx;
    framesCtx.on('composeFrame', function (e, frame) {
      if (frame) {
        self.showTab(4);
        setTimeout(function() {
          util.shakeElem($(ReactDOM.findDOMNode(self.refs.tabs)).find('button[data-name="Composer"]'));
        },100);
      }
    });
    framesCtx.on('toggleFramesInspectors', function () {
      var btn = self.state.btn;
      btns.forEach(function (b) {
        b.active = false;
      });
      if (!btn || btn === btns[0]) {
        self.onClickBtn(btns[1]);
      } else if (btn === btns[1]) {
        self.onClickBtn(btns[2]);
      } else if (btn === btns[2]) {
        self.onClickBtn(btns[3]);
      } else {
        self.onClickBtn(btns[0]);
      }
    });
  },
  onDragEnter: function (e) {
    if (e.dataTransfer.types.indexOf('framedataid') != -1) {
      this.showTab(4);
      e.preventDefault();
    }
  },
  onDrop: function (e) {
    var id = e.dataTransfer.getData('frameDataId');
    id && this.props.framesCtx.trigger('composeFrameId', id);
  },
  onClickBtn: function (btn) {
    this.selectBtn(btn);
    this.setState({});
  },
  selectBtn: function (btn) {
    btn.active = true;
    this.state.btn = btn;
  },
  render: function () {
    var state = this.state;
    var btns = this.state.btns;
    var btn = state.btn;
    if (btns.indexOf(btn) === -1) {
      btn = util.findArray(btns, findActive) || btns[0];
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
          Length: len >= 0 ? util.formatSize(len, frame.unzipLen) : ''
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
      <div
        className={
          'fill v-box w-frames-data' +
          (this.props.hide ? ' hide' : '')
        }
        onDragEnter={this.onDragEnter}
        onDrop={this.onDrop}
      >
        <BtnGroup ref="tabs" onClick={this.onClickBtn} btns={state.btns} />
        <Properties modal={overview} hide={btn.name !== 'Overview'} />
        <Textarea
          className="fill"
          base64={base64}
          value={text}
          hide={btn.name !== 'TextView'}
        />
        <JSONViewer data={json} hide={btn.name !== 'JSONView'} />
        <Textarea
          className="fill n-monospace"
          isHexView="1"
          base64={base64}
          value={bin}
          hide={btn.name !== 'HexView'}
        />
        <FrameComposer framesCtx={this.props.framesCtx} data={this.props.data} hide={btn.name !== 'Composer'} />
      </div>
    );
  }
});

module.exports = FrameClient;
