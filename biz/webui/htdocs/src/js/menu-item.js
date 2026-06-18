require('../css/menu-item.css');
var React = require('react');
var util = require('./util');
var GitHubIcon = require('./github-icon');
var Icon = require('./icon');

var MenuItem = React.createClass({
  preventBlur: function (e) {
    e.preventDefault();
  },
  stopPropagation: function (e) {
    e.stopPropagation();
  },
  render: function () {
    var self = this;
    var props = self.props;
    var options = props.options;
    if (options && !options.length) {
      options = null;
    }
    var name = props.name;
    var onClick = props.onClick || util.noop;
    var onClickOption = props.onClickOption || util.noop;
    var onDoubleClickOption = props.onDoubleClickOption || util.noop;
    var checkedOptions = props.checkedOptions || {};
    var disabled = props.disabled;

    return (
      <div
        onBlur={props.onBlur}
        tabIndex="0"
        onMouseDown={self.preventBlur}
        style={{ display: util.getBool(props.hide) ? 'none' : 'block' }}
        className={
          'w-menu-item ' +
          (props.className || '') +
          (disabled ? ' w-disabled' : '')
        }
      >
        {options ? (
          <div
            className="w-menu-options"
            style={{ border: name ? null : 'none' }}
          >
            {options.map(function (option) {
              return (
                <a
                  key={option.name}
                  className={option.disabled ? 'w-disabled' : undefined}
                  title={option.title}
                  onClick={function (e) {
                    if (option.disabled) {
                      return;
                    }
                    onClickOption(option, e);
                  }}
                  onDoubleClick={function () {
                    onDoubleClickOption(option);
                  }}
                  href={option.href || undefined}
                  target={option.href ? option.target || '_blank' : undefined}
                  draggable="false"
                >
                  {option.icon == 'checkbox' ? (
                    <input
                      type="checkbox"
                      disabled={disabled}
                      data-name={option.name}
                      onClick={self.stopPropagation}
                      onChange={props.onChange}
                      checked={!checkedOptions[option.name]}
                    />
                  ) : option.icon === false ? undefined : (
                    option.icon === 'github' ? <GitHubIcon /> :
                    <Icon
                      name={option.icon || 'asterisk'}
                      className={option.icon ? '' : 'w-hidden'}
                    />
                  )}
                  {option.name}
                </a>
              );
            })}
          </div>
        ) : (
          ''
        )}
        {name ? (
          util.isStr(name) ? (
            <a onClick={onClick} className="w-menu-open" draggable="false">
              <Icon name={props.icon || 'folder-open'} />
              {name}
            </a>
          ) : (
            name
          )
        ) : (
          ''
        )}
      </div>
    );
  }
});

module.exports = MenuItem;
