module.exports = function (req, res, next) {
  if (!req.isWebProtocol) {
    next();
  } else {
    req.request(req.options);
  }
};
