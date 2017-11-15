var events = require('../../lib/events');

module.exports = function(req, res) {
  var body = req.body;
  var cId = body.cId;
  var data = body.data;
  if (cId && data) {
    events.emit('composer-' + cId, data, body.type === 'bin');
  }
  res.json({ec: 0});
};
