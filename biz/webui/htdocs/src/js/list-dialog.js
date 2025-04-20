require('./base-css.js');
require('../css/list-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var Dialog = require('./dialog');
var Tabs = require('./tabs');
var RuleList = require('./rule-list');
var $ = require('jquery');
var parseRules = require('./parse-rules');
var dataCenter = require('./data-center');

var TEMP_LINK_RE_G = /(?:^|\s)(?:[\w-]+:\/\/)?temp\/([\da-z]{64})(?:\.[\w-]+)?(?:$|\s)/mg;

var ListDialog = React.createClass({
  getInitialState: function () {
    return {
      checkedItems: {},
      checkedRuleList: [],
      ruleListLen: 0,
      tabs: [
        {
          icon: 'file',
          name: 'File List',
          active: true
        },
        {
          icon: 'list',
          name: 'Rule List'
        }
      ]
    };
  },
  componentDidMount: function () {
    this.dialogElem = $(ReactDOM.findDOMNode(this.refs.dialog));
  },
  shouldComponentUpdate: function () {
    return this.dialogElem.has('.in');
  },
  onChange: function (e) {
    var target = e.target;
    var name = target.parentNode.title;
    var checkedItems = this.state.checkedItems;
    if (target.checked) {
      checkedItems[name] = 1;
    } else {
      delete checkedItems[name];
    }
    this.setState({ checkedItems: checkedItems });
  },
  donwload: function(data) {
    var input = ReactDOM.findDOMNode(this.refs.filename);
    var form = ReactDOM.findDOMNode(this.refs.exportData);
    ReactDOM.findDOMNode(this.refs.exportName).value = input.value.trim();
    ReactDOM.findDOMNode(this.refs.data).value = JSON.stringify(data);
    form.submit();
    input.value = '';
  },
  exportRuleList: function () {
    var rulesModal = this.state.rulesModal;
    var allValues = {};
    var checkedList = this.state.checkedRuleList;
    var allList = [];
    rulesModal.list.forEach(function(item, i) {
      if (i && item.checked) {
        allValues = $.extend({}, item.rawValues, allValues);
      }
      item.rules.forEach(function(rule) {
        allList.push(rule.join(' '));
      });
    });
    var defaultItem = rulesModal.list[0];
    if (defaultItem && defaultItem.checked) {
      allValues = $.extend({}, defaultItem.rawValues, allValues);
    }

    var rules = checkedList.filter(function(line) {
      return allList.indexOf(line) !== -1;
    }).join('\n');
    var values = [];
    var files = [];
    rules.replace(/\{([^\s}]+)\}/g, function (_, key) {
      var val = allValues[key];
      if (values.indexOf(val) === -1) {
        values.push(val);
      }
    }).replace(TEMP_LINK_RE_G, function (_, filename) {
      if (files.indexOf(filename) === -1 && files.length < 11) {
        files.push(filename);
      }
    });
    values = values.join('\n');
    if (values) {
      rules += '\n\n' + values;
    }
    var newVals;
    var filename = ReactDOM.findDOMNode(this.refs.filename).value.trim() || 'rules_' + util.formatDate() + '.txt';
    var dl = function() {
      util.download([rules, newVals || {}], filename);
    };
    if (files.length) {
      dataCenter.getTempFile({ files: files.join() }, function (result) {
        var list = result && result.list;
        if (list && list.length) {
          newVals = {
            isFile: true,
            base64: list.shift(),
            list: list
          };
        }
        dl();
      });
    } else {
      dl();
    }
  },
  onConfirm: function (e) {
    if (e.target.disabled) {
      return;
    }
    this.refs.dialog.hide();
    if (this.state.tabs[1].active) {
      return this.exportRuleList();
    }
    var exportAll = e.target.className.indexOf('btn-warning') !== -1;
    var items = exportAll ? this.getAllItems() : this.state.checkedItems;
    this.donwload(items);
  },
  getAllItems: function () {
    var list = this.props.list || [];
    var result = {};
    list.forEach(function (name) {
      result[name] = 1;
    });
    return result;
  },
  show: function (selectedList) {
    var self = this;
    var props = self.props;
    var list = props.list || [];
    var rulesModal = self.getRulesModal();

    self.refs.dialog.show();
    if (selectedList) {
      if (selectedList && typeof selectedList === 'string') {
        selectedList = [selectedList];
      }
      var checkedItems = {};
      if (Array.isArray(selectedList)) {
        selectedList.forEach(function(name) {
          if (list.indexOf(name) !== -1) {
            checkedItems[name] = 1;
          }
        });
      }
      self.setState({ checkedItems: checkedItems });
    }
    !this.props.onConfirm && setTimeout(function () {
      ReactDOM.findDOMNode(self.refs.filename).focus();
    }, 500);

    if (rulesModal) {
      var ruleListLen = 0;
      var map = {};
      var modal = self.state.rulesModal;
      list = rulesModal.list.map(function(name) {
        var item = rulesModal.get(name);
        var data = parseRules(item.value) || { rules: [], values: {}, rawValues: {} };
        var oldData = modal && modal.map[name];
        data.name = name;
        data.checked = oldData && oldData.checked;
        map[name] = data;
        ruleListLen += data.rules.length;
        return data;
      });
      this.setState({
        rulesModal: {
          list: list,
          map: map
        },
        ruleListLen: ruleListLen
      });
    }
  },
  hide: function() {
    this.refs.dialog.hide();
  },
  preventDefault: function (e) {
    e.preventDefault();
  },
  onTabChange: function (tab) {
    var self = this;
    var tabs = self.state.tabs;
    tabs.forEach(function (t) {
      t.active = false;
    });
    tab.active = true;
    self.setState({ tabs: tabs });
  },
  getRulesModal: function() {
    var props = this.props;
    return props.name === 'rules' && props.modal;
  },
  onCheckedRuleChange: function (list) {
    this.setState({checkedRuleList: list});
  },
  render: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    var tabs = state.tabs;
    var ruleListLen = state.ruleListLen;
    var rulesModal = state.rulesModal;
    var list = props.list || [];
    var checkedItems = state.checkedItems;
    var checkedNames = Object.keys(checkedItems);
    var selectedCount = rulesModal && tabs[1].active ? state.checkedRuleList.length : checkedNames.length;
    var pageName = props.name;
    var tips = selectedCount ? props.tips : null;
    var onConfirm = props.onConfirm;
    var isRules = props.isRules;

    return (
      <Dialog ref="dialog" wclassName="w-list-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          {rulesModal ? <Tabs tabs={tabs} onChange={self.onTabChange} /> : null}
          <div className={tabs[0].active ? '' : ' hide'} style={{marginTop: 10}}>
            <div className="w-list-wrapper">
              {list.map(function (name, i) {
                if (!i && isRules) {
                  return;
                }
                return (
                  <label title={name} key={name}>
                    <input
                      onChange={self.onChange}
                      type="checkbox"
                      checked={!!checkedItems[name]}
                    />
                    {util.isGroup(name) ? <span className="glyphicon glyphicon-triangle-right w-list-group-icon" /> : null}
                    {name}
                  </label>
                );
              })}
            </div>
            {tips ? <h5 className="w-list-tips-title">{tips}</h5> : null}
          </div>
          {rulesModal ? <RuleList modal={rulesModal} hide={!tabs[1].active} onChange={self.onCheckedRuleChange} /> : null}
          {tips ? <div className="w-list-tips">
              {
                checkedNames.map(function(name) {
                  return (
                    <span key={name}>
                      {util.isGroup(name) ? <span className="glyphicon glyphicon-triangle-right w-list-group-icon" /> : null}
                      {name}
                    </span>
                  );
                })
              }
            </div> : (onConfirm && !rulesModal ? null : <p style={{marginTop: 10, whiteSpace: 'nowrap'}}>
                Filename:
                <input
                  ref="filename"
                  style={{ width: 812, display: 'inline-block', marginLeft: 5 }}
                  className="form-control"
                  placeholder="Input the filename"
                />
              </p>)}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          {onConfirm ? null : <button
            type="button"
            className={'btn btn-warning' + (tabs[1].active ? ' hide' : '')}
            onMouseDown={this.preventDefault}
            onClick={this.onConfirm}
          >
            Export All
          </button>}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedCount}
            onMouseDown={this.preventDefault}
            onClick={onConfirm ? function() {
              onConfirm(checkedNames);
            } : this.onConfirm}
          >
            {onConfirm ? 'Confirm' : 'Export Selected' + (onConfirm ? '' : ' (' + selectedCount + ' / ' + (tabs[1].active ?  ruleListLen : list.length) + ')')}
          </button>
        </div>
        <form
          action={'cgi-bin/' + pageName + '/export'}
          ref="exportData"
          style={{ display: 'none' }}
          target="downloadTargetFrame"
        >
          <input ref="exportName" type="hidden" name="filename" />
          <input ref="data" type="hidden" name={pageName} />
        </form>
      </Dialog>
    );
  }
});

module.exports = ListDialog;
