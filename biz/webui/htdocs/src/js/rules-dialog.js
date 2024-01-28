var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var Editor = require('./editor');
var storage = require('./storage');
var events = require('./events');
var util = require('./util');
var win = require('./win');

var TEMP_FILE_RE = /\btemp\/current_file_hash_placeholder\b/;
var TEMP_FILE_RE_G = /\btemp\/current_file_hash_placeholder\b/g;
var LINE__RE = /^(?:[^\n\r\S]*(```+)[^\n\r\S]*(\S+)[^\n\r\S]*[\r\n]([\s\S]+?)[\r\n][^\n\r\S]*\1\s*|[^\r\n]*)$/gm;

function getName(name) {
  name = name || storage.get('previewRulesName');
  var rulesModal = dataCenter.getRulesModal();
  if (name) {
    if (rulesModal.getItem(name)) {
      return name;
    }
  }
  const names = rulesModal.getSelectedNames();
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
    return { rulesName: getName(), newRulesName: ''  };
  },
  show: function (rules, values) {
    this._rules = rules;
    this._values = values;
    this._hasChanged = false;
    this.setValue();
    this.refs.rulesDialog.show();
  },
  onRulesChange: function(e) {
    var name = e.target.value;
    var self = this;
    if (name) {
      if (!this._hasChanged) {
        return self.setValue(name, true);
      }
      win.confirm('Switching rules will cause the changed content to be lost, continue?', function(sure) {
        if (sure) {
          self._hasChanged = false;
          self.setValue(name, true);
        }
      });
      return;
    }
    self.refs.createRules.show();
    var input = ReactDOM.findDOMNode(self.refs.rulesName);
    setTimeout(function() {
      input.select();
      input.focus();
    }, 300);
  },
  onRulesValueChange: function(e) {
    this._hasChanged = true;
    this.setState({rulesValue: e.getValue()});
  },
  onNewNameChange: function(e) {
    var name = e.target.value.replace(/\s+/g, '');
    this.setState({newRulesName: name});
  },
  createRules: function() {
    var self = this;
    var filename = self.state.newRulesName;
    dataCenter.rules.add({
      name: filename,
      value: ''
    }, function (result, xhr) {
      if (result && result.ec === 0) {
        events.trigger('addNewRulesFile', {
          filename: filename,
          data: ''
        });
        self.refs.createRules.hide();
        self.setState({ newRulesName: '', rulesName: filename });
        self.setValue(filename, true);
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  createTempFile: function(cb) {
    var self = this;
    var state = self.state;
    var values = self._values;
    var rulesValue = state.rulesValue;
    if (!values || !values.isFile || !TEMP_FILE_RE.test(rulesValue)) {
      return self.saveValue(cb);
    }
    dataCenter.createTempFile(JSON.stringify({
      clientId: dataCenter.getPageId(),
      value: values.value,
      base64: values.base64
    }), function (result, xhr) {
      if (result && result.ec === 0) {
        cb(result.filepath);
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  saveValue: function(cb) {
    var self = this;
    var values = self._values;
    var name = values && values.name;
    var value = values && values.value;
    if (!name || values.isFile || !util.isString(name) || !util.isString(value)) {
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
            util.showSystemError(xhr);
          }
        });
      }
    };
    var item = dataCenter.getValuesModal().getItem(name);
    if (item && item.value !== value) {
      return win.confirm('The name `' + name + '`  already exists, whether to overwrite it?', next);
    }
    next(true);
  },
  save: function() {
    var self = this;
    var state = self.state;
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
          events.trigger('hideMockDialog');
        } else {
          util.showSystemError(xhr);
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
  render: function () {
    var rulesModal = dataCenter.getRulesModal();
    var state = this.state;
    var newRulesName = state.newRulesName;
    var list = rulesModal.list;
    return (
      <Dialog ref="rulesDialog" wstyle="w-rules-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div className="modal-title">
            Select Rules File:
            <select className="form-control" onChange={this.onRulesChange} value={state.rulesName}>
              {list.map(function(name) {
                return <option value={name}>{name}</option>;
              })}
              <option value="">+Create</option>
            </select>
          </div>
          <Editor
            value={state.rulesValue}
            onChange={this.onRulesValueChange}
            ref="editor"
            mode="rules"
            theme={storage.get('rulesTheme') || 'cobalt'}
            fontSize={storage.get('rulesFontSize') || '14px'}
            lineNumbers={storage.get('showRulesLineNumbers') === 'true'}
            lineWrapping={!!storage.get('autoRulesLineWrapping')}
          />
        </div>
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
            onClick={this.save}
          >
            Save
          </button>
        </div>
        <Dialog ref="createRules" wstyle="w-create-rules-dialog">
          <div className="modal-body">
            New Rules Name:
            <input ref="rulesName" style={{marginTop: 6}} className="form-control"
              maxLength="64" onChange={this.onNewNameChange} value={newRulesName} placeholder="Input the name" />
          </div>
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
              onClick={this.createRules}
              disabled={!newRulesName || list.indexOf(newRulesName) !== -1}
            >
              Confirm
            </button>
          </div>
        </Dialog>
      </Dialog>
    );
  }
});

var MockDialogWrap = React.createClass({
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (text, values) {
    this.refs.rulesDialog.show(text, values);
  },
  render: function () {
    return <RulesDialog ref="rulesDialog" />;
  }
});

module.exports = MockDialogWrap;
