var React = require('react');
var dataCenter = require('./data-center');
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

var ActionBtn = React.createClass({
  getInitialState: function() {
    return {};
  },
  onClick: function() {
    var isStop = this.isStop();
    dataCenter.stopRefresh = !dataCenter.stopRefresh;
    this.props.onClick(isStop ? 'refresh' : 'stop');
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
  isStop: function() {
    return dataCenter.stopRefresh || this.stopRefresh;
  },
  render: function() {
    var state = this.state;
    var hide = this.props.hide;
    var isStop = this.isStop();

    return (
      <div onMouseEnter={this.showActionOptions} onMouseLeave={this.hideActionOptions}
        className={'w-menu-wrapper w-refresh-menu-list w-menu-auto'
          + (state.showActionOptions ? ' w-menu-wrapper-show' : '')
          + (hide ? ' hide' : '')}
      >
        <a onClick={this.onClick} href="javascript:;" draggable="false"
          className="w-scroll-menu">
          <span style={{color: isStop ? '#ccc' : '#f66'}} className="glyphicon glyphicon-stop"></span>Record
        </a>
        <MenuItem options={ACTION_OPTIONS} className="w-remove-menu-item" onClickOption={this.onClickOption} />
      </div>
    );
  }
});

module.exports = ActionBtn;
