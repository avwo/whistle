var util = require('../lib/util');

module.exports = function(req, res) {
  var body = req.body;
  var filename = body.filename;
  if (!filename || typeof filename !== 'string') {
    filename = 'text_' + util.getDateString() + '.txt';
  } else if (!/\.\w+$/.test(filename)) {
    filename += '.txt';
  }
  res.attachment(filename).send(body.content);
};
