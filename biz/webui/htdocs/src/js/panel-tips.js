var React = require('react');
var EnableHttpsBtn = require('./enable-https-btn');
var util = require('./util');


var Tips = React.createClass({
  showFrames: function() {
    var data = this.props.data || {};
    util.trigger('showFrames' + (data.inComposer ? 'InComposer' : ''));
  },
  render: function () {
    var props = this.props;
    var className = props.className || '';
    var data = props.data || { hide: true };
    className = 'w-textview-tips' + util.getHide(data.hide) + ' ' + className;
    if (data.isFrames) {
      return (
        <a className={className} onClick={this.showFrames}>
          View Frames
        </a>
      );
    }
    if (data.isHttps) {
      return (
        <div className={className}>
          <p>
            {data.importedData ? null : <EnableHttpsBtn />}
            Tunnel
          </p>
          <a
            href={util.getDocUrl('gui/https.html')}
            target="_blank"
          >
            Click here for more information
          </a>
        </div>
      );
    }
    return (
      <div className={className}>
        <p>{data.message}</p>
        {data.url ? (
          <a href={data.url} target="_blank">
            Open the URL in new window
          </a>
        ) : null}
      </div>
    );
  }
});

module.exports = Tips;
