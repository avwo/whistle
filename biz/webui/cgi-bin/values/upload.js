
module.exports = function(req, res) {
  var body = req.body;
  console.log(body);
  res.json({ec: 0, em: 'success'});
};
