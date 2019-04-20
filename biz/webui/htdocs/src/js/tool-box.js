var React = require('react');

var ToolBox = React.createClass({

  render: function() {
    return (
      <div className={'fill orient-vertical-box w-tool-box ' + (this.props.hide ? 'hide' : '')}>
        <div className="w-detail-inspectors-title" style={{borderTop: 'none'}}>
          QRCode
          <button className="btn btn-primary">Generate</button>
        </div>
        <textarea className="w-tool-box-ctn" maxLength="2048" placeholder="Input the URL" />
        <div className="w-detail-inspectors-title">
          JSONView
          <button className="btn btn-primary">Parse</button>
        </div>
        <textarea className="w-tool-box-ctn" maxLength="32768" placeholder="Input the JSON text" />
        <div className="w-detail-inspectors-title">
          Base64
        </div>
        <button className="w-tool-box-ctn w-tool-box-base64">
          <span className="glyphicon glyphicon-arrow-up"></span>
          Click here to upload image
        </button>
      </div>
    );
  }
});

module.exports = ToolBox;
