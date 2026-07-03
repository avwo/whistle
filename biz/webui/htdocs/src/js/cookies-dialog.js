var React = require('react');
var Dialog = require('./dialog');
var CloseBtn = require('./close-btn');
var DismissBtn = require('./dismiss-btn');
var util = require('./util');

var CookiesDialog = React.createClass({
  getInitialState: function() {
    return { cookies: [] };
  },
  show: function (cookies) {
    this.refs.dialog.show();
    this.setState({ cookies: cookies || [] });
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  shouldComponentUpdate: util.scuDialog,
  insert: function (e) {
    var self = this;
    var i = util.attr(e.target, 'data-index');
    var cookie = self.state.cookies[i];
    cookie && self.props.onInsert(cookie, true);
    self.hide();
  },
  render: function () {
    var self = this;
    var cookies = self.state.cookies;
    return (
      <Dialog ref="dialog" wstyle="w-com-cookies-dialog">
        <div className="modal-body">
          <CloseBtn onClick={self.hide} />
          <table className="table">
            <thead>
              <th className="w-com-cookie-order">#</th>
              <th className="w-com-cookie-value">Cookie</th>
              <th className="w-com-cookie-operation">Operation</th>
            </thead>
            <tbody className="w-hover-body">
              {cookies.map(function (cookie, i) {
                return (
                  <tr>
                    <th className="w-com-cookie-order">{i + 1}</th>
                    <td className="w-com-cookie-value">
                      {cookie}
                    </td>
                    <td className="w-com-cookie-operation">
                      <a
                        className="w-copy-text-with-tips"
                        data-clipboard-text={cookie}
                      >
                        Copy
                      </a>
                      <a
                        data-index={i}
                        onClick={self.insert}
                      >
                        Insert
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <DismissBtn />
        </div>
      </Dialog>
    );
  }
});

module.exports = CookiesDialog;
