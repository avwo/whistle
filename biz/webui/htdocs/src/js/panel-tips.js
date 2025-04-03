var React = require('react');
var events = require('./events');
var EnableHttpsBtn = require('./enable-https-btn');


function showFrames() {
  events.trigger('showFrames');
}

var Tips = React.createClass({
  render: function () {
    var data = this.props.data || { hide: true };
    var className = 'w-textview-tips' + (data.hide ? ' hide' : '');
    if (data.isFrames) {
      return (
        <a className={className} onClick={showFrames}>
          View Frames
        </a>
      );
    }
    if (data.isHttps) {
      return (
        <div className={className}>
          <p>
            <EnableHttpsBtn />
            Tunnel
          </p>
          <a
            href="https://avwo.github.io/whistle/webui/https.html"
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
            Open the URL in a new window
          </a>
        ) : undefined}
      </div>
    );
  }
});

module.exports = Tips;
