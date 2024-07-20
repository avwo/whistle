var storage = require('./storage');

var isClient = /[?&]mode=client&?$/.test(location.search);

function getPageName(options) {
  var hash = location.hash.substring(1);
  if (hash) {
    hash = hash.replace(/[?#].*$/, '');
  } else {
    hash = location.href.replace(/[?#].*$/, '').replace(/.*\//, '');
  }
  if (options.showAccount && hash === 'account') {
    return hash;
  }
  if (options.networkMode) {
    return 'network';
  }
  if (options.rulesMode && options.pluginsMode) {
    return 'plugins';
  }
  if (options.rulesOnlyMode) {
    return hash === 'values' ? 'values' : 'rules';
  }
  if (options.rulesMode) {
    return hash === 'network' ? 'rules' : hash;
  }

  if (options.pluginsMode) {
    return hash !== 'plugins' ? 'network' : hash;
  }
  if (isClient && !hash) {
    return storage.get('pageName') || 'network';
  }
  return hash;
}

exports.getPageName = getPageName;


function setPageName(name) {
  var hash = location.hash.substring(1);
  var index = hash.indexOf('?');
  hash = index === -1 ? '' : hash.substring(index);
  location.hash = name + hash;
}

exports.setPageName = setPageName;