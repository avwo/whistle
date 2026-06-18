var $ = (window.jQuery = require('jquery'));
var React = require('react');
var ReactDOM = require('react-dom');

var Dialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    var self = this;
    self.container = $(document.createElement('div'));
    var clazz = self.props.fullCustom ? ' w-custom-dialog' : '';
    self.container.addClass(
      'modal fade' + clazz + (self.props.wstyle ? ' ' + self.props.wstyle : '')
    );
    document.body.appendChild(self.container[0]);
    self.componentDidUpdate();
    if (typeof self.props.customRef === 'function') {
      self.props.customRef(self);
    }
    if (typeof self.props.onClose === 'function') {
      self.container.on('hidden.bs.modal', self.props.onClose);
    }
    self.container.on('hide.bs.modal', function() {
      self._isVisible = false;
      self.onVisibleChange();
    });
    self.container.on('show.bs.modal', function() {
      self._isVisible = true;
      self.onVisibleChange();
    });
    if (typeof self.props.onShow === 'function') {
      self.container.on('shown.bs.modal', function() {
        self.props.onShow(self);
      });
    }
  },
  componentDidUpdate: function () {
    var self = this;
    ReactDOM.unstable_renderSubtreeIntoContainer(
      self,
      self.getDialogElement(),
      self.container[0]
    );
  },
  getDialogElement: function () {
    var props = this.props;
    var className = props.wclassName;
    var style;
    if (props.width) {
      style = style || {};
      style.width = props.width;
    }
    if (props.fullCustom && props.height) {
      style = style || {};
      style.height = props.height;
    }
    return (
      <div
        style={style}
        className={'modal-dialog' + (className ? ' ' + className : '')}
      >
        <div className="modal-content">{this.props.children}</div>
      </div>
    );
  },
  componentWillUnmount: function () {
    ReactDOM.unmountComponentAtNode(this.container[0]);
    document.body.removeChild(this.container[0]);
  },
  show: function () {
    var self = this;
    if (self.container.hasClass('in')) {
      return;
    }
    self._isVisible = true;
    self.onVisibleChange();
    self.container.modal(
      self.props.disableBackdrop
        ? {
          show: true,
          backdrop: false
        }
        : 'show'
    );
  },
  onVisibleChange: function () {
    var onVisibleChange = this.props.onVisibleChange;
    if (typeof onVisibleChange === 'function') {
      onVisibleChange(this._isVisible);
    }
  },
  isVisible: function () {
    return this._isVisible;
  },
  hide: function () {
    this.container.modal('hide');
  },
  destroy: function () {
    this.hide();
    this.container && this.componentWillUnmount();
  },
  render: function () {
    return null;
  }
});

module.exports = Dialog;
