module.exports = function(req, res, next) {
  if (!req.isWebProtocol) {
    next();
    return;
  }
  req.request(req.options);
};
