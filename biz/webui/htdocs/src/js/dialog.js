var $ = (window.jQuery = require('jquery'));
var React = require('react');
var ReactDOM = require('react-dom');
var isFunc = require('./util').isFunc;

var Dialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    var self = this;
    var props = self.props;
    var container = $(document.createElement('div'));
    self.container = container;
    var clazz = props.fullCustom ? ' w-custom-dialog' : '';
    var wstyle = props.wstyle;
    container.addClass('modal fade' + clazz + (wstyle ? ' ' + wstyle : ''));
    document.body.appendChild(container[0]);
    self.componentDidUpdate();
    if (isFunc(props.customRef)) {
      props.customRef(self);
    }
    if (isFunc(props.onClose)) {
      container.on('hidden.bs.modal', props.onClose);
    }
    container.on('hide.bs.modal', function() {
      self._isVisible = false;
      self.onVisibleChange();
    }).on('show.bs.modal', function() {
      self._isVisible = true;
      self.onVisibleChange();
    });
    if (isFunc(props.onShow)) {
      container.on('shown.bs.modal', function() {
        props.onShow(self);
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
        className={'modal-dialog ' + (className || '')}
      >
        <div className="modal-content">{props.children}</div>
      </div>
    );
  },
  componentWillUnmount: function () {
    var container = this.container[0];
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
  },
  show: function () {
    var self = this;
    var container = self.container;
    if (container.hasClass('in')) {
      return;
    }
    self._isVisible = true;
    self.onVisibleChange();
    container.modal(
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
    if (isFunc(onVisibleChange)) {
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
