require('./base-css.js');
require('../css/props-editor.css');
var React = require('react');

var PropsEditor = React.createClass({

  render: function() {
    var props = this.props;
    return (
      <div className={'fill orient-vertical-box w-props-editor' + (props.hide ? ' hide' : '')}>
        <table className="table" cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <th>Hello</th>
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
