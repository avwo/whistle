var React = require('react');

module.exports = React.createClass({
  render: function() {
    return (
      <div className={'w-h5-tab-ctn ' + this.props.className}>
        <div className='w-h5-menu-bar'>
          <div className="w-h5-select">
            Default
            <span className="glyphicon glyphicon-chevron-down" />
          </div>
          <span className="glyphicon glyphicon-save-file">Save</span>
          <span className="glyphicon glyphicon-transfer">Rename</span>
          <span className="glyphicon glyphicon-trash">Delete</span>
          <span className="glyphicon glyphicon-cog" />
        </div>
      </div>
    );
  }
});
