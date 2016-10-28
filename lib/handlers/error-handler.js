var util = require('../util');

module.exports = function(err, req, res, next) {
  res.response(util.wrapGatewayError(util.getErrorStack(err)));
};
