var proxy = require('../lib/proxy');

module.exports = function(req, res) {
  res.json({
    ec: 0,
    frames: proxy.getFrames(req.query)
  });
};
