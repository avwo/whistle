var React = require('react');
var Composer = require('./composer');
var util = require('./util');
var LazyInit = require('./lazy-init');
var dataCenter = require('./data-center');
var events = require('./events');

var ComposerList = React.createClass({
  getInitialState: function() {
    return { activeName: ' ' };
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  componentDidMount: function() {
    var self = this;
    events.on('comTabsChange', function() {
      self.setState({});
    });
  },
  showTab: function(name) {
    if (this.state.activeName !== name) {
      this.setState({ activeName: name });
    }
  },
  render: function() {
    var self = this;
    var hide = self.props.hide;
    var modal = self.props.modal;
    var tabs = dataCenter.getComTabs();
    var active = self.state.activeName;
  
    return (
      <div className={'fill orient-vertical-box' + (hide ? ' hide' : '')}>
        {
          tabs.length ? (
            <div className="box w-composer-tab-list">
              <button type="button" onClick={function() {
                self.showTab(' ');
              }} className="btn btn-default active">
                <span className="glyphicon glyphicon-edit"></span>Default
              </button>
              <div className="fill w-custom-tabs">
                {
                  tabs.map(function(tab) {
                    var pluginName = tab.plugin;
                    return (
                            <button
                              key={pluginName}
                              onClick={function() {
                                self.showTab(pluginName);
                              }}
                              className={'btn btn-default' + (active == tab.plugin ? ' active' : '')}
                              title={pluginName}
                            >{tab.name}</button>
                          );
                  })
                }
              </div>
            </div>
          ) : null
        }
        <LazyInit inited={!hide}>
          <Composer modal={modal} hide={hide} />
        </LazyInit>
      </div>
    );
  }
});

module.exports = ComposerList;
