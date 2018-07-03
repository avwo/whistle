require('./base-css.js');
var React = require('react');
var Divider = require('./divider');
var ReqDetail = require('./req-detail');
var ResDetail = require('./res-detail');
var util = require('./util');

var Inspector = React.createClass({
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    var props = this.props;
    return (
      <Divider vertical="true" className={'w-detail-inspectors' + (props.hide ? ' hide' : '')}>
        <div className="fill orient-vertical-box">
          <div className="w-detail-inspectors-title">
            <span className="glyphicon glyphicon-arrow-right"></span>Request
          </div>
          <ReqDetail modal={props.modal} />
        </div>
        <div className="fill orient-vertical-box">
          <div className="w-detail-inspectors-title">
          <span className="glyphicon glyphicon-arrow-left"></span>Response
          </div>
          <ResDetail modal={props.modal} />
        </div>
      </Divider>
    );
  }
});

module.exports = Inspector;
