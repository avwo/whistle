var React = require('react');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var Editor = require('./editor');
var storage = require('./storage');
var events = require('./events');
var util = require('./util');
var win = require('./win');
var CloseBtn = require('./close-btn');
var Prompt = require('./prompt');
var message = require('./message');

var showSysErr = util.showSysErr;
var isStr = util.isStr;
var TEMP_FILE_RE = /\btemp\/current_file_hash_placeholder\b/;
var TEMP_FILE_RE_G = /\btemp\/current_file_hash_placeholder\b/g;
var LINE__RE = /^(?:[^\n\r\S]*(```+)[^\n\r\S]*(\S+)[^\n\r\S]*[\r\n]([\s\S]+?)[\r\n][^\n\r\S]*\1\s*|[^\r\n]*)$/gm;

function getEnabledIcon(item) {
  return item && item.selected ? ' (✓)' : '';
}

function getName(name) {
  name = name || storage.get('previewRulesName');
  if (util.isGroup(name)) {
    return 'Default';
  }
  var rulesModal = dataCenter.getRulesModal();
  if (name) {
    if (rulesModal.getItem(name)) {
      return name;
    }
  }
  var names = rulesModal.getSelectedNames();
  for (var i = 0, len = names.length; i < len; i++) {
    name = names[i];
    if (name !== 'Default') {
      return name;
    }
  }
  return 'Default';
}

var RulesDialog = React.createClass({
  getInitialState: function () {
    return { rulesName: getName() };
  },
  show: function (rules, values, filename) {
    var self = this;
    self._rules = rules;
    self._values = values;
    self._hasChanged = false;
    self.refs.rulesDialog.show();
    if (self.props.onSave) {
      return setTimeout(function() {
        self.setState({ rulesValue: rules });
      }, 360);
    }
    self.setValue();
    filename = getName(filename);
    filename && self.setState({ rulesName: filename });
  },
  onRulesChange: function(e) {
    var name = e.target.value;
    var self = this;
    if (name) {
      if (!this._hasChanged) {
        return self.setValue(name, true);
      }
      win.confirm('Unsaved changes will be lost. Continue?', function(sure) {
        if (sure) {
          self._hasChanged = false;
          self.setValue(name, true);
        }
      });
      return;
    }
    self.showCreateRules();
  },
  showCreateRules: function() {
    var self = this;
    self.refs.prompt.show(function(name) {
      var rulesModal = dataCenter.getRulesModal();
      if (rulesModal.list.indexOf(name) !== -1) {
        message.error('The name \'' + name + '\' is already exists');
        return false;
      }
      dataCenter.rules.add({
        name: name,
        value: ''
      }, function (result, xhr) {
        if (result && result.ec === 0) {
          events.trigger('addNewRulesFile', {
            filename: name,
            data: ''
          });
          self.setState({ rulesName: name });
          self.setValue(name, true);
        } else {
          showSysErr(xhr);
        }
      });
    });
  },
  onRulesValueChange: function(e) {
    this._hasChanged = true;
    this.setState({rulesValue: e.getValue()});
  },
  createTempFile: function(cb) {
    var self = this;
    var state = self.state;
    var values = self._values;
    var rulesValue = state.rulesValue;
    if (!values || !values.isFile) {
      return self.saveValue(cb);
    }
    var hasError;
    var createFile = function(base64, value, init) {
      dataCenter.createTempFile(JSON.stringify({
        clientId: dataCenter.getPageId(),
        value: value,
        base64: base64
      }), function (result, xhr) {
        if (result && result.ec === 0) {
          init && cb(TEMP_FILE_RE.test(rulesValue) ? result.filepath : null);
        } else if (!hasError) {
          hasError = true;
          showSysErr(xhr);
        }
      });
    };
    createFile(values.base64, values.value, true);
    var list = values.list;
    list = Array.isArray(list) ? list.slice(0, 10) : [];
    list.forEach(function(base64) {
      createFile(base64);
    });
  },
  saveValue: function(cb) {
    var self = this;
    var values = self._values;
    var name = values && values.name;
    var value = values && values.value;
    if (!name || values.isFile || !isStr(name) || !isStr(value)) {
      return cb();
    }
    var next = function(sure) {
      if (sure) {
        dataCenter.values.add({
          name: name,
          value: value
        }, function (data, xhr) {
          if (data && data.ec === 0) {
            events.trigger('addNewValuesFile', {
              filename: name,
              data: value
            });
            cb();
          } else {
            showSysErr(xhr);
          }
        });
      }
    };
    var item = dataCenter.getValuesModal().getItem(name);
    if (item && item.value !== value) {
      return win.confirm('The name `' + name + '` is already in use. Overwrite?', next);
    }
    next(true);
  },
  save: function() {
    var self = this;
    var state = self.state;
    var onSave = self.props.onSave;
    if (onSave) {
      onSave(self.state.rulesValue);
      return self.refs.rulesDialog.hide();
    }
    var rulesValue = state.rulesValue;
    var filename = state.rulesName;
    self.createTempFile(function(filepath) {
      var values;
      if (filepath) {
        values = null;
        rulesValue = rulesValue.replace(TEMP_FILE_RE_G, filepath);
        var curRules = (self._rules || '').replace(TEMP_FILE_RE_G, filepath);
        if (curRules) {
          var hasRule;
          rulesValue = rulesValue.replace(LINE__RE, function(line, _, key) {
            if (key) {
              return line;
            }
            if (line === curRules || line.trim().split(/\s+/).join(' ') === curRules) {
              hasRule = true;
              return '';
            }
            return line;
          });
          if (hasRule) {
            if (dataCenter.backRulesFirst) {
              rulesValue = rulesValue.replace(/\s+$/, '') + '\n\n' + curRules + '\n';
            } else {
              rulesValue = curRules + '\n\n' + rulesValue.replace(/^\s+/, '');
            }
          }
        }
      } else {
        values = self._values;
      }
      dataCenter.addRulesAndValues(JSON.stringify({
        clientId: dataCenter.getPageId(),
        rules: {
          name: filename,
          value: rulesValue
        },
        values: values
      }), function (result, xhr) {
        if (result && result.ec === 0) {
          events.trigger('addNewRulesFile', {
            filename: filename,
            data: rulesValue
          });
          events.trigger('addMockRulesSuccess');
          if (values) {
            events.trigger('addNewValuesFile', {
              filename: values.name,
              data: values.value
            });
          }
          self.refs.rulesDialog.hide();
          events.trigger('hideRulesDialog');
        } else {
          showSysErr(xhr);
        }
      });
    });
  },
  setValue: function(name, immediate) {
    if (name) {
      storage.set('previewRulesName', name);
    } else {
      name = getName();
    }
    var rulesModal = dataCenter.getRulesModal();
    var item = rulesModal.getItem(name);
    var value = item && item.value || '';
    var lf = value ? '\n\n' : '\n';
    var curRules = this._rules;
    if (value.indexOf(curRules) !== -1 && !/[\r\n]/.test(curRules)) {
      if (value.indexOf('```') === -1) {
        value = value.split(/\r\n|\r|\n/).map(function(line) {
          return line.trim().split(/\s+/).join(' ') === curRules ? '' : line;
        }).join('\n');
      } else {
        value = value.replace(LINE__RE, function(line, _, key) {
          if (key) {
            return line;
          }
          return line.trim().split(/\s+/).join(' ') === curRules ? '' : line;
        });
      }
    }
    if (dataCenter.backRulesFirst) {
      value = value.replace(/\s+$/, '') + lf + curRules + '\n';
    } else {
      value = curRules + lf + value.replace(/^\s+/, '');
    }
    var self = this;
    var editor = this.refs.editor;
    var handleEnd = function() {
      dataCenter.backRulesFirst && editor._editor.scrollTo(0, 10000000);
      self.setState({ rulesValue: value });
    };
    if (immediate) {
      setTimeout(handleEnd, 100);
    } else {
      setTimeout(handleEnd, 360);
    }
    self.setState({ rulesName: getName(name) });
  },
  getSelectList: function() {
    var rulesModal = dataCenter.getRulesModal();
    var list = rulesModal.list;
    var selectList = [];
    var data = rulesModal.data;
    for (var i = 0, len = list.length; i < len; i++) {
      var name = list[i];
      if (util.isGroup(name)) {
        var items = [];
        for (++i; i < len; i++) {
          var itemName = list[i];
          if (util.isGroup(itemName)) {
            i--;
            break;
          }
          items.push(<option key={itemName} value={itemName}>{itemName + getEnabledIcon(data[itemName])}</option>);
        }
        selectList.push(<optgroup key={name} label={name}>{items}</optgroup>);
      } else {
        selectList.push(<option key={name} value={name}>{name + getEnabledIcon(data[name])}</option>);
      }
    }
    return selectList;
  },
  render: function () {
    var self = this;
    var state = self.state;

    return (
      <Dialog ref="rulesDialog" wstyle="w-rules-dialog">
        {self.props.onSave ? <div className="modal-header">
          <h4>Rules Editor</h4>
          <CloseBtn />
        </div> : <div className="modal-title">
          Select Rule File:
          <select className="form-control" onChange={self.onRulesChange} value={state.rulesName}>
            {self.getSelectList()}
            <option value="">+Create</option>
          </select>
          <button className="btn btn-default" onClick={self.showCreateRules}>+Create</button>
          <CloseBtn />
        </div>}
        <Editor
          value={state.rulesValue}
          onChange={self.onRulesValueChange}
          ref="editor"
          mode="rules"
          {...util.getRulesTheme()}
        />
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={self.save}
          >
            Save
          </button>
        </div>
        <Prompt ref="prompt" title="Create Rule File" placeholder="Enter rule file name" />
      </Dialog>
    );
  }
});

var MockDialogWrap = React.createClass({
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (text, values, filename) {
    this.refs.rulesDialog.show(text, values, filename);
  },
  render: function () {
    return <RulesDialog ref="rulesDialog" onSave={this.props.onSave} />;
  }
});

module.exports = MockDialogWrap;
