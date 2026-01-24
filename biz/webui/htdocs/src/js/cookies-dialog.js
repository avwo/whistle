var React = require('react');
var Dialog = require('./dialog');
var CloseBtn = require('./close-btn');

var CookiesDialog = React.createClass({
  getInitialState: function() {
    return { cookies: [] };
  },
  show: function (cookies) {
    this.refs.cookiesDialog.show();
    this._hideDialog = false;
    this.setState({ cookies: cookies || [] });
  },
  hide: function () {
    this.refs.cookiesDialog.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  insert: function (e) {
    var i = e.target.getAttribute('data-index');
    var cookie = this.state.cookies[i];
    cookie && this.props.onInsert(cookie, true);
    this.hide();
  },
  render: function () {
    var self = this;
    var cookies = self.state.cookies;
    return (
      <Dialog ref="cookiesDialog" wstyle="w-com-cookies-dialog">
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
          <button
            type="button"
            className="btn btn-default"
            onClick={self.hide}
          >
            Close
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = CookiesDialog;
