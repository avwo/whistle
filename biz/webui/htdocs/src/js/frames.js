require('../css/frames.css');
var React = require('react');
var util = require('./util');

var Divider = require('./divider');
var FrameList = require('./frame-list');
var FrameData = require('./frame-data');
var FrameModal = require('./frame-modal');
var dataCenter = require('./data-center');

var Frames = React.createClass({
  getInitialState: function() {
    return {
      modal: new FrameModal()
    };
  },
  componentDidMount: function() {
    var self = this;
    dataCenter.on('framesUpdate', function() {
      self.setState({});
    });
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onClickFrame: function(frame) {
    var modal = this.state.modal;
    modal.setActive(frame);
    this.setState({});
  },
  onUpdate: function() {
    this.setState({});
  },
  onDOMReady: function() {
    this.refs.frameList.autoRefresh();
  },
  render: function() {
    var props = this.props;
    var modal = this.state.modal;
    var frames = modal.reset(props.frames);
    var reqData = props.data || '';
    var curFrame = modal.getActive();
    if (curFrame && curFrame.hide) {
      curFrame = null;
    }
    return (
      <div className={'fill orient-vertical-box w-frames' + ((frames && !props.hide) ? '' : ' hide')}>
        <Divider vertical="true" rightWidth="250" onDOMReady={this.onDOMReady}>
          <FrameList ref="frameList" reqData={reqData} modal={modal}
            onUpdate={this.onUpdate} onClickFrame={this.onClickFrame} />
          <FrameData data={reqData} frame={curFrame} />
        </Divider>
      </div>
    );
  }
});

module.exports = Frames;
