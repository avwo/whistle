var React = require('react');

module.exports = React.createClass({
  render: function() {
    return (
      <div className={'w-h5-tab-ctn ' + this.props.className}>
         <div className='w-h5-menu-bar'>
          <span className="glyphicon glyphicon-info-sign">Info</span>
          <span className="glyphicon glyphicon-cog" />
        </div>
        <div className='w-h5-list'>
          {/* <div className="w-h5-empty">
            <a>Empty</a>
          </div> */}
          <div className="w-h5-card">
            <label>
              <input type="checkbox" /><span>script 1.0.0</span>
            </label>
            <div className="w-h5-desc">
            (use "git push" to publish your local commits)
            </div>
            <a>Option</a>
            <a className="w-h5-card-rules">Rules</a>
            <a>Help</a>
          </div>
          <div className="w-h5-card">
            <label>
              <input type="checkbox" /><span>inspect 1.0.0</span>
            </label>
            <div className="w-h5-desc">
            (use "git push" to publish your local commits)
            </div>
            <a>Option</a>
            <a className="w-h5-card-rules">Rules</a>
            <a>Help</a>
          </div>
          <div className="w-h5-card">
            <label>
              <input type="checkbox" /><span>inspect 1.0.0</span>
            </label>
            <div className="w-h5-desc">
            (use "git push" to publish your local commits)
            </div>
            <a>Option</a>
            <a className="w-h5-card-rules">Rules</a>
            <a>Help</a>
          </div>
          <div className="w-h5-card">
            <label>
              <input type="checkbox" /><span>inspect 1.0.0</span>
            </label>
            <div className="w-h5-desc">
            (use "git push" to publish your local commits)
            </div>
            <a>Option</a>
            <a className="w-h5-card-rules">Rules</a>
            <a>Help</a>
          </div>
          <div className="w-h5-card">
            <label>
              <input type="checkbox" /><span>inspect 1.0.0</span>
            </label>
            <div className="w-h5-desc">
            (use "git push" to publish your local commits)
            </div>
            <a>Option</a>
            <a className="w-h5-card-rules">Rules</a>
            <a>Help</a>
          </div>
          <div className="w-h5-card">
            <label>
              <input type="checkbox" /><span>inspect 1.0.0</span>
            </label>
            <div className="w-h5-desc">
            (use "git push" to publish your local commits)
            </div>
            <a>Option</a>
            <a className="w-h5-card-rules">Rules</a>
            <a>Help</a>
          </div>
          <div className="w-h5-card">
            <label>
              <input type="checkbox" /><span>inspect 1.0.0</span>
            </label>
            <div className="w-h5-desc">
            (use "git push" to publish your local commits)
            </div>
            <a>Option</a>
            <a className="w-h5-card-rules">Rules</a>
            <a>Help</a>
          </div>
          <div className="w-h5-card">
            <label>
              <input type="checkbox" /><span>inspect 1.0.0</span>
            </label>
            <div className="w-h5-desc">
            (use "git push" to publish your local commits)
            (use "git push" to publish your local commits)
            (use "git push" to publish your local commits)
            (use "git push" to publish your local commits)
            (use "git push" to publish your local commits)
            </div>
            <a>Option</a>
            <a className="w-h5-card-rules">Rules</a>
            <a>Help</a>
          </div>
        </div>
      </div>
    );
  }
});
