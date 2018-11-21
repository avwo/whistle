require('./base-css.js');
var $ = require('jquery');
var React = require('react');
var util = require('./util');
var events = require('./events');
var storage = require('./storage');

var Divider = require('./divider');
var ReqData = require('./req-data');
var Detail = require('./detail');

var getWidth = function(vertical) {
  var docElem = document.documentElement;
  if (vertical) {
    return Math.max(Math.floor(docElem.clientHeight / 2), 360);
  }
  return Math.max(Math.floor(docElem.clientWidth / 3), 562);
};

var Network = React.createClass({
  getInitialState: function() {
    var dockToBottom = storage.get('dockToBottom');
    return {
      dockToBottom: dockToBottom,
      rightWidth: getWidth(dockToBottom)
    };
  },
  componentDidMount: function() {
    var self = this;
    events.on('activeItem', function(e, item) {
      if (item && !item.selected) {
        self.props.modal.clearSelection();
        self.props.modal.clearActive();
        item.selected = true;
        item.active = true;
        self.onClick(item);
      }
    });
    $(window).on('keydown', function(e) {
      if (self.props.hide) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.keyCode == 68) {
        if (!util.isFocusEditor() && !$(e.target).closest('.w-frames-list').length) {
          var modal = self.props.modal;
          if (e.shiftKey) {
            if (modal && modal.removeUnselectedItems()) {
              self.setState({});
            }
          } else {
            if (modal && modal.removeSelectedItems()) {
              self.setState({});
            }
          }
        }
      }
    }).on('keydown', function(e) {
      if (e.keyCode === 123) {
        if (!self.props.hide) {
          self.onDockChange();
        }
        e.preventDefault();
      }
    });
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onDockChange: function() {
    var self = this;
    var dockToBottom = !self.state.dockToBottom;
    storage.set('dockToBottom', dockToBottom ? 1 : '');
    self.setState({
      dockToBottom: dockToBottom,
      rightWidth: getWidth(dockToBottom)
    }, function() {
      self.refs.divider.reset();
    });
  },
  onClick: function(item) {
    this.setState({activeItem: item});
  },
  onDoubleClick: function() {
    events.trigger('showOverview');
  },
  render: function() {
    var modal = this.props.modal;
    var dockToBottom = this.state.dockToBottom;
    return (
      <Divider ref="divider" hide={this.props.hide} vertical={dockToBottom} rightWidth={this.state.rightWidth}>
        <ReqData modal={modal} onClick={this.onClick} onDoubleClick={this.onDoubleClick} />
        <Detail dockToBottom={dockToBottom} onDockChange={this.onDockChange} modal={modal} />
      </Divider>
    );
  }
});

module.exports = Network;
