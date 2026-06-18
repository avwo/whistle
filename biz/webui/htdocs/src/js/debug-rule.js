var React = require('react');
var HelpIcon = require('./help-icon');
var ruleMixin = require('./rule-mixin');
var removeSpaces = require('./util').removeSpaces;

function forcus(elem) {
  elem.focus();
  elem.select();
}

function filterNum(str) {
  return str.replace(/\D+/g, '');
}

var DebugRule = React.createClass({
  mixins: [ruleMixin],
  getInitialState: function() {
    return {
      disabledWeinre: true,
      disabledLog: true,
      disabledReqDelay: true,
      disabledResDelay: true,
      disabledReqSpeed: true,
      disabledResSpeed: true,
      abortReq: false,
      abortRes: false,
      weinreId: '',
      logId: '',
      reqDelay: '',
      resDelay: '',
      reqSpeed: '',
      resSpeed: ''
    };
  },
  handleChange: function() {
    var self = this;
    var state = self.state;
    var rules = [];
    if (!state.disabledWeinre) {
      rules.push('weinre://' + state.weinreId);
    }
    if (!state.disabledLog) {
      rules.push('log://' + state.logId);
    }
    if (!state.disabledReqDelay && state.reqDelay) {
      rules.push('reqDelay://' + state.reqDelay);
    }
    if (!state.disabledResDelay && state.resDelay) {
      rules.push('resDelay://' + state.resDelay);
    }
    if (!state.disabledReqSpeed && state.reqSpeed) {
      rules.push('reqSpeed://' + state.reqSpeed);
    }
    if (!state.disabledResSpeed && state.resSpeed) {
      rules.push('resSpeed://' + state.resSpeed);
    }
    if (state.abortReq) {
      rules.push('enable://abortReq');
    }
    if (state.abortRes) {
      rules.push('enable://abortRes');
    }
    rules = rules.join(' ');
    if (self._curRules !== rules) {
      self._curRules = rules;
      self.props.onChange(rules);
    }
  },
  onNumChange: function(e, key) {
    this.state[key] = filterNum(e.target.value);
    this.setState({}, this.handleChange);
  },
  onCheckChange: function(e, key, ref) {
    var self = this;
    var disabled = !e.target.checked;
    self.state[key] = disabled;
    self.setState({}, function() {
      if (!disabled) {
        forcus(self.refs[ref]);
      }
      self.handleChange();
    });
  },
  onAbortReqChange: function(e) {
    this.setState({abortReq: e.target.checked}, this.handleChange);
  },
  onAbortResChange: function(e) {
    this.setState({abortRes: e.target.checked}, this.handleChange);
  },
  onWeinreIdChange: function(e) {
    this.setState({ weinreId: removeSpaces(e.target.value) }, this.handleChange);
  },
  onLogIdChange: function(e) {
    this.setState({ logId: removeSpaces(e.target.value) }, this.handleChange);
  },
  onReqDelayChange: function(e) {
    this.onNumChange(e, 'reqDelay');
  },
  onResDelayChange: function(e) {
    this.onNumChange(e, 'resDelay');
  },
  onReqSpeedChange: function(e) {
    this.onNumChange(e, 'reqSpeed');
  },
  onResSpeedChange: function(e) {
    this.onNumChange(e, 'resSpeed');
  },
  render: function() {
    var self = this;
    var hide = self.props.hide;
    var state = self.state;
    var disabledWeinre = state.disabledWeinre;
    var disabledLog = state.disabledLog;
    var disabledReqDelay = state.disabledReqDelay;
    var disabledResDelay = state.disabledResDelay;
    var disabledReqSpeed = state.disabledReqSpeed;
    var disabledResSpeed = state.disabledResSpeed;

    return (
      <div className={'w-rules-form' + (hide ? ' w-hide' : '')}>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-75">
              <input type="checkbox" className="mr-10" checked={!disabledWeinre} data-name="disabledWeinre" onChange={self.onDisableCheckChange} />
              Weinre
            </label>
            <input ref="weinreId" disabled={disabledWeinre} value={state.weinreId} type="text"
              className="form-control w-weinre-id" maxLength="32" placeholder="Enter weinre id (optional)" onChange={self.onWeinreIdChange} />
            <HelpIcon title="View the DOM structure of web pages" docsUrl="rules/weinre.html" className="ml-10" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-75">
              <input type="checkbox" className="mr-10" checked={!disabledLog} data-name="disabledLog" onChange={self.onDisableCheckChange} />
              Log
            </label>
            <input ref="logId" disabled={disabledLog} value={state.logId} type="text"
              className="form-control w-log-id" maxLength="32" placeholder="Enter log id (optional)" onChange={self.onLogIdChange} />
            <HelpIcon title="View the console output of web pages" docsUrl="rules/log.html" className="ml-10" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" checked={!disabledReqDelay} data-name="disabledReqDelay" onChange={self.onDisableCheckChange} />
              Delay Request
            </label>
            <input ref="reqDelay" disabled={disabledReqDelay} value={state.reqDelay} type="text"
              className="form-control w-200" maxLength="7" placeholder="Enter request delay (ms)" onChange={self.onReqDelayChange} />
            <span className="ml-5">ms</span>
            <HelpIcon docsUrl="rules/reqDelay.html" className="ml-10" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" checked={!disabledResDelay} data-name="disabledResDelay" onChange={self.onDisableCheckChange} />
              Delay Response
            </label>
            <input ref="resDelay" disabled={disabledResDelay} value={state.resDelay} type="text"
              className="form-control w-200" maxLength="7" placeholder="Enter response delay (ms)" onChange={self.onResDelayChange} />
            <span className="ml-5">ms</span>
            <HelpIcon docsUrl="rules/resDelay.html" className="ml-10" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" checked={!disabledReqSpeed} data-name="disabledReqSpeed" onChange={self.onDisableCheckChange} />
              Limit Request Speed
            </label>
            <input ref="reqSpeed" disabled={disabledReqSpeed} value={state.reqSpeed} type="text"
              className="form-control w-200" maxLength="7" placeholder="Enter request speed (kb/s)" onChange={self.onReqSpeedChange} />
            <span className="ml-5">kb/s</span>
            <HelpIcon docsUrl="rules/reqSpeed.html" className="ml-10" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label className="w-175">
              <input type="checkbox" className="mr-10" checked={!disabledResSpeed} data-name="disabledResSpeed" onChange={self.onDisableCheckChange} />
              Limit Response Speed
            </label>
            <input ref="resSpeed" disabled={disabledResSpeed} value={state.resSpeed} type="text"
              className="form-control w-200" maxLength="7" placeholder="Enter response speed (kb/s)" onChange={self.onResSpeedChange} />
            <span className="ml-5">kb/s</span>
            <HelpIcon docsUrl="rules/resSpeed.html" className="ml-10" />
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label>
              <input type="checkbox" className="mr-10" checked={state.abortReq} data-name="abortReq" onChange={self.onEnableCheckChange} />
              Abort Request
              <HelpIcon docsUrl="rules/enable.html" className="ml-10" />
            </label>
          </div>
        </div>
        <div className="w-form-item">
          <div className="w-form-value">
            <label>
              <input type="checkbox" className="mr-10" checked={state.abortRes} data-name="abortRes" onChange={self.onEnableCheckChange} />
              Abort Response
              <HelpIcon docsUrl="rules/enable.html" className="ml-10" />
            </label>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = DebugRule;
