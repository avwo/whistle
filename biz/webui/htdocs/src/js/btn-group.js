require('../css/btn-group.css');
var React = require('react');
var util = require('./util');
var Icon = require('./icon');

var BtnGroup = React.createClass({
  handleClick: function (btn) {
    if (btn.active || btn.disabled) {
      return;
    }
    var self = this;
    self.clearSelection();
    btn.active = true;
    if (!self.props.onClick || self.props.onClick(btn)) {
      self.setState({
        curBtn: btn
      });
    }
  },
  clearSelection: function() {
    var list = this.props.tabs || this.props.btns;
    list.forEach(function (btn) {
      btn.active = false;
    });
  },
  onDoubleClick: function (e) {
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(e);
    }
    e.stopPropagation();
  },
  render: function () {
    var self = this;
    var props = self.props;
    var tabs = props.tabs;
    var isSmall = props.type === 's';
    var list = tabs || props.btns;
    var disabled = util.getBool(props.disabled);

    return (
      <div
        onDoubleClick={props.onDoubleClickBar}
        className={
          'btn-group btn-group-sm ' +
          (tabs ? 'w-tabs-sm' : 'w-btn-group-sm') +
          (isSmall ? ' small' : '')
        }
      >
        {list.map(function (btn) {
          btn.disabled = disabled;
          var icon = btn.icon ? <Icon name={btn.icon} /> : '';
          var clazz = btn.className ? ' ' + btn.className : '';
          btn.key = btn.key || util.getKey();

          return (
            <button
              onClick={function () {
                self.handleClick(btn);
              }}
              onDoubleClick={self.onDoubleClick}
              key={btn.key}
              type="button"
              data-name={btn.name}
              style={util.getHideStyle(btn.hide)}
              title={btn.title}
              className={
                'btn btn-default' +
                (btn.active && !disabled ? ' active' : '') +
                clazz
              }
            >
              {icon}
              {btn.display || btn.name}
            </button>
          );
        })}
        {props.appendTabs || props.appendBtns}
        {props.dockBtn}
      </div>
    );
  }
});

module.exports = BtnGroup;
