require('./base-css.js');
require('../css/props-editor.css');
var React = require('react');

var PropsEditor = React.createClass({
  getInitialState: function() {
    return {};
  },
  clear: function() {
    
  },
  render: function() {
    var props = this.props;
    return (
      <div className={'fill orient-vertical-box w-props-editor' + (props.hide ? ' hide' : '')}>
        <table className="table">
          <tbody>
            <tr>
              <th>WorldWorld World World World World World World World World World World 
              World World World World World World World World World World World World 
              World World World World World World World World World World World World 
              World World World World World World World World World World World World 
              World World World World World World World World World World World World 
              World World World World World World World World World World World World 
              World World World World World World World World World World World World</th>
              <td>
                <pre>
                  WorldWorld World World World World World World World World World World 
                  World World World World World World World World World World World World 
                  World World World World World World World World World World World World 
                  World World World World World World World World World World World World 
                  World World World World World World World World World World World World 
                  World World World World World World World World World World World World 
                  World World World World World World World World World World World World 
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;" title="Delete"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;" title="Edit"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
            <tr>
              <th>Hello</th>
              <td>
                <pre>
                  World
                </pre>
              </td>
              <td className="w-props-ops">
                <a className="glyphicon glyphicon-remove" href="javascript:;"></a>
                <a className="glyphicon glyphicon-edit" href="javascript:;"></a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
});

module.exports = PropsEditor;
