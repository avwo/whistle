require('../css/filter-input.css');
var util = require('./util');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var $ = require('jquery');
var storage = require('./storage');
var win = require('./win');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');

var isFunc = util.isFunc;
var preventBlur = util.preventBlur;
var MAX_LEN = 128;
var TYPES = ['JSON', 'HTML', 'CSS', 'JS', 'Font', 'Img', 'Media', 'WS', 'Tunnel', 'Wasm', 'Mock', 'Rules', 'Import', 'Composer', 'Error', 'Other'];
var getTitle = function (type) {
  return 'Show only ' + type.toLowerCase() + ' requests';
};
var TITLES = {
  JS: getTitle('JavaScript'),
  Img: getTitle('Image'),
  WS: getTitle('WebSocket'),
  Wasm: getTitle('WebAssembly'),
  Import: 'Show import sessions',
  Rules: 'Show requests matching the rules'
};

TYPES.forEach(function (type) {
  TITLES[type] = TITLES[type] || getTitle(type);
});

var FilterInput = React.createClass({
  getInitialState: function () {
    var self = this;
    var hintKey = self.props.hintKey;
    self.allHintList = [];
    if (hintKey) {
      try {
        var hintList = JSON.parse(storage.get(hintKey));
        if (Array.isArray(hintList)) {
          var map = {};
          self.allHintList = hintList
            .map(function (key) {
              return util.isStr(key) ? key.substring(0, MAX_LEN) : null;
            })
            .filter(function (key) {
              if (!key || map[key]) {
                return false;
              }
              map[key] = 1;
              return true;
            })
            .slice(0, MAX_LEN);
        }
      } catch (e) {}
    }
    return { hintList: [], filterType: '' };
  },
  componentDidMount: function () {
    var self = this;
    self.hintElem = $(findDOMNode(self.refs.hints));
    $(document.body).on('mousedown', function(e) {
      if (self.state.hintList !== null && !$(e.target).closest('.w-filter-con').length) {
        self.hideHints();
      }
    });
    var onFilterTypeChange = self.props.onFilterTypeChange;
    if (isFunc(onFilterTypeChange)) {
      onFilterTypeChange(self.state.filterType);
    }
  },
  focus: function() {
    var input = findDOMNode(this.refs.input);
    input.select();
    input.focus();
  },
  addHint: function () {
    var self = this;
    var value = self.state.filterText;
    value = value && value.trim();
    if (value) {
      var list = self.allHintList;
      var index = list.indexOf(value);
      if (index !== -1) {
        list.splice(index, 1);
      }
      if (list.length > MAX_LEN) {
        list.splice(0, 1);
      }
      list.push(value);
      try {
        storage.set(self.props.hintKey, JSON.stringify(list));
      } catch (e) {}
    }
  },
  filterHints: function (keyword) {
    keyword = util.trimStr(keyword);
    var count = 10;
    var self = this;
    var addonHints = self.props.addonHints || [];
    if (!keyword) {
      return addonHints.concat(self.allHintList.slice(-count));
    }
    addonHints = addonHints.slice(1);
    count += addonHints.length;
    var allHintList = addonHints.concat(self.allHintList);
    var list = [];
    var lk = keyword.toLowerCase();
    var notColon = keyword.indexOf(':') === -1;
    for (var i = allHintList.length - 1; i >= 0; i--) {
      var key = allHintList[i];
      if (key !== keyword && key.toLowerCase().indexOf(lk) !== -1 &&
      (addonHints.indexOf(key) === -1 || notColon)) {
        list.unshift(key);
        if (list.length >= count) {
          return list;
        }
      }
    }
    return list;
  },
  onFilterChange: function (e) {
    this.changeInput(e ? e.target.value : '');
  },
  changeInput: function (value) {
    var self = this;
    var props = self.props;
    props.onChange && props.onChange(value);
    var hintKey = props.hintKey;
    hintKey && clearTimeout(self.timer);
    self.state.filterText = value;
    self.setState({ hintList: self.filterHints(value) }, function () {
      if (hintKey) {
        self.timer = setTimeout(self.addHint, 10000);
      }
    });
  },
  onClick: function (e) {
    this.changeInput(e.target.title);
    this.hideHints();
  },
  hideHints: function () {
    this.setState({ hintList: null });
    this.addHint();
  },
  showHints: function (e) {
    var self = this;
    if (!self.props.hintKey) {
      return;
    }
    self.setState({ hintList: self.filterHints(self.state.filterText) }, e && function() {
      self.hintElem.scrollTop(1000000000);
    });
    var top = findDOMNode(self.refs.input).getBoundingClientRect().y - 130;
    findDOMNode(self.refs.hints).style.setProperty('--h-hints', Math.max(Math.min(top, 360), 200) + 'px');
  },
  onFilterKeyDown: function (e) {
    var elem;
    var self = this;
    var state = self.state;
    if (e.keyCode === 27) {
      var hintList = state.hintList;
      if (hintList === null) {
        self.showHints();
      } else {
        self.hideHints();
      }
    } else if (e.keyCode === 38) {
      // up
      elem = self.hintElem.find('.w-active');
      if (state.hintList === null) {
        self.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.prev('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = self.hintElem.find('li:last');
        elem.addClass('w-active');
      }
      util.ensureVisible(elem, self.hintElem);
      e.preventDefault();
    } else if (e.keyCode === 40) {
      // down
      elem = self.hintElem.find('.w-active');
      if (state.hintList === null) {
        self.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.next('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = self.hintElem.find('li:first');
        elem.addClass('w-active');
      }
      util.ensureVisible(elem, self.hintElem);
      e.preventDefault();
    } else if (e.keyCode === 13) {
      elem = self.hintElem.find('.w-active');
      var value = elem.attr('title');
      if (value) {
        self.changeInput(value);
        self.hideHints();
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (e.keyCode == 68) {
        self.clearFilterText();
        util.preventAll(e);
      } else if (e.keyCode == 88) {
        e.stopPropagation();
      }
    }
    if (isFunc(self.props.onKeyDown)) {
      self.props.onKeyDown(e);
    }
  },
  clear: function () {
    var self = this;
    win.confirm('Confirm to clear history?', function (sure) {
      if (sure) {
        storage.set(self.props.hintKey, '');
        self.allHintList = [];
        self.hideHints();
      }
    });
  },
  clearFilterText: function () {
    var self = this;
    self.props.onChange && self.props.onChange('');
    var hintList = null;
    if (document.activeElement === findDOMNode(self.refs.input)) {
      hintList = self.filterHints();
    }
    var hasChanged = self.state.filterText;
    self.setState({ filterText: '', hintList: hintList }, function() {
      if (hasChanged) {
        self.onFilterChange();
      }
    });
  },
  handleFilterType: function (e) {
    var target = e.target;
    if (target.nodeName !== 'SPAN') {
      return;
    }
    var type = target.textContent;
    var self = this;
    var filterType = type === 'All' ? '' : type;
    if (filterType === self.state.filterType) {
      return;
    }
    self.setState({ filterType: filterType });
    self.props.onFilterTypeChange(filterType);
  },
  renderTypes: function () {
    var filterType = this.state.filterType;
    if (TYPES.indexOf(filterType) === -1) {
      filterType = '';
    }
    return (
      <div className="w-filter-type-bar" onClick={this.handleFilterType} onMouseDown={preventBlur}>
        <span className={filterType ? null : 'w-active'}>All</span>
        {TYPES.map(function (type) {
          return <span key={type} title={TITLES[type] || type} className={filterType === type ? 'w-active' : null}>{type}</span>;
        })}
      </div>
    );
  },
  render: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    var filterText = state.filterText || '';
    var hintKey = props.hintKey;
    var hintList = state.hintList;
    var addonHints = props.addonHints || [];
    var showTypes = isFunc(props.onFilterTypeChange);

    return (
      <div className={'w-filter-con' + (showTypes ? ' w-filter-show-types' : '')} style={props.wStyle}>
        {hintKey ? (
          <div
            className="w-filter-hint"
            style={util.getHideStyle(!(hintList && hintList.length))}
            onMouseDown={preventBlur}
          >
            <div className="w-filter-bar">
              <a onClick={self.clear}>
                <Icon name="remove" />
                Clear history
              </a>
              <CloseBtn onClick={self.hideHints} />
            </div>
            <ul ref="hints">
              {hintList &&
                hintList.map(function (key) {
                  var title = key;
                  if (addonHints.indexOf(key) !== -1) {
                    title = key.substring(0, key.indexOf(':') + 1);
                  }
                  return (
                    <li key={key} onClick={self.onClick} title={title}>
                      {key}
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : null}
        {showTypes ? self.renderTypes() : null}
        <input
          type="text"
          ref="input"
          value={filterText}
          onChange={self.onFilterChange}
          onKeyDown={self.onFilterKeyDown}
          onFocus={self.showHints}
          onDoubleClick={self.showHints}
          onBlur={self.hideHints}
          className="w-filter-input"
          maxLength={MAX_LEN}
          placeholder={'Type filter text' + (props.placeholder || '')}
        />
        <button
          onMouseDown={preventBlur}
          onClick={self.clearFilterText}
          style={{ display: state.filterText ? 'block' : 'none' }}
          type="button"
          className="close w-clear-input"
          title="Ctrl[Command]+D"
        >&times;</button>
      </div>
    );
  }
});

module.exports = FilterInput;
