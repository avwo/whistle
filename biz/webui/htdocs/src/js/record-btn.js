var events = require('./events');

var React = require('react');
var MenuItem = require('./menu-item');
var Icon = require('./icon');
require('../css/record-btn.css');


var PAUSE_OPTION = {
  name: 'Pause Record',
  icon: 'minus-sign',
  id: 'pause'
};
var STOP_OPTION = {
  name: 'Stop Record',
  icon: 'stop',
  id: 'stop'
};
var ACTION_OPTIONS = [
  PAUSE_OPTION,
  {
    name: 'Scroll To Top',
    icon: 'arrow-up',
    id: 'top'
  },
  {
    name: 'Scroll To Bottom',
    icon: 'arrow-down',
    id: 'bottom'
  }
];

var RecordBtn = React.createClass({
  getInitialState: function () {
    return { stop: false };
  },
  onClick: function () {
    var self = this;
    var state = self.state;
    var stop = !state.stop;
    state.pause = false;
    state.stop = stop;
    ACTION_OPTIONS[0] = PAUSE_OPTION;
    self.props.onClick(stop ? 'stop' : 'refresh');
    self.setState({});
  },
  componentDidMount: function () {
    events.on('toggleNetworkState', this.onClick);
  },
  enable: function (flag) {
    var state = this.state;
    var pause = state.pause;
    var stop = state.stop;
    if (flag === 'stop') {
      if (stop && !pause) {
        return;
      }
    } else if (flag === 'pause') {
      if (pause) {
        return;
      }
    } else {
      if (stop || pause) {
        this.onClick();
      }
      return;
    }

    this.onClickOption({ id: flag });
  },
  showActionOptions: function () {
    this.setState({
      showActionOptions: true
    });
  },
  hideActionOptions: function () {
    this.setState({
      showActionOptions: false
    });
  },
  onClickOption: function (option) {
    var self = this;
    var state = self.state;
    if (option.id === 'pause') {
      ACTION_OPTIONS[0] = STOP_OPTION;
      state.pause = true;
      state.stop = true;
    } else if (option.id === 'stop') {
      ACTION_OPTIONS[0] = PAUSE_OPTION;
      state.pause = false;
      state.stop = true;
    }
    self.props.onClick(option.id);
    self.hideActionOptions();
  },
  render: function () {
    var self = this;
    var state = self.state;
    var hide = self.props.hide;
    var pause = state.pause;
    var stop = state.stop;
    var disabled = stop || pause;
    var title = 'Click to ' + (disabled ? 'start' : 'stop') + ' record';

    return (
      <div
        onMouseEnter={self.showActionOptions}
        onMouseLeave={self.hideActionOptions}
        className={
          'w-menu-wrapper w-switch-btn w-menu-auto' +
          (state.showActionOptions ? ' w-menu-wrapper-show' : '') +
          (hide ? ' hide' : '')
        }
      >
        <a
          onClick={self.onClick}
          draggable="false"
          className={'w-scroll-menu' + (disabled ? ' w-pause' : '') + (self.props.disabledRecord ? ' w-disabled' : '')}
          title={title}
        >
          <Icon name={pause ? 'minus-sign' : 'stop'} />
          Record
        </a>
        <MenuItem
          options={ACTION_OPTIONS}
          className="w-remove-menu-item"
          onClickOption={self.onClickOption}
        />
      </div>
    );
  }
});

module.exports = RecordBtn;
