var bodyParser = require('body-parser');

exports.addCommonMW = function(app) {
	app.use(function(req, res, next) {
		req.on('error', abort).on('close', abort);
		res.on('error', abort);
		function abort(err) {
			res.destroy();
		}
		next();
	});
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	return app;
};