var util = require('./util');

module.exports = {
  shouldComponentUpdate: util.scu,
  onClickBtn: function (btn) {
    this.selectBtn(btn);
    this.setState({});
  },
  selectBtn: function (btn) {
    btn.active = true;
    this.state.btn = btn;
    this.state['inited' + btn.name] = true;
  },
  setupPluginsTab: function(tabs, pluginsTab, len) {
    var isReq = len == null;
    len = isReq ? tabs.length : len;
    pluginsTab.hide = !len;
    if (len && len === 1) {
      pluginsTab.display = pluginsTab.title = tabs[0].name;
      pluginsTab.className = 'w-detail-custom-tab' + (isReq ? ' w-req' : '');
    } else {
      pluginsTab.display = pluginsTab.title = pluginsTab.className = undefined;
    }
  }
};
