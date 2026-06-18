require('../css/frames.css');
var React = require('react');
var util = require('./util');
var Divider = require('./divider');
var FrameList = require('./frame-list');
var FrameData = require('./frame-data');
var FrameModal = require('./frame-modal');
var dataCenter = require('./data-center');
var LazyInit = require('./lazy-init');
var $ = require('jquery');

var Frames = React.createClass({
  getInitialState: function () {
    return {
      modal: new FrameModal(),
      framesCtx: $({})
    };
  },
  componentDidMount: function () {
    var self = this;
    dataCenter.on('framesUpdate', function () {
      self.setState({});
    });
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
  onClickFrame: function (frame) {
    var modal = this.state.modal;
    modal.setActive(frame);
    this.setState({});
  },
  onUpdate: function () {
    this.setState({});
  },
  onDOMReady: function () {
    this.refs.frameList.autoRefresh();
  },
  render: function () {
    var self = this;
    var props = self.props;
    var state = self.state;
    var modal = state.modal;
    var framesCtx = state.framesCtx;
    var frames = modal.reset(props.frames);
    var reqData = props.data || '';
    var curFrame = modal.getActive();
    var hide = !frames || props.hide;
    if (curFrame && curFrame.hide) {
      curFrame = null;
    }
    return (
      <div
        className={
          'fill v-box w-frames' + (props.hide ? ' hide' : '')
        }
      >
        <LazyInit inited={!hide}>
          <Divider
            hide={hide}
            vertical="true"
            rightWidth="250"
            onDOMReady={self.onDOMReady}
          >
            <FrameList
              ref="frameList"
              framesCtx={framesCtx}
              reqData={reqData}
              modal={modal}
              onUpdate={self.onUpdate}
              onClickFrame={self.onClickFrame}
            />
            <FrameData framesCtx={framesCtx} data={reqData} frame={curFrame} />
          </Divider>
        </LazyInit>
        <div className={'w-no-frames' + (frames ? ' hide' : '')}>No Frames</div>
      </div>
    );
  }
});

module.exports = Frames;
