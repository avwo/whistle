var proxy = require('../lib/proxy');

var emptyArr = [];
var parseArray = function(str) {
  try {
    str = JSON.parse(str);
    return Array.isArray(str) ? str : emptyArr;
  } catch(e) {}
  return emptyArr;
};

module.exports = function(req, res) {
  var reqList = parseArray(req.query.reqList);
  var resList = parseArray(req.query.resList);
  var result = {};
  reqList.concat(resList).forEach(function(id) {
    if (result[id] != null) {
      return;
    }
    var item = proxy.getItem(id);
    if (!item) {
      result[id] = 0;
      return;
    }
    if ((item.requestTime && reqList.indexOf(id) !== -1) || item.endTime) {
      result[id] = item;
    }
  });
  res.json(result);
};
