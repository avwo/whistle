require('./base-css.js');
require('../css/filter-input.css');
var util = require('./util');
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var storage = require('./storage');

var MAX_LEN = 128;
var FilterInput = React.createClass({
  getInitialState: function() {
    var hintKey = this.props.hintKey;
    this.allHintList = [];
    if (hintKey) {
      try {
        var hintList = JSON.parse(storage.get(hintKey));
        if (Array.isArray(hintList)) {
          var map = {};
          this.allHintList = hintList.map(function(key) {
            return typeof key === 'string' ? key.substring(0, MAX_LEN) : null;
          }).filter(function(key) {
            if (!key || map[key]) {
              return false;
            }
            map[key] = 1;
            return true;
          }).slice(0, MAX_LEN);
        }
      } catch (e) {}
    }
    return { hintList: [] };
  },
  componentDidMount: function() {
    this.hintElem = $(ReactDOM.findDOMNode(this.refs.hints));
  },
  addHint: function() {
    var value = this.state.filterText;
    value = value && value.trim();
    if (value) {
      var list = this.allHintList;
      var index = list.indexOf(value);
      if (index !== -1) {
        list.splice(index, 1);
      }
      if (list.length > MAX_LEN) {
        list.splice(0, 1);
      }
      list.push(value);
      try {
        storage.set(this.props.hintKey, JSON.stringify(list));
      } catch (e) {}
    }
  },
  filterHints: function(keyword) {
    keyword = keyword && keyword.trim();
    var count = 12;
    if (!keyword) {
      return this.allHintList.slice(-count);
    }
    var list = [];
    var index = this.allHintList.indexOf(keyword);
    keyword = keyword.toLowerCase();
    for (var i = this.allHintList.length - 1; i >= 0; i--) {
      var key = this.allHintList[i];
      if (index !== i && key.toLowerCase().indexOf(keyword) !== -1) {
        list.unshift(key);
        if (list.length >= count) {
          return list;
        }
      }
    }
    return list;
  },
  onFilterChange: function(e) {
    this.changeInput(e.target.value);
  },
  changeInput: function(value) {
    var self = this;
    self.props.onChange && self.props.onChange(value);
    var hintKey = self.props.hintKey;
    hintKey && clearTimeout(self.timer);
    this.state.filterText = value;
    self.setState({ hintList: this.filterHints(value) }, function() {
      if (hintKey) {
        self.timer = setTimeout(this.addHint, 10000);
      }
    });
  },
  onClick: function(e) {
    this.changeInput(e.target.title);
    this.hideHints();
  },
  hideHints: function() {
    this.setState({ hintList: null });
    this.addHint();
  },
  showHints: function() {
    this.setState({ hintList: this.filterHints(this.state.filterText) });
  },
  onFilterKeyDown: function(e) {
    var elem;
    if (e.keyCode === 27) {
      var hintList = this.state.hintList;
      if (hintList === null) {
        this.showHints();
      } else {
        this.hideHints();
      }
    } else if (e.keyCode === 38) { // up
      elem = this.hintElem.find('.w-active');
      if (this.state.hintList === null) {
        this.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.prev('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = this.hintElem.find('li:last');
        elem.addClass('w-active');
      }
      e.preventDefault();
    } else if (e.keyCode === 40) { // down
      elem = this.hintElem.find('.w-active');
      if (this.state.hintList === null) {
        this.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.next('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = this.hintElem.find('li:first');
        elem.addClass('w-active');
      }
      e.preventDefault();
    } else if (e.keyCode === 13) {
      elem = this.hintElem.find('.w-active');
      var value = elem.attr('title');
      if (value) {
        this.changeInput(value);
        this.hideHints();
      }
    } else if ((e.ctrlKey || e.metaKey)) {
      if (e.keyCode == 68) {
        this.clearFilterText();
        e.preventDefault();
        e.stopPropagation();
      } else if (e.keyCode == 88) {
        e.stopPropagation();
      }
    }
    if (typeof this.props.onKeyDown === 'function') {
      this.props.onKeyDown(e);
    }

  },
  clear: function() {
    if (window.confirm('Confirm to clear history?')) {
      storage.set(this.props.hintKey, '');
      this.allHintList = [];
      this.hideHints();
    }
  },
  clearFilterText: function() {
    this.props.onChange && this.props.onChange('');
    this.setState({filterText: '', hintList: this.filterHints()});
  },
  render: function() {
    var self = this;
    var filterText = self.state.filterText || '';
    var hintKey = self.props.hintKey;
    var hintList = self.state.hintList;
    return (
        <div className="w-filter-con" style={self.props.wStyle}>
          {hintKey ? <div className="w-filter-hint" style={{ display: hintList && hintList.length ? '' : 'none' }} onMouseDown={util.preventBlur}>
            <div className="w-filter-bar">
              <a onClick={this.clear}>
                <span className="glyphicon glyphicon-trash"></span>
                Clear history
              </a>
              <span onClick={self.hideHints} aria-hidden="true">&times;</span>
            </div>
            <ul ref="hints">
              {
                hintList && hintList.map(function(key) {
                  return <li key={key} onClick={self.onClick} title={key}>{key}</li>;
                })
              }
            </ul>
          </div> : undefined}
          <input type="text" value={filterText}
            onChange={self.onFilterChange}
            onKeyDown={self.onFilterKeyDown}
            onFocus={self.showHints}
            onDoubleClick={self.showHints}
            onBlur={self.hideHints}
            style={{background: filterText.trim() ? '#000' : undefined}}
            className="w-filter-input" maxLength={MAX_LEN} placeholder="type filter text" />
          <button onMouseDown={util.preventBlur}
            onClick={self.clearFilterText}
            style={{display: self.state.filterText ? 'block' :  'none'}} type="button" className="close" title="Ctrl[Command]+D"><span aria-hidden="true">&times;</span></button>
        </div>
    );
  }
});

module.exports = FilterInput;
