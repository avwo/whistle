require('./base-css.js');
var $ = require('jquery');
var React = require('react');
var util = require('./util');
var events = require('./events');

var Divider = require('./divider');
var ReqData = require('./req-data');
var Detail = require('./detail');

var Network = React.createClass({
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
    });
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onClick: function(item) {
    this.setState({activeItem: item});
  },
  onDoubleClick: function() {
    events.trigger('showOverview');
  },
  render: function() {
    var modal = this.props.modal;

    return (
      <Divider hide={this.props.hide} rightWidth="560">
        <ReqData modal={modal} onClick={this.onClick} onDoubleClick={this.onDoubleClick} />
        <Detail modal={modal} />
      </Divider>
    );
  }
});

module.exports = Network;
