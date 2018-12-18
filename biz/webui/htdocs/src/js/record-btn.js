var React = require('react');
var MenuItem = require('./menu-item');

var ACTION_OPTIONS = [
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
    this.props.onClick(stop ? 'stop' : 'refresh');
    this.setState({ stop: stop });
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
    this.props.onClick(option.id);
    this.hideActionOptions();
  },
  render: function() {
    var state = this.state;
    var hide = this.props.hide;

    return (
      <div onMouseEnter={this.showActionOptions} onMouseLeave={this.hideActionOptions}
        className={'w-menu-wrapper w-refresh-menu-list w-menu-auto'
          + (state.showActionOptions ? ' w-menu-wrapper-show' : '')
          + (hide ? ' hide' : '')}
      >
        <a onClick={this.onClick} href="javascript:;" draggable="false"
          className="w-scroll-menu">
          <span style={{color: state.stop ? '#ccc' : '#f66'}} className="glyphicon glyphicon-stop"></span>Record
        </a>
        <MenuItem options={ACTION_OPTIONS} className="w-remove-menu-item" onClickOption={this.onClickOption} />
      </div>
    );
  }
});

module.exports = RecordBtn;
