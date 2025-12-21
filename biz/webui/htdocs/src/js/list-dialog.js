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
var ShareViaURLBtn = require('./share-via-url-btn');

var TEMP_LINK_RE_G = /(?:^|\s)(?:[\w-]+:\/\/)?temp\/([\da-z]{64})(?:\.[\w-]+)?(?:$|\s)/mg;

var ListDialog = React.createClass({
  getInitialState: function () {
    return {
      checkedItems: {},
      checkedRuleList: [],
      ruleListLen: 0,
      filename: '',
      tabs: [
        {
          icon: 'file',
          name: 'Rules Files',
          active: true
        },
        {
          icon: 'list',
          name: 'Rules Items'
        }
      ]
    };
  },
  shouldComponentUpdate: function () {
    return this.refs.dialog.isVisible();
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
  filterFilename: function (e) {
    this.setState({ filename: util.formatFilename(e.target.value) });
  },
  getInputValue: function () {
    return util.formatFilename(ReactDOM.findDOMNode(this.refs.filename).value.trim());
  },
  getRuleList: function (cb) {
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
    var filename = this.getInputValue() || 'mock_' + util.formatDate() + '.txt';
    var execCb = function() {
      cb([rules, newVals || {}], filename);
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
        execCb();
      });
    } else {
      execCb();
    }
  },
  exportRuleList: function () {
    this.getRuleList(function (data, filename) {
      util.download(data, filename);
    });
  },
  isRuleList: function () {
    return this.state.tabs[1].active;
  },
  onConfirm: function (e) {
    if (e.target.disabled) {
      return;
    }
    this.refs.dialog.hide();
    if (this.isRuleList()) {
      return this.exportRuleList();
    }
    var items = this.state.checkedItems;
    this.donwload(items);
  },
  getExportData: function(cb) {
    if (this.isRuleList()) {
      return this.getRuleList(cb);
    }
    cb(this.state.checkedItems);
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
      var input = ReactDOM.findDOMNode(self.refs.filename);
      input.focus();
      input.select();
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
  checkAll: function (e) {
    var list = this.props.list;
    if (!list || !list.length) {
      return;
    }
    var checkedItems = {};
    if (e.target.checked) {
      list.forEach(function (name) {
        checkedItems[name] = 1;
      });
    }
    this.setState({ checkedItems: checkedItems });
  },
  checkItem: function(e, item) {
    item.checked = e.target.checked;
    this.setState({});
  },
  onShare: function(err) {
    if (!err) {
      this.refs.dialog.hide();
      ReactDOM.findDOMNode(this.refs.filename).value = '';
    }
  },
  render: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    var tabs = state.tabs;
    var ruleListLen = state.ruleListLen;
    var rulesModal = state.rulesModal;
    var list = props.list || [];
    var listLen = list.length;
    var checkedItems = state.checkedItems;
    var checkedNames = Object.keys(checkedItems);
    var selectedCount = rulesModal && tabs[1].active ? state.checkedRuleList.length : checkedNames.length;
    var pageName = props.name;
    var tips = selectedCount ? props.tips : null;
    var onConfirm = props.onConfirm;
    var isRules = props.isRules;
    var checkedAll = listLen && list.every(function (name) {
      return checkedNames.indexOf(name) !== -1;
    });

    return (
      <Dialog ref="dialog" wclassName="w-list-dialog">
        { props.title ? <div className="modal-header">
                <h4>{props.title}</h4>
                <button type="button" className="close" data-dismiss="modal">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div> : null }
        <div className="modal-body">
          {props.title ? null : <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>}
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
                  value={state.filename}
                  onChange={self.filterFilename}
                  style={{ width: 812, display: 'inline-block', marginLeft: 5 }}
                  className="form-control"
                  placeholder="Enter filename (optional)"
                />
              </p>)}
        </div>
        <div className="modal-footer">
        {onConfirm ? null : <label className={'w-kv-check-all' + (tabs[1].active ? ' hide' : '')}>
          <input type="checkbox" checked={checkedAll} onChange={this.checkAll} disabled={!listLen} />
          Select all
        </label>}
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          {onConfirm ? null : <ShareViaURLBtn getFilename={this.getInputValue} disabled={!selectedCount}
            type={this.isRuleList() ? 'mock' : props.name}
            getData={this.getExportData} onComplete={this.onShare} />}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedCount}
            onMouseDown={this.preventDefault}
            onClick={onConfirm ? function() {
              onConfirm(checkedNames);
            } : this.onConfirm}
          >
            {onConfirm ? 'Confirm' : 'Export' + ' (' + selectedCount + ' / ' + (tabs[1].active ?  ruleListLen : listLen) + ')'}
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
