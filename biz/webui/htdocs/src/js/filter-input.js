require('./base-css.js');
require('../css/filter-input.css');
var util = require('./util');
var React = require('react');
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
    let count = 12;
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
    var value = e.target.value;
    var self = this;
    self.props.onChange && self.props.onChange(value);
    var hintKey = self.props.hintKey;
    hintKey && clearTimeout(self.timer);
    self.setState({filterText: value, hintList: this.filterHints(value) }, function() {
      if (hintKey) {
        self.timer = setTimeout(this.addHint, 10000);
      }
    });
  },
  hideHints: function() {
    this.setState({ hintList: null });
    this.addHint();
  },
  showHints: function() {
    this.setState({ hintList: this.filterHints(this.state.filterText) });
  },
  onFilterKeyDown: function(e) {
    if (e.keyCode === 27) {
      var hintList = this.state.hintList;
      if (hintList === null) {
        this.showHints();
      } else {
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
  clearFilterText: function() {
    this.props.onChange && this.props.onChange('');
    this.setState({filterText: '', hintList: this.filterHints()});
  },
  render: function() {
    var filterText = this.state.filterText || '';
    var hintKey = this.props.hintKey;
    var hintList = this.state.hintList;
    return (
        <div className="w-filter-con" style={this.props.wStyle}>
          {hintKey ? <div className="w-filter-hint" style={{ display: hintList && hintList.length ? '' : 'none' }} onMouseDown={util.preventBlur}>
            <div className="w-filter-bar">
              <span onClick={this.hideHints} aria-hidden="true">&times;</span>
            </div>
            <ul>
              {
                hintList && hintList.map(function(key) {
                  return <li title={key}>{key}</li>;
                })
              }
            </ul>
          </div> : undefined}
          <input type="text" value={filterText}
            onChange={this.onFilterChange}
            onKeyDown={this.onFilterKeyDown}
            onFocus={this.showHints}
            onBlur={this.hideHints}
            style={{background: filterText.trim() ? '#000' : undefined}}
            className="w-filter-input" maxLength={MAX_LEN} placeholder="type filter text" />
          <button onMouseDown={util.preventBlur}
            onClick={this.clearFilterText}
            style={{display: this.state.filterText ? 'block' :  'none'}} type="button" className="close" title="Ctrl[Command]+D"><span aria-hidden="true">&times;</span></button>
        </div>
    );
  }
});

module.exports = FilterInput;
