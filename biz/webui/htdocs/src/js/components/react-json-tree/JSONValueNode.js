'use strict';

exports.__esModule = true;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Renders simple values (eg. strings, numbers, booleans, etc)
 */

var JSONValueNode = function JSONValueNode(_ref) {
  var nodeType = _ref.nodeType,
    styling = _ref.styling,
    labelRenderer = _ref.labelRenderer,
    keyPath = _ref.keyPath,
    valueRenderer = _ref.valueRenderer,
    value = _ref.value,
    valueGetter = _ref.valueGetter;
  return _react2['default'].createElement(
    'li',
    styling('value', nodeType, keyPath),
    _react2['default'].createElement(
      'label',
      (0, _extends3['default'])(
        {},
        styling(['label', 'valueLabel'], nodeType, keyPath),
        {
          'data-key-path': (0, _stringify2['default'])(keyPath)
        }
      ),
      labelRenderer(keyPath, nodeType, false, false)
    ),
    _react2['default'].createElement(
      'span',
      styling('valueText', nodeType, keyPath),
      valueRenderer.apply(
        undefined,
        [valueGetter(value), value].concat(keyPath)
      )
    )
  );
};

JSONValueNode.defaultProps = {
  valueGetter: function valueGetter(value) {
    return value;
  }
};

exports['default'] = JSONValueNode;
