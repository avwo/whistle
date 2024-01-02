var util = require('../util');

module.exports = function (err, req, res, _) {
  res.response(util.wrapGatewayError(util.getErrorStack(err)));
};
