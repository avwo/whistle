#! /usr/bin/env node
/*eslint no-console: "off"*/
var program = require('starting');
var path = require('path');
var config = require('../lib/config');
var useRules = require('./use');
var showStatus = require('./status');
var util = require('./util');
var plugin = require('./plugin');
var setProxy = require('./proxy');
var installCA = require('./ca/cli');

var error = util.error;
var info = util.info;

function handleEnd(err, options, restart) {
  options = util.showUsage(err, options, restart);
  if (!options) {
    return;
  }
  var host = options.host + ':' + options.port;
  var argv = [host];
  if (options.bypass) {
    argv.push('-x', options.bypass);
  }
  setProxy(argv);
  installCA([host]);
}

function showStartupInfo(err, options, debugMode, restart) {
  if (!err || err === true) {
    return handleEnd(err, options, restart);
  }
  if (/listen EADDRINUSE/.test(err)) {
    options = util.formatOptions(options);
    error('[!] Failed to bind proxy port ' + (options.host ? options.host + ':' : '') + (options.port || config.port) + ': The port is already in use');
    info('[i] Please check if ' + config.name + ' is already running, you can ' + (debugMode ? 'stop whistle with `w2 stop` first' : 'restart whistle with `w2 restart`'));
    info('    or if another application is using the port, you can change the port with ' + (debugMode ? '`w2 run -p newPort`\n' : '`w2 start -p newPort`\n'));
  } else if (err.code == 'EACCES' || err.code == 'EPERM') {
    error('[!] Cannot start ' + config.name + ' owned by root');
    info('[i] Try to run command with `sudo`\n');
  }

  error(err.stack ? 'Date: ' + new Date().toLocaleString() + '\n' + err.stack : err);
}

function getName() {
  if (/[/\\](\w+)$/.test(process.argv[1])) {
    return RegExp.$1;
  }
}

program.setConfig({
  main: function(options) {
    var cmd = process.argv[2];
    if ((cmd === 'start' || cmd === 'restart') && (options.inspect || options.inspectBrk)) {
      error('[!] Only support running command `w2 run` to activate inspector on whistle.');
      var argv = Array.prototype.slice.call(process.argv, 3);
      info('[i] Try to run command `w2 run' + (argv.length ? ' ' + argv.join(' ') : '') + '` instead of.');
      return process.exit(1);
    }
    var hash = options && options.storage && encodeURIComponent(options.storage);
    return path.join(__dirname, '../index.js') + (hash ? '#' + hash + '#' : '');
  },
  name: getName() || config.name,
  version: config.version,
  runCallback: function(err, options) {
    if (err) {
      showStartupInfo(err, options, true);
      return;
    }
    handleEnd(false, options);
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
        util.showKillError();
      } else {
        error('[!] ' + err.message);
      }
    } else {
      showStatus.showAll(true);
    }
  }
});

program
  .command('status')
  .description('Show the running status');
program
  .command('add')
  .description('Add rules from local js file (.whistle.js by default)');
program.command('proxy')
  .description('Set global proxy');
program.command('ca')
  .description('Install root CA');
program.command('install')
  .description('Install whistle plugin');
program.command('uninstall')
  .description('Uninstall whistle plugin');
program.command('exec')
  .description('Exec whistle plugin cmd');

