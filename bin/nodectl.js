var cp = require('child_process'),
	fs = require('fs'),
	path = require('path'),
	util = require('util'),
	commonUtil = require('../util'),
	argvs = commonUtil.argvs,
	config = commonUtil.config;

var PATH_BOOTSTRAP = path.join(__dirname, 'bootstrap.js'),
	START_PATH = path.join(__dirname, '../init.js'),
	RUNNING_PATH = path.join(require('../util').LOCAL_DATA_PATH, '.running'),

	/**
	 * Check whether a node process is running.
	 * @param pid {string}
	 * @param callback {Function}
	 */
	isRunning = function (pid, callback) {
		if (pid) {
			var cmd = util.format(process.platform === 'win32' ?
					'tasklist /fi "PID eq %s" | findstr /i "node.exe"' :
					'ps -f -p %s | grep "node"', pid);

			cp.exec(cmd, function (err, stdout, stderr) {
				if (err) {
					callback(false);
				} else {
					callback(stdout.toString().trim() !== '');
				}
			});
		} else {
			callback(false);
		}
	},

	resolvePath = function(name) {
		return /^[\w-]+$/.test(name) ? name : path.resolve(name);
	},
	setArgs = function(options, args) {
		if (!options) {
			return {};
		}
		
		if (options.plugins) {
			options.plugins = options.plugins.
			split(',').map(function(plugin) {
				return resolvePath(plugin);
			}).join();
		}
		var pureOptions = {};
		for (var name in argvs) {
			if (options[name]) {
				if (argvs[name]) {
					options[name] = resolvePath(options[name]);
				}
				args.push('--' + name);
				args.push(options[name]);
				pureOptions[name] = options[name];
			}
		}
		
		return pureOptions;
	},
	/**
	 * Restart current background aeproxy.
	 * @param config {string}
	 */
	restart = exports.restart = function (_options) {
		stop(function (options) {
			setTimeout(function () {
				start(util._extend(options, _options));
			}, 1000);
		});
	},

	/**
	 * Start a front aeproxy.
	 * @param [config] {string}
	 */
	run = exports.run = function (options) {
		console.log('[i] Press [Ctrl+C] to stop ' + config.name + '.., port: ' + (options.port || config.port));
		var args = [PATH_BOOTSTRAP, 'run', START_PATH];
		options = setArgs(options, args);
		
		cp.spawn('node', args, {
			stdio: [ 0, 1, 2 ]
		});
	},

	/**
	 * Start a background aeproxy.
	 * @param [config] {string}
	 * @param [callback] {Function}
	 */
	start = exports.start = function (options, callback) {
		var now = new Date(),
			log = util.format('log/%s-%s-%s.log',
				now.getFullYear(), now.getMonth() + 1, now.getDate()),
			pid = fs.existsSync(RUNNING_PATH)
				&& fs.readFileSync(RUNNING_PATH, 'utf-8').split('\n')[1],
			child;

		isRunning(pid, function (running) {
			if (running) {
				console.log('[!] ' + config.name + ' is running.');
			} else {
				if (!fs.existsSync('log')) {
					fs.mkdirSync('log');
				}
				
				var args = [PATH_BOOTSTRAP, 'run', START_PATH];
				options = setArgs(options, args);

				child = cp.spawn('node', args, {
					detached: true,
					stdio: [ 'ignore', 'ignore', fs.openSync(log, 'a+') ]
				});

				fs.writeFileSync(RUNNING_PATH, JSON.stringify(options) + '\n' + child.pid);

				child.unref();

				console.log('[i] ' + config.name + ' started. port: ' + (options.port || config.port)
						+ '\r\nvisit http://' + config.localUIHost + '/ to get started');
			}

			callback && callback(options);
		});
	},

	/**
	 * Stop current background aeproxy.
	 * @param [callback] {Function}
	 */
	stop = exports.stop = function (callback) {
		var data, pid;
		var options = {};

		if (fs.existsSync(RUNNING_PATH)) {
			data = fs.readFileSync(RUNNING_PATH, 'utf-8').split('\n');
			try {
				options = data[0];
			} catch(e) {}
			pid = data[1];
		}

		isRunning(pid, function (running) {
			if (running) {
				try {
					process.kill(pid);
					fs.unlinkSync(RUNNING_PATH);
					console.log('[i] ' + config.name + ' killed.');
				} catch (err) {
					if (err.code === 'EPERM') {
						console.log(
							'[!] Cannot kill ' + config.name + ' owned by root.\n' +
							'    Try to run command with `sudo`.'
						);
					} else {
						console.log('[!] %s', err.message);
					}
				}
			} else {
				console.log('[!] No running ' + config.name + '.');
			}

			callback && callback(options);
		});
	};
