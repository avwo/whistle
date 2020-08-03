require('./base-css.js');
require('../css/menu-item.css');
var React = require('react');
var util = require('./util');

var MenuItem = React.createClass({
  preventBlur: function(e) {
    e.preventDefault();
  },
  stopPropagation: function(e) {
    e.stopPropagation();
  },
  render: function() {
    var self = this;
    var options = self.props.options;
    if (options && !options.length) {
      options = null;
    }
    var name = self.props.name;
    var onClick = self.props.onClick || util.noop;
    var onClickOption = self.props.onClickOption || util.noop;
    var onDoubleClickOption = self.props.onDoubleClickOption || util.noop;
    var checkedOptions = self.props.checkedOptions || {};
    var disabled = self.props.disabled;

    return (
      <div onBlur={self.props.onBlur} tabIndex="0" onMouseDown={self.preventBlur} style={{display: util.getBoolean(self.props.hide) ? 'none' : 'block'}} className={'w-menu-item ' + (self.props.className || '') + (disabled ? ' w-disabled' : '')}>
      {
          options ? <div className="w-menu-options" style={{border: name ? null : 'none'}}>{options.map(function(option) {

            return (
                <a key={option.name} className={option.disabled ? 'w-disabled' : undefined} title={option.title}
                onClick={function(e) {
                  if (option.disabled) {
                    return;
                  }
                  onClickOption(option, e);
                }}  onDoubleClick={function() {
                  onDoubleClickOption(option);
                }} href={option.href || undefined}
                  target={option.href ? (option.target || 'blank') : undefined}
                   draggable="false">
                  {option.icon == 'checkbox' ? <input type="checkbox" disabled={disabled} data-name={option.name} onClick={self.stopPropagation} onChange={self.props.onChange} checked={!checkedOptions[option.name]} />
                      : (option.icon === false ? undefined : <span className={'glyphicon glyphicon-' + (option.icon || 'asterisk')} style={{visibility: option.icon ? '' : 'hidden'}}></span>)}
                  {option.name}
                </a>
            );
          })}</div> : ''
      }
      {
        name ? (typeof name === 'string' ? <a onClick={onClick} className="w-menu-open" draggable="false">
          <span className='glyphicon glyphicon-folder-open'></span>{name}
        </a> : name) : ''
      }
      </div>
    );
  }
});

module.exports = MenuItem;
