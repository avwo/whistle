var $ = window.jQuery = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var Dialog = React.createClass({
  getInitialState: function() {
    return {};
  },
  componentDidMount: function() {
    this.container = $(document.createElement('div'));
    this.container.addClass('modal fade' + (this.props.wstyle ? ' ' + this.props.wstyle : ''));
    document.body.appendChild(this.container[0]);
    this.componentDidUpdate();
    if (typeof this.props.customRef === 'function') {
      this.props.customRef(this);
    }
    if (typeof this.props.onClose === 'function') {
      this.container.on('hidden.bs.modal', this.props.onClose);
    }
  },
  componentDidUpdate: function() {
    ReactDOM.unstable_renderSubtreeIntoContainer(this,
            this.getDialogElement(), this.container[0]);
  },
  getDialogElement: function() {
    var props = this.props;
    var className = props.wclassName;
    var style;
    if (props.width > 0) {
      style = style || {};
      style.width = props.width;
    }
    return (
        <div style={style} className={'modal-dialog' + (className ? ' ' + className : '')}>
            <div className="modal-content">
              {this.props.children}
            </div>
        </div>
    );
  },
  componentWillUnmount: function() {
    ReactDOM.unmountComponentAtNode(this.container[0]);
    document.body.removeChild(this.container[0]);
  },
  show: function() {
    if (this.isVisible()) {
      return;
    }
    this.container.modal(this.props.disableBackdrop ? {
      show: true,
      backdrop: false
    } : 'show');
  },
  isVisible: function() {
    return this.container.is(':visible');
  },
  hide: function() {
    this.container.modal('hide');
  },
  destroy: function() {
    this.hide();
    this.container && this.componentWillUnmount();
  },
  render: function() {

    return null;
  }
});

module.exports = Dialog;
