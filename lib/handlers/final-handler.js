module.exports = function(req, res, next) {
  next(new Error('Unknown protocol ' + req.options.protocol));
};


