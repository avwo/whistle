var util = require('./util');

module.exports = function(req, res) {
  var body = req.body;
  var filename = body.filename;
  var isLog = body.type === 'log';
  var suffix = isLog ? '.log' : '.txt';
  if (!filename || typeof filename !== 'string') {
    filename = 'text_' + util.formatDate() + suffix;
  } else if (!/\.\w+$/.test(filename)) {
    filename += suffix;
  }
  res.attachment(filename).send(body.content);
};
