var util = require('../util');

module.exports = function (err, req, res) {
  res.response(util.wrapGatewayError(util.getErrorStack(err)));
};
