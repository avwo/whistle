require('./base-css.js');
require('../css/add-rule.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var protocolGroups = require('./protocols').groups;
var util = require('./util');
var Editor = require('./editor');

var CREATE_OPTION = {
  value: '',
  text: '+Create'
};

var _createOptions = function(list) {
  return list.map(function(item) {
    var value = item;
    var text = item;
    if (item && typeof item === 'object') {
      value = item.value == null ? item.text : item.value;
      text = item.text;
    }
    return (
      <option value={value}>{text}</option>
    );
  });
};

var createOptions = function(list) {
  if (Array.isArray(list)) {
    return _createOptions(list);
  }
  return Object.keys(list).map(function(label) {
    return (
      <optgroup label={label}>
        {_createOptions(list[label])}
      </optgroup>
    );
  });
};

var AddRuleDialog = React.createClass({
  getInitialState: function() {
    return {
      protocol: 'host://',
      ruleName: 'Default'
    };
  },
  show: function() {
    this.refs.addRuleDialog.show();
    this.setState({});
  },
  hide: function() {
    this.refs.addRuleDialog.hide();
    this.refs.preview.hide();
  },
  setData: function(data) {
    var input = ReactDOM.findDOMNode(this.refs.pattern);
    if (data) {
      input.value = util.removeProtocol(data.url.replace(/[?#].*$/, ''));
    }
    setTimeout(function() {
      input.select();
      input.focus();
    }, 500);
  },
  shouldComponentUpdate: function() {
    return !this.refs.addRuleDialog || this.refs.addRuleDialog.isVisible();
  },
  onProtocolChange: function(e) {
    var protocol = e.target.value;
    if (protocol === '+Custom') {
      window.open('https://avwo.github.io/whistle/plugins.html');
      this.setState({});
    } else {
      this.setState({ protocol: protocol });
    }
    ReactDOM.findDOMNode(this.refs.ruleValue).focus();
  },
  onRuleNameChange: function(e) {
    var ruleName = e.target.value;
    if (ruleName) {
      return this.setState({ ruleName: ruleName });
    }
    while(!ruleName) {
      ruleName = window.prompt('Please input the new Rule name:');
      ruleName = ruleName && ruleName.trim();
      if (!ruleName) {
        return;
      }
      
    }
    return this.setState({ ruleName: ruleName });
  },
  preview: function() {
    this.refs.preview.show();
  },
  render: function() {
    var rulesModal = this.props.rulesModal;
    if (!rulesModal) {
      return null;
    }
    var state = this.state;
    var ruleName = state.ruleName;
    var rulesList = rulesModal.list.slice();
    rulesList.push(CREATE_OPTION);

    return (
      <Dialog ref="addRuleDialog" wstyle="w-add-rule-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div>
            <label>
              <span className="glyphicon glyphicon-question-sign" />
              Pattern:
            </label>
            <input ref="pattern" className="w-add-rule-pattern"
              maxLength="1024" placeholder="Input the pattern to match request URL" />
          </div>
          <div>
            <label>
              <span className="glyphicon glyphicon-question-sign" />
              Operation:
            </label>
            <select className="w-add-rule-protocols" value={state.protocol}
              onChange={this.onProtocolChange}>
              {createOptions(protocolGroups)}
            </select><textarea maxLength="3072" ref="ruleValue"
              placeholder={'Input the operation value (<= 3k), such as:\n'} />
          </div>
          <div>
            <label>
              <span className="glyphicon glyphicon-question-sign" />
              Filter:
            </label>
            <textarea maxLength="256" placeholder="Filter" className="w-add-rule-filter" />
          </div>
          <div>
            <label>
              <span className="glyphicon glyphicon-question-sign" />
              Save in:
            </label>
            <select style={{verticalAlign: 'middle'}} value={ruleName}
              onChange={this.onRuleNameChange}>
            {createOptions(rulesList)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-info" onClick={this.preview}>Preview</button>
          <button type="button" className="btn btn-primary" data-dismiss="modal">Confirm</button>
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
        <Dialog ref="preview" wstyle="w-add-rule-preview">
          <div className="modal-body">
            <button type="button" className="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
            <h5 className="w-add-preview-title">
              Save in
              <select className="w-add-rule-preview-name" value={ruleName}
                onChange={this.onRuleNameChange}>
              {createOptions(rulesList)}
              </select>:
            </h5>
            <Editor {...rulesModal.editorTheme} mode="rules" name={ruleName} value={'activeItem.value'} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" data-dismiss="modal">Confirm</button>
            <button type="button" className="btn btn-default" data-dismiss="modal">Back</button>
          </div>
        </Dialog>
      </Dialog>
    );
  }
});

module.exports = AddRuleDialog;
