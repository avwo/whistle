var app = require('express')();

require('../util').addCommonMW(app);

app.use(function(req, res, next) {
	res.end('Hello world!!!!!')
});

app.listen(parseInt(process.argv[2], 10), 'localhost');