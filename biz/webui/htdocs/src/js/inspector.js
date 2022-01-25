require('./base-css.js');
var React = require('react');
var Divider = require('./divider');
var ReqDetail = require('./req-detail');
var ResDetail = require('./res-detail');
var util = require('./util');

var Inspector = React.createClass({
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    if (hide != util.getBoolean(nextProps.hide)) {
      return true;
    }
    if (hide) {
      return false;
    }
    var modal = this.props.modal;
    var newModal = nextProps.modal;
    if (!modal || modal !== newModal) {
      return true;
    }

    return !this.endTime;
  },
  render: function () {
    var props = this.props;
    var modal = props.modal;
    this.endTime = modal && (modal.endTime || modal.lost);
    return (
      <Divider vertical="true" hide={props.hide}>
        <div className="fill orient-vertical-box">
          <ReqDetail modal={modal} />
        </div>
        <div className="fill orient-vertical-box">
          <div className="w-detail-inspectors-title w-detail-inspectors-res">
            <span className="glyphicon glyphicon-arrow-left"></span>Response
          </div>
          <ResDetail modal={modal} />
        </div>
      </Divider>
    );
  }
});

module.exports = Inspector;
