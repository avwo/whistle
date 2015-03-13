var fs = require('fs'),
	path = require('path'),
	pegasus = require('pegasus'),
	util = pegasus.util;

var PATTERN_PATHNAME_END = /\/?$/,

	LIST_TEMPLATE = fs.readFileSync(path.join(__dirname, 'list.tpl'), 'utf-8'),

	/**
	 * Get filename of requested file.
	 * @param pathname {string}
	 * @param base {string}
	 * @param wwwroot {string}
	 * @return {string}
	 */
	getFilename = function (pathname, base, wwwroot) {
		// Relocate pathname based on mount point.
		pathname = pathname.substring(base.length);

		// Resolve relative pathname such as "../".
		var filename = path.join(wwwroot, pathname);

		// Ensure filename under root.
		return filename.indexOf(wwwroot) === 0 ? filename : wwwroot;
	},

	/**
	 * Find index file in folder.
	 * @param files {Array}
	 * @param indexes {Array}
	 * @return {string|null}
	 */
	getIndexFile = function (files, indexes) {
		var len = indexes.length,
			i = 0,
			indexFile;

		for (; i < len; ++i) {
			indexFile = indexes[i];
			if (files.indexOf(indexFile) !== -1) {
				return indexFile;
			}
		}

		return null;
	},


	/**
	 * sort files and dirs separately.
	 * @param dirname {string}
	 * @param items {Array}
	 * @param callback {Function}
	 */
	sort = function (dirname, items, callback) {
		var files = [],
			dirs = [];

		(function next(i) {
			var item;

			if (i < items.length) {
				item = items[i];
				fs.stat(path.join(dirname, item), function (err, stats) {
					if (err) {
						util.throwError(err.message);
					} else {
						if (stats.isFile()) {
							files.push(item);
						} else if (stats.isDirectory()) {
							dirs.push(item + '/');
						}
					}
					next(i + 1);
				});
			} else {
				callback(dirs.sort().concat(files.sort()));
			}
		}(0));
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	readFile = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (root) {
			this._config = {
					autoIndex: true,
					indexes: [],
					root: root
				};
		},

		/**
		 * Finish procesing request.
		 * @params status {number}
		 * @params data {string}
		 * @params [contextType] {string}
		 * @params [mtime] {Date}
		 */
		_done: function (status, data, contextType, mtime) {
			var response = this.context.response;

			response
				.status(status)
				.head('content-type', contextType || 'text/plain');

			if (mtime) {
				response
					.head('last-modified', mtime.toGMTString());
			}

			response
				.clear()
				.write(data);

			this.next();
		},

		/**
		 * Check whether the letter case is strictly matched.
		 * @param filename {string}
		 * @param callback {Function}
		 */
		_matchCase: function (filename, callback) {
			var last, dirname;

			if (process.platform === 'win32') {
				(function next(pathname) {
					last = path.basename(pathname);
					dirname = path.resolve(pathname, '..');

					if (dirname !== pathname) {
						fs.readdir(dirname, function (err, items) {
							if (err) {
								util.throwError(err.message);
							} else {
								if (items.indexOf(last) === -1) {
									callback(false);
								} else {
									next(dirname);
								}
							}
						});
					} else {
						callback(true);
					}
				}(filename));
			} else { // Unix family is naturally case-sensitive.
				callback(true);
			}
		},

		/**
		 * Read directory and response with directory contents list.
		 * @param dirname {string}
		 */
		_readDir: function (dirname) {
			var config = this._config,
				context = this.context,
				self = this;

			fs.readdir(dirname, function (err, items) {
				if (err) {
					util.throwError(err.message);
				} else {
					var indexFile = getIndexFile(config.indexes, items);

					if (indexFile) {
						self._readFile(path.join(dirname, indexFile));
					} else if (!config.autoIndex) {
						self._done(403, '403 Forbidden');
					} else {
						sort(dirname, items, function (items) {
							// Pathname of directory should end with "/".
							var pathname = context.request.pathname
								.replace(PATTERN_PATHNAME_END, '/');

							items = (pathname > '/' ? [ '.', '..' ].concat(items) : items).map(function (item) {
								return {
									name: item,
									href: encodeURI(pathname + item)
								};
							});

							self._done(200, util.tmpl(LIST_TEMPLATE, {
								charset: context.charset,
								items: items,
								pathname: pathname
							}), 'text/html');
						});
					}
				}
			});
		},

		/**
		 * Read file and response with file content.
		 * @param filename {string}
		 * @param [mtime] {Date}
		 */
		_readFile: function (filename, mtime) {
			var self = this;

			fs.readFile(filename, function (err, data) {
				if (err) {
					util.throwError(err.message);
				} else {
					self._done(200, data, util.mime(filename), mtime);
				}
			});
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var config = this._config,
				context = this.context,
				self = this;
			var root = config.root();
			if (!root) {
				self._done(404, '404 Not Found');
				return;
			}
			
			var	filename = getFilename(request.pathname, context.base, root);

			fs.stat(filename, function (err, stats) {
				if (err) { // Unexist file raises 404.
					self._done(404, '404 Not Found');
				} else {
					self._matchCase(filename, function (matched) {
						if (!matched) { // Letter case unmatched.
							self._done(404, '404 Not Found');
						} else if (stats.isFile()) {
							self._readFile(filename, stats.mtime);
						} else if (stats.isDirectory()) {
							self._readDir(filename);
						} else { // Other file types also raise 404.
							self._done(404, '404 Not Found');
						}
					});
				}
			});
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		match: function (request, response) {
			return response.status() === 404;
		}
	});

module.exports = readFile;