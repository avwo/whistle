var React = require('react');
var Composer = require('./composer');
var util = require('./util');
var LazyInit = require('./lazy-init');

var ComposerList = React.createClass({
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  showTab: function(name) {

  },
  render: function() {
    var self = this;
    var hide = self.props.hide;
    var modal = self.props.modal;
  
    return (
      <div className={'fill orient-vertical-box' + (hide ? ' hide' : '')}>
        {/* <div className="box w-composer-tab-list">
          <button type="button" onClick={function() {
            self.showTab('_Default');
          }} className="btn btn-default active">
            <span className="glyphicon glyphicon-edit"></span>Default
          </button>
          <div className="fill w-custom-tabs">

          </div>
        </div> */}
        <LazyInit inited={!hide}>
          <Composer modal={modal} hide={hide} />
        </LazyInit>
      </div>
    );
  }
});

module.exports = ComposerList;
