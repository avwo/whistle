require('../css/context-menu.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var Icon = require('./icon');

var preventBlur = util.preventBlur;
var getHideStyle = util.getHideStyle;

var ContextMenu = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    var self = this;
    self.container = document.createElement('div');
    document.body.appendChild(self.container);
    self.componentDidUpdate();
    $(document)
      .on('mousedown click', function (e) {
        if ($(e.target).closest('.w-ctx-menu').length) {
          if (e.target.nodeName !== 'INPUT') {
            preventBlur(e);
          }
          return;
        }
        self.hide();
      })
      .on('keydown', function (e) {
        if (e.keyCode === 9) {
          self.hide();
        }
      });
    $(window).on('resize blur', function () {
      self.hide();
    });
  },
  componentDidUpdate: function () {
    ReactDOM.unstable_renderSubtreeIntoContainer(
      this,
      this.getDialogElement(),
      this.container
    );
  },
  isVisible: function () {
    return this.state.visible;
  },
  onClick: function (e) {
    var target = $(e.target).closest('li');
    preventBlur(e);
    if (
      target.hasClass('w-ctx-sub-list') ||
      target.hasClass('w-ctx-item-disabled')
    ) {
      return;
    }
    var self = this;
    var data = self.state;
    !target.hasClass('w-ctx-item-multi') && !data.radio && self.hide();
    var action = target.attr('data-menu-action');
    var onClick = self.props.onClick;
    if (onClick) {
      onClick(
        action,
        e,
        target.attr('data-parent-action'),
        target.attr('data-name')
      );
    }
    if ((e.shiftKey || e.ctrlKey || e.metaKey) && target.attr('data-shift-to-edit')) {
      util.trigger('showCopyEditor', target.attr('data-clipboard-text'));
    }
    if (data.radio) {
      data.list.forEach(function (item) {
        item.selected = item.action == action;
      });
      self.setState({});
    }
  },
  getDialogElement: function () {
    var self = this;
    var data = self.state;
    var list = data.list || [];
    var radio = data.radio;
    return (
      <div
        onClick={self.onClick}
        className={'w-ctx-menu ' + (data.className || '')}
        onContextMenu={self.onClick}
        style={{
          left: data.left,
          top: data.top,
          display: data.visible ? '' : 'none'
        }}
      >
        <ul className="w-ctx-list">
          {list.map(function (item) {
            var subList = item.list;
            var multiple = !subList && item.multiple;
            return (
              <li
                data-menu-action={item.action || item.name}
                key={item.name}
                className={
                  'w-ctx-item ' +
                  (item.sep ? 'w-ctx-item-sep' : '') +
                  (item.disabled ? ' w-ctx-item-disabled' : '') +
                  (subList ? ' w-ctx-sub-list' : '') +
                  (item.copyText ? ' w-copy-text' : '')
                }
                data-clipboard-text={item.copyText}
                style={getHideStyle(item.hide)}
                onClick={item.onClick}
              >
                <label className={'w-ctx-item-tt' + (item.selected ? ' w-ctx-selected' : '')}>
                  {radio ? <span className={'w-ctx-checked' + (item.selected ? ' visible' : '')}>✔️</span> : null}
                  {item.icon ? <Icon name={item.icon} /> : null}
                  {multiple ? (
                    <input type="checkbox" checked={item.checked} />
                  ) : null}
                  {item.name}
                </label>
                {subList ? <Icon name="play" /> : null}
                {subList ? <div className="w-ctx-gap"></div> : null}
                {subList ? (
                  <ul
                    className="w-ctx-list"
                    style={
                      item.top > 0
                        ? { top: -item.top * 30 - 1, maxHeight: item.maxHeight }
                        : null
                    }
                  >
                    {subList.map(function (subItem, i) {
                      var name = subItem.name;
                      return (
                        <li
                          title={subItem.title}
                          data-parent-action={item.action}
                          data-name={name}
                          data-menu-action={subItem.action || name}
                          key={i}
                          onClick={subItem.onClick}
                          className={
                            'w-ctx-item ' +
                            (subItem.sep ? 'w-ctx-item-sep' : '') +
                            (subItem.disabled ? ' w-ctx-item-disabled' : '') +
                            (subItem.copyText ? ' w-copy-text' : '')
                          }
                          style={getHideStyle(subItem.hide)}
                          data-clipboard-text={subItem.copyText}
                          data-shift-to-edit={item.shiftToEdit ? 1 : null}
                        >
                          <label className="w-ctx-item-tt">
                            {subItem.multiple ? (
                              <input
                                type="checkbox"
                                checked={subItem.checked}
                              />
                            ) : null}
                            {name}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
  show: function (data) {
    data.visible = true;
    this.setState(data);
  },
  hide: function () {
    this.setState({ visible: false });
  },
  update: function () {
    this.state.visible && this.setState({});
  },
  render: function () {
    return null;
  }
});

ContextMenu.util = util;
ContextMenu.$ = $;

module.exports = ContextMenu;
