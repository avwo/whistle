var React = require('react');
var Divider = require('./divider');
var ReqDetail = require('./req-detail');
var ResDetail = require('./res-detail');
var util = require('./util');
var Icon = require('./icon');

var Inspector = React.createClass({
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBool(this.props.hide);
    if (hide != util.getBool(nextProps.hide)) {
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
    return !this.endTime || this.refs.divider._needReset;
  },
  render: function () {
    var props = this.props;
    var modal = props.modal;
    this.endTime = modal && (modal.endTime || modal.lost);
    return (
      <Divider ref="divider" vertical="true" hide={props.hide}>
        <div className="fill v-box">
          <ReqDetail modal={modal} />
        </div>
        <div className="fill v-box">
          <div className="w-detail-inspectors-title w-detail-inspectors-res">
            <Icon name="arrow-left" />Response
          </div>
          <ResDetail modal={modal} />
        </div>
      </Divider>
    );
  }
});

module.exports = Inspector;
