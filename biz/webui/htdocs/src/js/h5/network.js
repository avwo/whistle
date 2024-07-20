var React = require('react');

module.exports = React.createClass({
  render: function() {
    return (
      <div className={'w-h5-tab-ctn ' + this.props.className}>
        <div className='w-h5-menu-bar'>
          <span className="glyphicon glyphicon-stop w-record">Record</span>
          <span className="glyphicon glyphicon-remove">Clear</span>
          <span className="glyphicon glyphicon-cog" />
        </div>
        <ul className='w-h5-list w-h5-network-list'>
          {
            '1'.repeat(200).split('').map(function(_, i) {
              return (
                <li>
                  <div className="w-h5-order">{i + 1}</div>
                  <div className="w-h5-status">-</div>
                  <div className="w-h5-method">GET</div>
                  <div className="w-h5-url">https://local.whistlejs.com/h5.html</div>
                </li>
              );
            })
          }
        </ul>
      </div>
    );
  }
});
