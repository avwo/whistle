#! /usr/bin/env node
/*eslint no-console: "off"*/
var program = require('starting');
var path = require('path');
var config = require('../lib/config');
var useRules = require('./use');
var showStatus = require('./status');
var util = require('./util');

var showUsage = util.showUsage;
var error = util.error;
var warn = util.warn;
var info = util.info;

function showStartupInfo(err, options, debugMode, restart) {
  if (!err || err === true) {
    return showUsage(err, options, restart);
  }
  if (/listen EADDRINUSE/.test(err)) {
    error('[!] Failed to bind proxy port ' + (options.port || config.port) + ': The port is already in use');
    info('[i] Please check if ' + config.name + ' is already running, you can ' + (debugMode ? 'stop whistle with `w2 stop` first' : 'restart whistle with `w2 restart`'));
    info('    or if another application is using the port, you can change the port with ' + (debugMode ? '`w2 run -p newPort`\n' : '`w2 start -p newPort`\n'));
  } else if (err.code == 'EACCES' || err.code == 'EPERM') {
    error('[!] Cannot start ' + config.name + ' owned by root');
    info('[i] Try to run command with `sudo`\n');
  }

  error(err.stack ? 'Date: ' + new Date().toLocaleString() + '\n' + err.stack : err);
}

program.setConfig({
  main: function(options) {
    var hash = options && options.storage && encodeURIComponent(options.storage);
    return path.join(__dirname, '../index.js') + (hash ? '#' + hash + '#' : '');
  },
  name: config.name,
  version: config.version,
  runCallback: function(err, options) {
    if (err) {
      showStartupInfo(err, options, true);
      return;
    }
    showUsage(false, options);
    console.log('Press [Ctrl+C] to stop ' + config.name + '...');
  },
  startCallback: showStartupInfo,
  restartCallback: function(err, options) {
    showStartupInfo(err, options, false, true);
  },
  stopCallback: function(err) {
    if (err === true) {
      info('[i] ' + config.name + ' killed.');
    } else if (err) {
      if (err.code === 'EPERM') {
        error('[!] Cannot kill ' + config.name + ' owned by root');
        info('[i] Try to run command with `sudo`');
      } else {
        error('[!] ' + err.message);
      }
    } else {
      warn('[!] No running ' + config.name);
    }
  }
});

program
  .command('status')
  .description('Show the running status of whistle');
program
  .command('use/enable [filepath]')
  .description('Set rules from a specified js file (.whistle.js by default)');
  
program
  .option('-D, --baseDir [baseDir]', 'set the configured storage root path', String, undefined)
  .option('-z, --certDir [directory]', 'set custom certificate store directory', String, undefined)
  .option('-l, --localUIHost [hostname]', 'set the domain for the web ui of whistle (' + config.localUIHost + ' by default)', String, undefined)
  .option('-L, --pluginHost [hostname]', 'set the domain for the web ui of plugin  (as: "script=a.b.com&vase=x.y.com")', String, undefined)
  .option('-n, --username [username]', 'set the username to access the web ui of whistle', String, undefined)
  .option('-w, --password [password]', 'set the password to access the web ui of whistle', String, undefined)
  .option('-N, --guestName [username]', 'set the the guest name to access the web ui of whistle (can only view the data)', String, undefined)
  .option('-W, --guestPassword [password]', 'set the guest password to access the web ui of whistle (can only view the data)', String, undefined)
  .option('-s, --sockets [number]', 'set the max number of cached long connection on each domain (' + config.sockets + ' by default)', parseInt, undefined)
  .option('-S, --storage [newStorageDir]', 'set the configured storage directory', String, undefined)
  .option('-C, --copy [storageDir]', 'copy the configuration of the specified directory to a new directory', String, undefined)
  .option('-c, --dnsCache [time]', 'set the cache time of DNS (30000ms by default)', String, undefined)
  .option('-H, --host [host]', 'set the listening host (INADDR_ANY by default)', String, undefined)
  .option('-p, --port [port]', 'set the listening port (' + config.port + ' by default)', parseInt, undefined)
  .option('-P, --uiport [uiport]', 'set the listening port of whistle (' + (config.port + 1) + ' by default)', parseInt, undefined)
  .option('-m, --middlewares [script path or module name]', 'set the express middlewares loaded at startup (as: xx,yy/zz.js)', String, undefined)
  .option('-M, --mode [mode]', 'set the way of starting the whistle mode (as: pureProxy|debug|multiEnv)', String, undefined)
  .option('-u, --uipath [script path]', 'set the path of custom web ui', String, undefined)
  .option('-t, --timeout [ms]', 'set the request timeout (' + config.timeout + 'ms by default)', parseInt, undefined)
  .option('-e, --extra [extraData]', 'set the extra parameters for plugin', String, undefined)
  .option('-f, --secureFilter [secureFilter]', 'set the path of secure filter', String, undefined)
  .option('-R, --reqCacheSize [reqCacheSize]', 'set the cache size of request data (600 by default)', String, undefined)
  .option('-F, --frameCacheSize [frameCacheSize]', 'set the cache size of webSocket and socket\'s frames (512 by default)', String, undefined);

var argv = process.argv;
var cmd = argv[2];
var storage;
if (cmd === 'status') {
  var all = argv[3] === '--all';
  if (argv[3] === '-S') {
    storage = argv[4];
  }
  showStatus(all, storage);
} else if (cmd === 'use' || cmd === 'enable') {
  var index = argv.indexOf('--force');
  var force = index !== -1;
  if (force) {
    argv.splice(index, 1);
  }
  var filepath = argv[3];
  if (filepath === '-S') {
    filepath = null;
    storage = argv[4];
  } else if (argv[4] === '-S') {
    storage = argv[5];
  }
  if (filepath && /^-/.test(filepath)) {
    filepath = null;
  }
  useRules(filepath, storage, force);
} else {
  program.parse(argv);
}
