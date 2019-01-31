require('./base-css.js');
require('../css/add-rule.css');
var React = require('react');
var Dialog = require('./dialog');

var PATTERN_TYPES = 'Auto,http://,https://,ws://,wss://,tunnel://,RegExp,UrlExp'.split(',');
var PROTOCOLS = ['Set Hosts', 'Set Proxy', 'Map Local', 'Map Remote', 'Modify URL',
  'Modify Method', 'Modify StatusCode', 'Modify Headers', 'Modify Body', 'Inject Body', 'Settings',
  'Throttle', 'Script', 'Tools', 'Plugin']; // use optGroup

var createOptions = function(list) {
  return list.map(function(item) {
    return (
      <option value={item}>{item}</option>
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
  render: function() {
    return (
      <Dialog ref="addRuleDialog" wstyle="w-add-rule-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div>
            <label>Pattern:</label>
            <select className="w-add-rule-pattern">
              {createOptions(PATTERN_TYPES)}
            </select>
            <input />
          </div>
          <div>
            <label>Protocol:</label>
            <select>
              {createOptions(PROTOCOLS)}
            </select>
          </div>
          <div>
            <label>Value:</label>
            <textarea />
          </div>
          <div>
            <label>Filter:</label>
            <textarea />
          </div>
          <div>
            <label>Save in:</label>
            <select className="w-add-rule-editor">
              <option>Default</option>
            </select>
            <a href="javascript:;">Preview</a>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" data-dismiss="modal">Confirm</button>
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
    );
  }
});

module.exports = AddRuleDialog;
