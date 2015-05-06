/**
 * Prepare the environment before run main program.
 * @param callback {Function}
 */
module.exports = function bootstrap(callback) {
	// Make new created files writable by group members.
	if (process.setgid && process.getgid) {
		process.umask('002');
		process.setgid(parseInt(
			process.env['SUDO_GID'] || process.getgid(), 10));
	}

	callback();
}
