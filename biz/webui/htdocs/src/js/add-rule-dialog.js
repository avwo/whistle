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
var DetailDialog = require('./detail-dialog');
var dataCenter = require('./data-center');

var PATTERN_TIPS = [
  'a.b.com',
  'a.b.com/path/to',
  '$a.b.com',
  '/path\/to/(\d+)/i',
  '*/path/to',
  '*.test.com',
  '**.test.com'
].join('\n');
var FILTER_TIPS = [
  'i:ip|RegExp   (exclude)',
  '!i:ip|RegExp  (include)',
  'RegExp|Wildcard',
  '!RegExp|Wildcard',
  'm:method|RegExp',
  '!m:method|RegExp',
  'h:key=subValue|RegExp',
  '!h:key=subValue|RegExp',
  'b:subVal|RegExp',
  '!b:subVal|RegExp'
].join('\n');

var TYPES = [
  'Throttle',
  'Rewrite',
  {
    value: 'Method/Status',
    text: 'Modify Method Or StatusCode'
  },
  {
    value: 'Req Headers',
    text: 'Modify Request Headers'
  },
  {
    value: 'Res Headers',
    text: 'Modify Response Headers'
  },
  {
    value: 'Req Body',
    text: 'Modify Request Body'
  },
  {
    value: 'Res Body',
    text: 'Modify Response Body'
  },
  {
    value: 'More...',
    text: 'Others'
  }
];

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

var Tips = function(props) {
  return (
    <span className="w-add-rule-dialog-tips"
      style={{ display: props.show ? 'block' : 'none' }}>
      <i className="w-arrow w-arrow-right" />
      <strong>{props.title}</strong>
      <pre>
        {props.text}
      </pre>
      {props.help ? <a href={props.help} target="_blank">Show more...</a> : undefined}
    </span>
  );
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
  show: function(data, action) {
    if (!data || !action) {
      return;
    }
    var input = ReactDOM.findDOMNode(this.refs.pattern);
    this.curReq = data;
    this.action = action;
    input.value = data.url.replace(/[?#].*$/, '');
    setTimeout(function() {
      input.select();
      input.focus();
    }, 600);
    this.refs.addRuleDialog.show();
    this.setState({});
  },
  hide: function() {
    this.refs.addRuleDialog.hide();
    this.closePreview();
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
    if (target.name !== 'ruleGroupList' && this.checkPreviewChanged()) {
      return;
    }
    var ruleName = target.value;
    if (!ruleName) {
      while(!ruleName) {
        ruleName = window.prompt('Please input the new rule group name:');
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
  saveAs: function() {
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
  getCurRuleText: function() {
    var ruleName = this.state.ruleName;
    var rule = this.props.rulesModal.get(ruleName);
    var curRuleText = ''; // TODO: 组装规则
    
    if (!rule || !rule.value) {
      return curRuleText;
    }
    return curRuleText + '\n' + rule.value;
  },
  getName: function(e) {
    return $(e.target).closest('div').attr('name');
  },
  onFocus: function(e) {
    var name = this.getName(e);
    if (name) {
      this.setState({ focusName: name });
    }
  },
  onBlur: function() {
    this.setState({ focusName: null });
  },
  showTips: function(e) {
    this.setState({ hoverName: this.getName(e) });
  },
  hideTips: function() {
    this.setState({ hoverName: null });
  },
  showTips2: function(e) {
    this.setState({ hoverName2: this.getName(e) });
  },
  hideTips2: function() {
    this.setState({ hoverName2: null });
  },
  onConfirm: function() {
    var self = this;
    var state = self.state;
    var name = state.ruleName;
    var value = state.ruleText;
    if (value == null) {
      value = this.getCurRuleText();
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
  showDetailDialog: function() {
    this.refs.detailDialog.show(this.curReq);
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
    var name = state.hoverName || state.focusName || state.hoverName2;
    return (
      <Dialog ref="addRuleDialog" wstyle="w-add-rule-dialog">
        <div className="modal-header">
          <select>
            {createOptions(TYPES)}
          </select>
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body" ref="container">
          <div name="pattern"
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onMouseEnter={this.showTips2}
            onMouseLeave={this.hideTips2}
          >
            <label
              onMouseEnter={this.showTips}
              onMouseLeave={this.hideTips}
            >
              <span className="glyphicon glyphicon-question-sign">
                <Tips
                  text={PATTERN_TIPS}
                  title="Input the pattern to match the request URL, such as:"
                  show={name === 'pattern'}
                  help="https://avwo.github.io/whistle/pattern.html"
                />
              </span>
              Pattern:
            </label>
            <input ref="pattern" className="w-add-rule-pattern"
              maxLength="1024" placeholder="Input the pattern to match the request URL" />
          </div>
          <div name="rule"
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onMouseEnter={this.showTips2}
            onMouseLeave={this.hideTips2}
          >
            <label
              onMouseEnter={this.showTips}
              onMouseLeave={this.hideTips}
            >
              <span className="glyphicon glyphicon-question-sign">
                <Tips text="test1" show={name === 'rule'} />
              </span>
              Operation:
            </label>
            <select className="w-add-rule-protocols" value={protocol}
              onChange={this.onProtocolChange}>
              {createOptions(protocolGroups)}
            </select><textarea maxLength="3072" ref="ruleValue"
              placeholder={'Input the operation value (<= 3k), such as:\n'} />
          </div>
          <div name="filter"
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onMouseEnter={this.showTips2}
            onMouseLeave={this.hideTips2}
          >
            <label
              onMouseEnter={this.showTips}
              onMouseLeave={this.hideTips}
            >
              <span className="glyphicon glyphicon-question-sign">
                <Tips
                text={FILTER_TIPS}
                show={name === 'filter'}
                help="https://avwo.github.io/whistle/rules/filter.html"
                title="Input the filter to exclude (!include) the request, such as:"
              />
              </span>
              Filter:
            </label>
            <textarea maxLength="256" placeholder="Input the filter to exclude (!include) the request" className="w-add-rule-filter" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className={'btn btn-warning' + (this.curReq ? '' : ' hide')}
            onClick={this.showDetailDialog}>
            View Request Detail
          </button>
          <button type="button" className="btn btn-primary" onClick={this.saveAs}>Save As</button>
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
        <DetailDialog ref="detailDialog" />
      </Dialog>
    );
  }
});

var AddRuleDialogWrap = React.createClass({
  show: function(data, action) {
    this.refs.addRuleDialog.show(data, action);
  },
  hide: function() {
    this.refs.addRuleDialog.hide();
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
