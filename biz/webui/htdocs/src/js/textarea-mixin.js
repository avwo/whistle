var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var win = require('./win');
var message = require('./message');
var dataCenter = require('./data-center');
var util = require('./util');
var events = require('./events');

module.exports = {
  preventBlur: function (e) {
    e.target.nodeName != 'INPUT' && e.preventDefault();
  },
  showNameInput: function (e) {
    var self = this;
    self.state.showDownloadInput = /w-download/.test(e.target.className);
    self.state.showNameInput = true;
    self.forceUpdate(function () {
      var nameInput = findDOMNode(self.refs.nameInput);
      var defaultName = !nameInput.value && self.props.defaultName;
      if (defaultName) {
        nameInput.value = defaultName;
      }
      nameInput.select();
      nameInput.focus();
    });
  },
  hideNameInput: function () {
    this.state.showNameInput = false;
    this.forceUpdate(function () {
      var nameInput = findDOMNode(this.refs.nameInput);
      var defaultName = this.props.defaultName;
      if (defaultName === nameInput.value) {
        nameInput.value = '';
      }
    });
  },
  submit: function (e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var modal = dataCenter.valuesModal;
    if (!modal) {
      return;
    }
    var target = findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    var self = this;
    if (self.state.showDownloadInput) {
      self.download();
      return;
    }
    if (!name) {
      message.error('The key is required');
      return;
    }

    if (/\s/.test(name)) {
      message.error('Spaces are not allowed in the key');
      return;
    }
    var handleSubmit = function (sure) {
      if (!sure) {
        return;
      }
      var value = self.getText();
      dataCenter.values.add({ name: name, value: value }, function (data, xhr) {
        if (data && data.ec === 0) {
          modal.add(name, value);
          target.value = '';
          target.blur();
        } else {
          util.showSysErr(xhr);
        }
      });
    };
    if (!modal.exists(name)) {
      return handleSubmit(true);
    }
    win.confirm(
        'The key \'' + name + '\' is already in use. Overwrite?',
        handleSubmit
      );
  },
  renderAddBtn: function () {
    return dataCenter.hideRulesEditor ? null : <a className="w-add" onClick={this.showNameInput} draggable="false">+Rule</a>;
  },
  createTempFile: function () {
    events.trigger('showEditorDialog', { text: this.getText(), session: this.props.session });
  },
  createRule: function () {
    events.trigger('showAddRulesDialog', { session: this.props.session });
  },
  renderInput: function () {
    var state = this.state;
    var showInput = state.showDownloadInput;

    return (
      <div
        onMouseDown={this.preventBlur}
        style={{ display: state.showNameInput ? 'block' : 'none' }}
        className="w-shadow w-textarea-input"
      >
        <input
          ref="nameInput"
          onKeyDown={this.submit}
          onBlur={this.hideNameInput}
          type="text"
          maxLength="64"
          placeholder={
            showInput
              ? 'Enter filename'
              : 'Enter key name'
          }
        />
        <button
          type="button"
          onClick={this.submit}
          className="btn btn-primary"
        >
          {showInput ? 'OK' : '+Key'}
        </button>
        {showInput ? null : <button
          type="button"
          onClick={this.createTempFile}
          className="btn btn-default"
        >+File</button>}
        {showInput ? null : <button
          type="button"
          onClick={this.createRule}
          className="btn btn-default"
        >+Rule</button>}
      </div>
    );
  }
};
