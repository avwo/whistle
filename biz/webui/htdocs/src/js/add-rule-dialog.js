require('./base-css.js');
require('../css/add-rule.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var protocolMgr = require('./protocols');
var util = require('./util');
var Editor = require('./editor');
var events = require('./events');
var storage = require('./storage');
var dataCenter = require('./data-center');

var protocolGroups = protocolMgr.groups;
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
      ruleName: ''
    };
  },
  componentDidMount: function() {
    var self = this;
    events.on('updatePlugins', function() {
      if (!protocolMgr.existsProtocol(self.state.protocol)) {
        self.state.protocol = 'host://';
      }
      self.setState({});
    });
    $(document.body).on('click', '.w-add-rule-preview', function(e) {
      if ($(e.target).hasClass('w-add-rule-preview')) {
        self.checkAndClosePreview();
      }
    });
  },
  show: function() {
    this.refs.addRuleDialog.show();
    this.setState({});
  },
  hide: function() {
    this.refs.addRuleDialog.hide();
    this.closePreview();
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
  onRuleTextChange: function(e) {
    this.state.ruleText = e.getValue();
  },
  onProtocolChange: function(e) {
    var protocol = e.target.value;
    if (protocol === '+Custom') {
      window.open('https://avwo.github.io/whistle/plugins.html');
      this.setState({});
    } else {
      storage.set('protocolInDialog', protocol);
      this.setState({ protocol: protocol });
    }
    var box = ReactDOM.findDOMNode(this.refs.ruleValue);
    box.select();
    box.focus();
  },
  onRuleNameChange: function(e) {
    var target = e.target;
    if (target.name !== 'ruleNameList' && this.checkPreviewChanged()) {
      return;
    }
    var ruleName = target.value;
    if (!ruleName) {
      while(!ruleName) {
        ruleName = window.prompt('Please input the new Rule name:');
        ruleName = ruleName && ruleName.trim();
        if (!ruleName) {
          return;
        }
        
      }
    }
    this.updateRuleName(ruleName);
  },
  updateRuleName: function(ruleName) {
    storage.set('ruleNameInDialog', ruleName);
    this.clearPreview();
    this.setState({ ruleName: ruleName });
  },
  checkPreviewChanged: function() {
    var state = this.state;
    var ruleText = state.ruleText;
    if (ruleText == null) {
      return;
    }
    if (ruleText.trim() !== state.oldRuleText.trim()) {
      return !window.confirm('The content has changed and this operation will cause changed data loss.');
    }
  },
  checkAndClosePreview: function() {
    if (!this.checkPreviewChanged()) {
      this.closePreview();
    }
  },
  closePreview: function() {
    this.refs.preview.hide();
  },
  clearPreview: function() {
    this.state.ruleText = null;
    this.state.oldRuleText = null;
  },
  preview: function() {
    this.clearPreview();
    this.refs.preview.show();
    this.setState({});
    var self = this;
    setTimeout(function() {
      self.setState({});
    }, 500);
  },
  setSelected: function(modal, name, selected, autoUpdate) {
    if (modal.setSelected(name, selected)) {
      if (!autoUpdate) {
        modal.setChanged(name, false);
      }
      this.setState({
        curSelectedName: name
      });
    }
  },
  reselectRules: function(data) {
    var modal = this.props.rulesModal;
    modal.clearAllSelected();
    modal.setSelected('Default', !data.defaultRulesIsDisabled);
    data.list.forEach(function(name) {
      modal.setSelected(name, true);
    });
  },
  onConfirm: function() {
    var self = this;
    var state = self.state;
    var name = state.ruleName;
    var value = state.ruleText;
    if (value == null) {
      // TODO: xxx
    }
    var modal = self.props.rulesModal;
    var data = {
      name: name,
      value: value
    };
    dataCenter.rules[name === 'Default' ? 'enableDefault' : 'select'](data, function(data, xhr) {
      if (data && data.ec === 0) {
        self.hide();
        var item = modal.get(name);
        if (!item) {
          item = data;
          modal.list.push(name);
          modal.data[name] = item;
          modal.reset(modal.list, modal.data);
        } else {
          item.value = value;
        }
        self.reselectRules(data);
        var onConfirm = self.props.onConfirm;
        onConfirm && onConfirm(self.state.ruleName);
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  render: function() {
    var rulesModal = this.props.rulesModal;
    if (!rulesModal) {
      return null;
    }
    var state = this.state;
    var ruleName = state.ruleName;
    var protocol = state.protocol;
    var rulesList = rulesModal.list.slice();
    rulesList.push(CREATE_OPTION);

    if (!ruleName) {
      ruleName = storage.get('ruleNameInDialog');
      if (rulesList.indexOf(ruleName) === -1) {
        ruleName = 'Default';
      }
      var p = storage.get('protocolInDialog');
      if (protocolMgr.existsProtocol(p)) {
        protocol = p;
        state.protocol = protocol;
      }
      state.ruleName = ruleName;
    }
    var ruleText = state.ruleText;
    if (ruleText == null) {
      ruleText = state.oldRuleText;
      if (ruleText == null) {
        var rule = rulesModal.get(ruleName);
        ruleText = rule && rule.value || '';
        state.oldRuleText = ruleText;
      }
    }
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
            <select className="w-add-rule-protocols" value={protocol}
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
            <select name="ruleNameList" style={{verticalAlign: 'middle'}}
             value={ruleName} onChange={this.onRuleNameChange}>
            {createOptions(rulesList)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-info" onClick={this.preview}>Preview</button>
          <button type="button" className="btn btn-primary" onClick={this.onConfirm}>Confirm</button>
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
        <Dialog ref="preview" wstyle="w-add-rule-preview" disableBackdrop="1">
          <div className="modal-body">
            <button type="button" className="close" onClick={this.checkAndClosePreview}>
              <span aria-hidden="true">&times;</span>
            </button>
            <h5 className="w-add-preview-title">
              Save in
              <select className="w-add-rule-preview-name" value={ruleName}
                onChange={this.onRuleNameChange}>
              {createOptions(rulesList)}
              </select>:
            </h5>
            <Editor {...rulesModal.editorTheme} onChange={this.onRuleTextChange} mode="rules"
              name={ruleName} value={ruleText} ref="editor" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={this.onConfirm}>Confirm</button>
            <button type="button" className="btn btn-default" onClick={this.checkAndClosePreview}>Back</button>
          </div>
        </Dialog>
      </Dialog>
    );
  }
});

var AddRuleDialogWrap = React.createClass({
  show: function() {
    this.refs.addRuleDialog.show();
  },
  hide: function() {
    this.refs.addRuleDialog.hide();
  },
  setData: function(data) {
    this.refs.addRuleDialog.setData(data);
  },
  setRuleName: function(name) {
    name && this.refs.addRuleDialog.updateRuleName(name);
  },
  shouldComponentUpdate: function() {
    return !this.props.rulesModal;
  },
  render: function() {
    return <AddRuleDialog onConfirm={this.props.onConfirm} rulesModal={this.props.rulesModal} ref="addRuleDialog" />;
  }
});

module.exports = AddRuleDialogWrap;
