var React = require('react');
var events = require('./events');

var INNER_URL_RE = /^(Network|Rules|Values|Plugins|whistle\.[a-z\d_\-]+\/)/;

function showNetwork() {
  events.trigger('showNetwork');
}

function showRules() {
  events.trigger('showRules');
}

function showValues() {
  events.trigger('showValues');
}

function showPlugins() {
  events.trigger('showPlugins');
}
// TODO: 只有插件页面才能通过 tab 打开，插件如果 disable 或 未安装提醒用户手动安装
var Card = React.createClass({
  onEdit: function() {
    this.props.onEdit(this.props.data);
  },
  onOpen: function() {
    var data = this.props.data;
    var url = data.url;
    switch (url) {
    case 'Network':
      return showNetwork();
    case 'Rules':
      return showRules();
    case 'Values':
      return showValues();
    case 'Plugins':
      return showPlugins();
    }
    if (INNER_URL_RE.test(url)) {
      return this.props.onOpen(data);
    }
    window.open(url);
  },
  renderButton: function(btn) {
    return btn && (
      <a onClick={function() {
        var data = this.props.data;
        if (typeof data.onClickButton === 'function') {
          this.data.onClickButton(btn);
        }
      }}>
        {btn.name}
      </a>
    );
  },
  render: function() {
    var data = this.props.data;
    var onEdit = this.props.onEdit;
    return (
      <div className="w-card">
        <div className="w-card-wrapper">
          {data.img ? <img src={data.img} /> : (data.icon || null)}
          <div className="w-card-ctn">
            <div className="w-card-name">
              {data.name}
            </div>
            <div className="w-card-desc">
              {data.desc}
            </div>
          </div>
        </div>
        <div className="w-card-footer">
          {onEdit ? <a onClick={this.onEdit} className="w-card-edit">
            <span className="glyphicon glyphicon-edit" />
            Edit
          </a> : null}
          <a onClick={this.onOpen}>
            <span className={'glyphicon glyphicon' + (INNER_URL_RE.test(data.url) ? '-folder-open' : '-new-window')} />
            Open
          </a>
        </div>
      </div>
    );
  }
});

module.exports = Card;
