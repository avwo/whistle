var React = require('react');
var MenuItem = require('./menu-item');
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
  getInitialState: function() {
    return { stop: false };
  },
  onClick: function() {
    var stop = !this.state.stop;
    this.state.pause = false;
    this.state.stop = stop;
    ACTION_OPTIONS[0] = PAUSE_OPTION;
    this.props.onClick(stop ? 'stop' : 'refresh');
    this.setState({});
  },
  enable: function(flag) {
    var stop = flag === false;
    if (stop === this.state.stop) {
      return;
    }
    this.state.stop = stop;
    this.setState({});
  },
  showActionOptions: function() {
    this.setState({
      showActionOptions: true
    });
  },
  hideActionOptions: function() {
    this.setState({
      showActionOptions: false
    });
  },
  onClickOption: function(option) {
    if (option.id === 'pause') {
      ACTION_OPTIONS[0] = STOP_OPTION;
      this.state.pause = true;
      this.state.stop = true;
    } else if (option.id === 'stop') {
      ACTION_OPTIONS[0] = PAUSE_OPTION;
      this.state.pause = false;
      this.state.stop = true;
    }
    this.props.onClick(option.id);
    this.hideActionOptions();
  },
  render: function() {
    var state = this.state;
    var hide = this.props.hide;
    var pause = state.pause;
    var stop = state.stop;
    var title = 'Click to ' + ((stop || pause) ? 'start' : 'stop') + ' record';

    return (
      <div onMouseEnter={this.showActionOptions} onMouseLeave={this.hideActionOptions}
        className={'w-menu-wrapper w-refresh-menu-list w-menu-auto'
          + (state.showActionOptions ? ' w-menu-wrapper-show' : '')
          + (hide ? ' hide' : '')}
      >
        <a onClick={this.onClick} draggable="false"
          className={'w-scroll-menu' + (this.props.disabledRecord ? ' w-disabled' : '')}
          title={title}
        >
          <span style={{color: (!pause && stop) ? '#ccc' : '#f66'}}
            className={'glyphicon glyphicon-' + (pause ? 'minus-sign' : 'stop')}></span>Record
        </a>
        <MenuItem options={ACTION_OPTIONS} className="w-remove-menu-item" onClickOption={this.onClickOption} />
      </div>
    );
  }
});

module.exports = RecordBtn;
