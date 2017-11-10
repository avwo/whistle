var events = require('../../lib/events');

module.exports = function(req, res) {
  var cId = req.body.cId;
  var data = req.body.data;
  if (cId && data) {
    events.emit('composer-' + cId, data);
  }
  res.json({ec: 0});
};
