require('../css/menu-item.css');
var React = require('react');
var util = require('./util');
var GitHubIcon = require('./github-icon');
var Icon = require('./icon');

var noop = util.noop;

function stopPropagation(e) {
  e.stopPropagation();
}

var MenuItem = React.createClass({
  render: function () {
    var self = this;
    var props = self.props;
    var options = props.options;
    if (options && !options.length) {
      options = null;
    }
    var name = props.name;
    var onClick = props.onClick || noop;
    var onClickOption = props.onClickOption || noop;
    var onDoubleClickOption = props.onDoubleClickOption || noop;
    var checkedOptions = props.checkedOptions || {};
    var disabled = props.disabled;

    return (
      <div
        onBlur={props.onBlur}
        tabIndex="0"
        onMouseDown={util.preventBlur}
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
              var icon = option.icon;
              var name = option.name;
              var disabled = option.disabled;

              return (
                <a
                  key={name}
                  className={disabled ? 'w-disabled' : null}
                  title={option.title}
                  onClick={function (e) {
                    if (disabled) {
                      return;
                    }
                    onClickOption(option, e);
                  }}
                  onDoubleClick={function () {
                    onDoubleClickOption(option);
                  }}
                  href={option.href || null}
                  target={option.href ? option.target || '_blank' : null}
                  draggable="false"
                >
                  {icon == 'checkbox' ? (
                    <input
                      type="checkbox"
                      disabled={disabled}
                      data-name={name}
                      onClick={stopPropagation}
                      onChange={props.onChange}
                      checked={!checkedOptions[name]}
                    />
                  ) : icon === false ? null : (
                    icon === 'github' ? <GitHubIcon /> :
                    <Icon
                      name={icon || 'asterisk'}
                      className={icon ? '' : 'w-hidden'}
                    />
                  )}
                  {name}
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
