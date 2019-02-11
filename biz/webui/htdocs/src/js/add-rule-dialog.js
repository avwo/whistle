require('./base-css.js');
require('../css/add-rule.css');
var React = require('react');
var Dialog = require('./dialog');
var protocolGroups = require('./protocols').groups;

var _createOptions = function(list) {
  return list.map(function(item) {
    return (
      <option value={item}>{item}</option>
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
  show: function() {
    this.refs.addRuleDialog.show();
  },
  hide: function() {
    this.refs.addRuleDialog.hide();
  },
  shouldComponentUpdate: function() {
    return !this.refs.addRuleDialog || this.refs.addRuleDialog.isVisible();
  },
  render: function() {
    var rulesModal = this.props.rulesModal;
    if (!rulesModal) {
      return null;
    }
    var rulesList = rulesModal.list.slice();
    rulesList.push('+Create');
    return (
      <Dialog ref="addRuleDialog" wstyle="w-add-rule-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div>
            <label htmlFor="___add-rule-pattern">
              <span className="glyphicon glyphicon-question-sign" />
              Pattern:
            </label>
            <input id="___add-rule-pattern" className="w-add-rule-pattern"
              maxLength="1024" placeholder="Input the pattern to match request URL" />
          </div>
          <div>
            <label htmlFor="___add-rule-text">
              <span className="glyphicon glyphicon-question-sign" />
              Operation:
            </label>
            <select id="___add-rule-text" className="w-add-rule-protocols">
              {createOptions(protocolGroups)}
            </select><textarea maxLength="3072"
              placeholder={'Input the operation value, the length can\'t exceed 3kb.\nFor help, press F1 or click the help icon on the left.'} />
          </div>
          <div>
            <label htmlFor="___add-rule-file">
              <span className="glyphicon glyphicon-question-sign" />
              Save in:
            </label>
            <select id="___add-rule-file">
            {createOptions(rulesList)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-info" data-dismiss="modal">Preview & Edit</button>
          <button type="button" className="btn btn-primary" data-dismiss="modal">Confirm</button>
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
    );
  }
});

module.exports = AddRuleDialog;
