var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var win = require('./win');
var message = require('./message');
var dataCenter = require('./data-center');
var util = require('./util');

var trigger = util.trigger;
var preventBlur = function (e) {
  e.target.nodeName != 'INPUT' && e.preventDefault();
};

module.exports = {
  showNameInput: function (e) {
    var self = this;
    var state = self.state;
    state.showDownloadInput = /w-download/.test(e.target.className);
    state.showNameInput = true;
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
    var self = this;
    self.state.showNameInput = false;
    self.forceUpdate(function () {
      var nameInput = findDOMNode(self.refs.nameInput);
      var defaultName = self.props.defaultName;
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
    var self = this;
    var target = findDOMNode(self.refs.nameInput);
    var name = target.value.trim();
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
    trigger('showEditorDialog', { text: this.getText(), session: this.props.session });
  },
  createRule: function () {
    trigger('showAddRulesDialog', { session: this.props.session });
  },
  renderInput: function () {
    var self = this;
    var state = self.state;
    var showInput = state.showDownloadInput;

    return (
      <div
        onMouseDown={preventBlur}
        style={util.getHideStyle(!state.showNameInput)}
        className="w-shadow w-textarea-input"
      >
        <input
          ref="nameInput"
          onKeyDown={self.submit}
          onBlur={self.hideNameInput}
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
          onClick={self.submit}
          className="btn btn-primary"
        >
          {showInput ? 'Download' : '+Key'}
        </button>
        {showInput ? null : <button
          type="button"
          onClick={self.createTempFile}
          className="btn btn-default"
        >+File</button>}
        {showInput ? null : <button
          type="button"
          onClick={self.createRule}
          className="btn btn-default"
        >+Rule</button>}
      </div>
    );
  }
};
