module.exports = function (req, res, next) {
  if (req.isWebProtocol) {
    req.request(req.options);
  } else {
    next();
  }
};
