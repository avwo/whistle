var fs = require('fs');
var path = require('path');
var installer = null;

function getInstaller() {
	if (installer) {
		return installer;
	}
	var npm, dirnames, i, len, options;

	try {
		npm = require('npm');
	} catch (err) {}

	if (!npm && process.platform === 'win32') {
		dirnames = process.env['PATH'];
		dirnames = dirnames ? dirnames.split(';') : [];

		for (i = 0, len = dirnames.length; i < len; ++i) {
			if (fs.existsSync(path.join(dirnames[i], 'npm.cmd'))) {
				try {
					npm = require(path.join(dirnames[i],
						'node_modules/npm'));
					break;
				} catch (err) {}
			}
		}
	}

	if (npm) {
		options = {
			loglevel: 'silent',
			tmp: './tmp',
			global: true,
			prefix: path.join(__dirname, '../')
		};

		if (process.platform === 'win32') {
			options.cache = path.join(
				process.env['APPDATA'] || '.', 'npm-cache');
		} else {
			options.cache = path.join(
				process.env['HOME'] || '.', '.npm');
		}

		installer = function (id, callback) {
			npm.load(options, function (err, npm) {
				if (err) {
					callback(err);
				} else {
					npm.commands.install(Array.isArray(id) ? id : [ id ], callback);
				}
			});
		};
	} else {
		installer = function (id, callback) {
			callback(new Error('NPM not found, please install ' + id + ' manually.'));
		};
	}
	
	return installer;
};

module.exports = function () {
	getInstaller().apply(this, arguments);
};
