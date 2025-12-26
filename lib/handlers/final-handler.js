module.exports = function (req, res, next) {
  next(new Error('Unsupported protocol ' + req.options.protocol));
};
