var React = require('react');
var events = require('./events');
var EnableHttpsBtn = require('./enable-https-btn');
var util = require('./util');


var Tips = React.createClass({
  showFrames: function() {
    var data = this.props.data || {};
    events.trigger('showFrames' + (data.inComposer ? 'InComposer' : ''));
  },
  render: function () {
    var props = this.props;
    var className = props.className || '';
    var data = props.data || { hide: true };
    className = 'w-textview-tips' + (data.hide ? ' hide' : '') + ' ' + className;
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
        ) : undefined}
      </div>
    );
  }
});

module.exports = Tips;