program
  .option('-D, --baseDir [baseDir]', 'set the configured storage root path', String, undefined)
  .option('-z, --certDir [directory]', 'set custom certificate store directory', String, undefined)
  .option('-l, --localUIHost [hostname]', 'set the domain for the web ui (' + config.localUIHost + ' by default)', String, undefined)
  .option('-L, --pluginHost [hostname]', 'set the domain for the web ui of plugin  (as: "script=a.b.com&vase=x.y.com")', String, undefined)
  .option('-n, --username [username]', 'set the username to access the web ui', String, undefined)
  .option('-w, --password [password]', 'set the password to access the web ui', String, undefined)
  .option('-N, --guestName [username]', 'set the the guest name to access the web ui (can only view the data)', String, undefined)
  .option('-W, --guestPassword [password]', 'set the guest password to access the web ui (can only view the data)', String, undefined)
  .option('-s, --sockets [number]', 'set the max number of cached connections on each domain (' + config.sockets + ' by default)', parseInt, undefined)
  .option('-S, --storage [newStorageDir]', 'set the configured storage directory', String, undefined)
  .option('-C, --copy [storageDir]', 'copy the configuration of the specified directory to a new directory', String, undefined)
  .option('-c, --dnsCache [time]', 'set the cache time of DNS (60000ms by default)', String, undefined)
  .option('-H, --host [boundHost]', 'set the bound host (INADDR_ANY by default)', String, undefined)
  .option('-p, --port [proxyPort]', 'set the proxy port (' + config.port + ' by default)', String, undefined)
  .option('-P, --uiport [uiport]', 'set the webui port', String, undefined)
  .option('-m, --middlewares [script path or module name]', 'set the express middlewares loaded at startup (as: xx,yy/zz.js)', String, undefined)
  .option('-M, --mode [mode]', 'set the starting mode (as: pureProxy|debug|multiEnv|capture|disableH2|network|rules|plugins|prod)', String, undefined)
  .option('-t, --timeout [ms]', 'set the request timeout (' + config.timeout + 'ms by default)', parseInt, undefined)
  .option('-e, --extra [extraData]', 'set the extra parameters for plugin', String, undefined)
  .option('-f, --secureFilter [secureFilter]', 'set the path of secure filter', String, undefined)
  .option('-r, --shadowRules [shadowRules]', 'set the shadow (default) rules', String, undefined)
  .option('-R, --reqCacheSize [reqCacheSize]', 'set the cache size of request data (600 by default)', String, undefined)
  .option('-F, --frameCacheSize [frameCacheSize]', 'set the cache size of webSocket and socket\'s frames (512 by default)', String, undefined)
  .option('-A, --addon [pluginPaths]', 'add custom plugin paths', String, undefined)
  .option('--init [bypass]', 'auto set global proxy (and bypass) and install root CA')
  .option('--config [workers]', 'start the cluster server and set worker number (os.cpus().length by default)', String, undefined)
  .option('--cluster [config]', 'load the startup config from a local file', String, undefined)
  .option('--dnsServer [dnsServer]', 'set custom dns servers', String, undefined)
  .option('--socksPort [socksPort]', 'set the socksv5 server port', String, undefined)
  .option('--httpPort [httpPort]', 'set the http server port', String, undefined)
  .option('--httpsPort [httpsPort]', 'set the https server port', String, undefined)
  .option('--no-global-plugins', 'do not load any globally installed plugins')
  .option('--no-prev-options', 'do not reuse the previous options when restarting')
  .option('--inspect [[host:]port]', 'activate inspector on host:port (127.0.0.1:9229 by default)')
  .option('--inspectBrk [[host:]port]', 'activate inspector on host:port and break at start of user script (127.0.0.1:9229 by default)');

var argv = process.argv;
var cmd = argv[2];
var storage;
var removeItem = function(list, name) {
  var i = list.indexOf(name);
  i !== -1 && list.splice(i, 1);
};
if (argv.indexOf('--init') !== -1) {
  process.env.WHISTLE_MODE = (process.env.WHISTLE_MODE || '') + '|persistentCapture';
}
if (cmd === 'status') {
  var all = argv[3] === '--all' || argv[3] === '-l';
  if (argv[3] === '-S') {
    storage = argv[4];
  }
  showStatus(all, storage);
} else if (cmd === 'proxy') {
  setProxy(Array.prototype.slice.call(argv, 3));
} else if (cmd === 'ca') {
  installCA(Array.prototype.slice.call(argv, 3));
} else if (/^([a-z]{1,2})?uni(nstall)?$/.test(cmd)) {
  plugin.uninstall(Array.prototype.slice.call(argv, 3));
} else if (/^([a-z]{1,2})?i(nstall)?$/.test(cmd)) {
  cmd = (RegExp.$1 || '') + 'npm';
  argv = Array.prototype.slice.call(argv, 3);
  removeItem(argv, '-g');
  removeItem(argv, '--global');
  plugin.install(cmd, argv);
} else if (cmd === 'use' || cmd === 'enable' || cmd === 'add') {
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
} else if ((cmd === 'run' || cmd === 'exec') && argv[3] && /^[^-]/.test(argv[3])) {
  cmd = argv[3];
  argv = Array.prototype.slice.call(argv, 4);
  plugin.run(cmd, argv);
} else {
  var pluginIndex = argv.indexOf('--pluginPaths');
  if (pluginIndex !== -1) {
    argv[pluginIndex] = '--addon';
  }
  program.parse(argv);
}
