require('../css/image-view.css');
var React = require('react');
var util = require('./util');

var isClient = util.getQuery().mode === 'client';
var hasWebView = function() {
  return isClient && window.WebView && window.WebView.name === 'WebViewElement';
};

var ImageView = React.createClass({
  shouldComponentUpdate: util.scu,
  preview: function () {
    util.openPreview(this.props.data);
  },
  getPreviewUrl: function() {
    var self = this;
    var data = hasWebView() && self.props.data;
    if (!data || !data.res.base64) {
      return;
    }
    if (self._curData !== data) {
      self._curData = data;
      self._previewUrl = util.getPreviewUrl(data);
    }
    return self._previewUrl;
  },
  getPreviewElem: function(previewUrl) {
    if (previewUrl) {
      return <webview src={previewUrl} className="fill" />;
    }
    var props = this.props;
    if (props.imgSrc) {
      return <img src={props.imgSrc} />;
    }
    if (props.data) {
      return <a className="w-image-link" onClick={this.preview}>Preview page in new window</a>;
    }
  },
  render: function () {
    var self = this;
    var props = self.props;
    var imgSrc = props.imgSrc;
    var previewUrl = !imgSrc && self.getPreviewUrl(props.data);

    return (
      <div
        className={'fill w-image-view' + (previewUrl ? ' w-image-webview' : '') +
          util.getHide(props.hide) + (imgSrc ? ' w-image-bg' : '')}
      >
        {previewUrl || imgSrc ? <div className="w-bar">
          <a onClick={self.preview}>Open in new window</a>
        </div> : null}
        {self.getPreviewElem(previewUrl)}
      </div>
    );
  }
});

module.exports = ImageView;
