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
  },
  componentDidUpdate: function() {
    ReactDOM.unstable_renderSubtreeIntoContainer(this,
            this.getDialogElement(), this.container[0]);
  },
  getDialogElement: function() {
    var className = this.props.wclassName;
    return (
        <div className={'modal-dialog' + (className ? ' ' + className : '')}>
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
  render: function() {

    return null;
  }
});

module.exports = Dialog;
