require('../css/list-dialog.css');
var React = require('react');
var Divider = require('./divider');
var util = require('./util');

var RuleList = React.createClass({
  getInitialState: function () {
    return { active: 'Default', checkedList: [] };
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onClick: function (e) {
    this.setState({
      active: e.target.getAttribute('data-name')
    });
  },
  onChange: function (e, line) {
    var checkedList = this.state.checkedList;
    var index = checkedList.indexOf(line);

    if (e.target.checked) {
      if (index === -1) {
        checkedList.push(line);
      }
    } else if (index !== -1) {
      checkedList.splice(index, 1);
    }
    this.setState({ checkedList: checkedList });
    this.props.onChange(checkedList);
  },
  render: function () {
    var self = this;
    var props = self.props;
    var state = self.state;
    var active = state.active;
    var modal = props.modal;
    var checkedList = state.checkedList;
    var list = modal.list;
    var activeItem = modal.map[active];
    if (!activeItem) {
      active = list[0];
      activeItem = modal.map[active];
    }

    return (
      <Divider leftWidth="220" className={props.hide ? ' hide' : ''}>
        <div className="w-list-data w-rule-list-name">
        {list.map(function (item) {
          if (util.isGroup(item.name)) {
            return null;
          }
          var count = 0;
          item.checked = false;
          item.rules.forEach(function(r) {
            if (checkedList.indexOf(r.join(' ')) !== -1) {
              count++;
              item.checked = true;
            }
          });
          return (
            <a
              tabIndex="0"
              key={item.name}
              draggable="false"
              data-name={item.name}
              className={(active === item.name ? 'w-active' : '') + (count ? ' w-bold' : '')}
              onClick={self.onClick}
            >{item.name + (count ? ' (' + count + ')' : '')}</a>
          );
        })}
        </div>
        <div className="fill w-rule-list-ctn">
          {activeItem && activeItem.rules.map(function (rule) {
            var line = rule.join(' ');
            var checked = checkedList.indexOf(line) !== -1;

            return (
              <label key={line} className={'w-rule-list-item' + (checked ? ' w-bold' : '')}>
                <span><input type="checkbox" checked={checked} onChange={function(e) {
                  self.onChange(e, line, rule, activeItem.rawValues);
                }} /></span>
                <div>
                  {rule.map(function (r, i) {
                    return <span key={i}>{r}</span>;
                  })}
                </div>
              </label>
            );
          })}
        </div>
      </Divider>
    );
  }
});

module.exports = RuleList;
