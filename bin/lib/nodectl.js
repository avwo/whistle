var cp = require('child_process');
var	fs = require('fs');
var	path = require('path');
var	util = require('util');
var	commonUtil = require('../../util');
var	config = commonUtil.config;
var START_PATH = path.join(__dirname, 'start.js');
var	INIT_PATH = path.join(__dirname, '../../init.js');
var RUNNING_PATH = path.join(commonUtil.LOCAL_DATA_PATH, '.running');

function getRunningPath(options) {
	return RUNNING_PATH + (!options.port || options.port == 9527 ? '' : '-' + options.port);
}

/**
 * Check whether a node process is running.
 * @param pid {string}
 * @param callback {Function}
 */
function isRunning(pid, callback) {
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
}

function setArgs(options, args) {
	options = options || {};
	args.push('--json');
	args.push(encodeURIComponent(JSON.stringify(options)));
	return options;
}

/**
 * Restart current background aeproxy.
 * @param config {string}
 */

function restart(_options) {
	stop(function (options) {
		setTimeout(function () {
			start(util._extend(options, _options));
		}, 1000);
	});
}

exports.restart = restart;

/**
 * Start a front aeproxy.
 * @param [config] {string}
 */

function run(options) {
	console.log('[i] Press [Ctrl+C] to stop ' + config.name + '.. port: ' + (options.port || config.port));
	var args = [START_PATH, 'run', INIT_PATH];
	options = setArgs(options, args);
	
	cp.spawn('node', args, {
		stdio: [ 0, 1, 2 ]
	});
}

exports.run = run;

/**
 * Start a background aeproxy.
 * @param [config] {string}
 * @param [callback] {Function}
 */

function start(options, callback) {
	var runningPath = getRunningPath(options);
	var now = new Date(),
		log = util.format('log/%s-%s-%s.log',
			now.getFullYear(), now.getMonth() + 1, now.getDate()),
		pid = fs.existsSync(runningPath)
			&& fs.readFileSync(runningPath, 'utf-8').split('\n')[1],
		child;

	isRunning(pid, function (running) {
		if (running) {
			console.log('[!] ' + config.name + ' is running.');
		} else {
			if (!fs.existsSync('log')) {
				fs.mkdirSync('log');
			}
			
			var args = [START_PATH, 'run', INIT_PATH];
			options = setArgs(options, args);

			child = cp.spawn('node', args, {
				detached: true,
				stdio: [ 'ignore', 'ignore', fs.openSync(log, 'a+') ]
			});

			fs.writeFileSync(runningPath, JSON.stringify(options) + '\n' + child.pid);

			child.unref();

			console.log('[i] ' + config.name + ' started. port: ' + (options.port || config.port)
					+ '\r\nvisit http://' + config.localUIHost + '/ to get started');
		}

		callback && callback(options);
	});
}

exports.start = start;

/**
 * Stop current background aeproxy.
 * @param [callback] {Function}
 */

function stop(options, callback) {
	var data, pid;
	var runningPath = getRunningPath(options);
	
	if (fs.existsSync(runningPath)) {
		data = fs.readFileSync(runningPath, 'utf-8').split('\n');
		options = util._extend(commonUtil.parseJSON(data[0]) || {}, options);
		pid = data[1];
	}

	isRunning(pid, function (running) {
		if (running) {
			try {
				process.kill(pid);
				fs.unlinkSync(runningPath);
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
}

exports.stop = stop;

