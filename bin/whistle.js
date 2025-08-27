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
var colors = require('colors');

var error = util.error;
var info = util.info;
var warn = util.warn;

util.getLatestVersion(config.name).then((latestVersion) => {
  config.latestVersion = latestVersion;
}).catch(err => {});

function handleEnd(err, options, restart) {
  options = util.showUsage(err, options, restart);
  if (!options) {
    return;
  }
  var host = util.joinIpPort(options.host, options.port);
  var argv = [host];
  if (options.bypass) {
    argv.push('-x', options.bypass);
  }
  setProxy(argv);
  installCA([host]);
}

function showStartupInfo(err, options, debugMode, restart) {
  if (!err || err === true) {
    util.getLatestVersion(config.name).then((latestVersion) => {
      if (util.isVersionOutdated(config.version, latestVersion)) {
        warn(colors.yellow(`[!] Please update to the latest version ${colors.bold(latestVersion)} ` + colors.magenta(`(npm install -g ${config.name}@latest)`)));
      }
    }).catch(err => {});
    return handleEnd(err, options, restart);
  }
  if (/listen EADDRINUSE/.test(err)) {
    options = util.formatOptions(options);
    var port = options.port || config.port;
    error('[!] Failed to bind proxy port ' + (options.host ? util.joinIpPort(options.host, port) : port) + ': Port already in use');
    info('[i] ' + config.name + ' may already be running. Try: ' + (debugMode ? 'w2 stop' : 'w2 restart') + ' to ' + (debugMode ? 'stop' : 'restart') + ' the ' + config.name);
    info('    or use a different port with: ' + (debugMode ? '`w2 run -p newPort`\n' : '`w2 start -p newPort`\n'));
  } else if (err.code == 'EACCES' || err.code == 'EPERM') {
    error('[!] Permission denied: Cannot start ' + config.name + ' as root');
    info('[i] Try running with sudo\n');
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
      error('[!] Inspector mode only supported with `w2 run` command');
      var argv = Array.prototype.slice.call(process.argv, 3);
      info('[i] Usage: w2 run' + (argv.length ? ' ' + argv.join(' ') : ''));
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
      info('[i] ' + config.name + ' killed');
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
  .description('Display running status');
program
  .command('add')
  .description('Add rules from local JS file (.whistle.js by default)');
program.command('proxy')
  .description('Configure system proxy settings');
program.command('ca')
  .description('Manage Root CA certificates');
program.command('install')
  .description('Install Whistle plugin');
program.command('uninstall')
  .description('Uninstall Whistle plugin');
program.command('exec')
  .description('Execute plugin command');

program
  .option('-D, --baseDir [baseDir]', 'set storage root path', String, undefined)
  .option('-z, --certDir [directory]', 'set custom certificate directory', String, undefined)
  .option('-l, --localUIHost [hostname]', 'set web UI domain (' + config.localUIHost + ' by default)', String, undefined)
  .option('-L, --pluginHost [hostname]', 'set plugin UI domains  (as: "script=a.b.com&vase=x.y.com")', String, undefined)
  .option('-n, --username [username]', 'set web UI username', String, undefined)
  .option('-w, --password [password]', 'set web UI password', String, undefined)
  .option('-N, --guestName [username]', 'set web UI guest username (read-only)', String, undefined)
  .option('-W, --guestPassword [password]', 'set web UI guest password (read-only)', String, undefined)
  .option('-s, --sockets [number]', 'set max cached connections per domain (' + config.sockets + ' by default)', parseInt, undefined)
  .option('-S, --storage [newStorageDir]', 'set configuration storage directory', String, undefined)
  .option('-C, --copy [storageDir]', 'copy configuration from specified directory', String, undefined)
  .option('-c, --dnsCache [time]', 'set DNS cache time (default: 60000ms)', String, undefined)
  .option('-H, --host [boundHost]', 'set bound host (default: INADDR_ANY)', String, undefined)
  .option('-p, --port [proxyPort]', 'set proxy port (default: ' + config.port + ' by default)', String, undefined)
  .option('-P, --uiport [uiport]', 'set web UI port', String, undefined)
  .option('-m, --middlewares [script path or module name]', 'set startup middlewares (format: xx,yy/zz.js)', String, undefined)
  .option('-M, --mode [mode]', 'set startup mode (options: pureProxy|debug|multiEnv|capture|disableH2|network|rules|plugins|prod)', String, undefined)
  .option('-t, --timeout [ms]', 'set request timeout (default: ' + config.timeout, parseInt, undefined)
  .option('-e, --extra [extraData]', 'set plugin extra parameters', String, undefined)
  .option('-f, --secureFilter [secureFilter]', 'set secure filter path', String, undefined)
  .option('-r, --shadowRules [shadowRules]', 'set default shadow rules', String, undefined)
  .option('-R, --reqCacheSize [reqCacheSize]', 'set request data cache size (default: 600)', String, undefined)
  .option('-F, --frameCacheSize [frameCacheSize]', 'set WebSocket frame cache size (default: 512)', String, undefined)
  .option('-A, --addon [pluginPaths]', 'add custom plugin paths', String, undefined)
  .option('--init [bypass]', 'auto configure proxy and install Root CA')
  .option('--cluster [workers]', 'start cluster with worker count (default: CPU cores)', String, undefined)
  .option('--config [config]', 'load startup config from file', String, undefined)
  .option('--dnsServer [dnsServer]', 'set custom DNS servers', String, undefined)
  .option('--socksPort [socksPort]', 'set SOCKSv5 server port', String, undefined)
  .option('--httpPort [httpPort]', 'set HTTP server port', String, undefined)
  .option('--httpsPort [httpsPort]', 'set HTTPS server port', String, undefined)
  .option('--allowOrigin [originList]', 'set allowed CORS origins (format: a.b.c,x.y.z or *)', String, undefined)
  .option('--no-global-plugins', 'disable global plugins')
  .option('--no-prev-options', 'ignore previous options on restart')
  .option('--inspect [[host:]port]', 'enable inspector (default: 127.0.0.1:9229)')
  .option('--inspectBrk [[host:]port]', 'enable inspector with breakpoint (default: 127.0.0.1:9229)');

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
  index = argv.indexOf('-c');
  var isClient = index !== -1;
  if (isClient) {
    argv.splice(index, 1);
  }
  index = argv.indexOf('--client');
  if (index !== -1) {
    isClient = true;
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
  useRules(filepath, storage, force, isClient);
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
