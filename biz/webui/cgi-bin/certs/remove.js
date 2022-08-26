var ca = require('../../../../lib/https/ca');


module.exports = function(req, res) {
  ca.removeCert(req.body);
  var isparsed = req.query.dataType === 'parsed';
  res.json(isparsed ? ca.getCustomCertsInfo() : ca.getCustomCertsFiles());
};
