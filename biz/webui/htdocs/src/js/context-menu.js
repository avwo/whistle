require('./base-css.js');
require('../css/context-menu.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');

var ContextMenu = React.createClass({
  getInitialState: function() {
    return {};
  },
  componentDidMount: function() {
    var self = this;
    self.container = document.createElement('div');
    document.body.appendChild(self.container);
    self.componentDidUpdate();
    $(document).on('mousedown click', function(e) {
      if ($(e.target).closest('.w-context-menu').length) {
        e.preventDefault();
        return;
      }
      self.hide();
    }).on('keydown', function(e) {
      if (e.keyCode === 9) {
        self.hide();
      }
    });
    $(window).on('resize blur', function() {
      self.hide();
    });
  },
  componentDidUpdate: function() {
    ReactDOM.unstable_renderSubtreeIntoContainer(this,
            this.getDialogElement(), this.container);
  },
  preventDefault: function(e) {
    e.preventDefault();
  },
  isVisible: function() {
    return this.state.visible;
  },
  onClick: function(e) {
    var target = $(e.target).closest('li');
    if (target.hasClass('w-ctx-sub-menu-list') || target.hasClass('w-ctx-item-disabled')) {
      return;
    }
    this.hide();
    if (this.props.onClick) {
      this.props.onClick(target.attr('data-menu-action'), e, target.attr('data-parent-action'), target.attr('data-name'));
    }
  },
  getDialogElement: function() {
    var data = this.state;
    var list = data.list || [];
    return (
        <div
          onClick={this.onClick}
          className={'w-context-menu ' + (data.className || '')}
          onContextMenu={this.preventDefault}
          style={{left: data.left, top: data.top, display: data.visible ? '' : 'none'}}
        >
        <ul className="w-ctx-menu-list">
          {list.map(function(item) {
            var subList = item.list;
            return (
              <li data-menu-action={item.action || item.name} key={item.name} className={'w-ctx-menu-item ' + (item.sep ? 'w-ctx-item-sep' : '')
                + (item.disabled ? ' w-ctx-item-disabled' : '') + (subList ? ' w-ctx-sub-menu-list' : '')
                + (item.copyText ? ' w-copy-text' : '')}
                data-clipboard-text={item.copyText}
                style={{display: item.hide ? 'none' : undefined}}
                onClick={item.onClick}
              >
                <p className="w-ctx-item-tt">{item.name}</p>
                {subList ? <span className="glyphicon glyphicon-play"></span> : undefined}
                {subList ? <div className="w-ctx-menu-gap"></div> : undefined}
                {
                  subList ? (
                    <ul className="w-ctx-menu-list" style={item.top > 0 ? { top: -item.top * 30 - 1, maxHeight: item.maxHeight } : undefined}>
                      {subList.map(function(subItem, i) {
                        return (
                          <li title={subItem.title} data-parent-action={item.action} data-name={subItem.name}
                            data-menu-action={subItem.action || subItem.name} key={i} onClick={subItem.onClick}
                            className={'w-ctx-menu-item ' + (subItem.sep ? 'w-ctx-item-sep' : '')
                            + (subItem.disabled ? ' w-ctx-item-disabled' : '')
                            + (subItem.copyText ? ' w-copy-text' : '')}
                            data-clipboard-text={subItem.copyText}
                          >
                            <p className="w-ctx-item-tt">{subItem.name}</p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : undefined
                }
              </li>
            );
          })}
        </ul>
    </div>
    );
  },
  show: function(data) {
    data.visible = true;
    this.setState(data);
  },
  hide: function() {
    this.setState({ visible: false });
  },
  render: function() {

    return null;
  }
});

ContextMenu.util = util;
ContextMenu.$ = $;

module.exports = ContextMenu;
