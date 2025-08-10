# Command Line Operations
Whistle supports the following command line operations. To view the full command line functionality, execute the command: `w2 -h`:

``` sh
Usage: w2 <command> [options]


Commands:

  status      Display running status
  add         Add rules from local JS file (.whistle.js by default)
  proxy       Configure system proxy settings
  ca          Manage Root CA certificates
  install     Install Whistle plugin
  uninstall   Uninstall Whistle plugin
  exec        Execute plugin command
  run         Start a front service
  start       Start a background service
  stop        Stop current background service
  restart     Restart current background service
  help        Display help information

Options:

  -h, --help                                      output usage information
  -D, --baseDir [baseDir]                         set storage root path
  -z, --certDir [directory]                       set custom certificate directory
  -l, --localUIHost [hostname]                    set web UI domain (local.whistlejs.com by default)
  -L, --pluginHost [hostname]                     set plugin UI domains  (as: "script=a.b.com&vase=x.y.com")
  -n, --username [username]                       set web UI username
  -w, --password [password]                       set web UI password
  -N, --guestName [username]                      set web UI guest username (read-only)
  -W, --guestPassword [password]                  set web UI guest password (read-only)
  -s, --sockets [number]                          set max cached connections per domain (256 by default)
  -S, --storage [newStorageDir]                   set configuration storage directory
  -C, --copy [storageDir]                         copy configuration from specified directory
  -c, --dnsCache [time]                           set DNS cache time (default: 60000ms)
  -H, --host [boundHost]                          set bound host (default: INADDR_ANY)
  -p, --port [proxyPort]                          set proxy port (default: 8899 by default)
  -P, --uiport [uiport]                           set web UI port
  -m, --middlewares [script path or module name]  set startup middlewares (format: xx,yy/zz.js)
  -M, --mode [mode]                               set startup mode (options: pureProxy|debug|multiEnv|capture|disableH2|network|rules|plugins|prod)
  -t, --timeout [ms]                              set request timeout (default: 360000
  -e, --extra [extraData]                         set plugin extra parameters
  -f, --secureFilter [secureFilter]               set secure filter path
  -r, --shadowRules [shadowRules]                 set default shadow rules
  -R, --reqCacheSize [reqCacheSize]               set request data cache size (default: 600)
  -F, --frameCacheSize [frameCacheSize]           set WebSocket frame cache size (default: 512)
  -A, --addon [pluginPaths]                       add custom plugin paths
  --init [bypass]                                 auto configure proxy and install Root CA
  --cluster [workers]                             start cluster with worker count (default: CPU cores)
  --config [config]                               load startup config from file
  --dnsServer [dnsServer]                         set custom DNS servers
  --socksPort [socksPort]                         set SOCKSv5 server port
  --httpPort [httpPort]                           set HTTP server port
  --httpsPort [httpsPort]                         set HTTPS server port
  --allowOrigin [originList]                      set allowed CORS origins (format: a.b.c,x.y.z or *)
  --no-global-plugins                             disable global plugins
  --no-prev-options                               ignore previous options on restart
  --inspect [[host:]port]                         enable inspector (default: 127.0.0.1:9229)
  --inspectBrk [[host:]port]                      enable inspector with breakpoint (default: 127.0.0.1:9229)
  -V, --version                                   output the version number
```

## w2 start
1. `w2 start`: Starts Whistle and uses the default storage directory.
2. `w2 start -p 8100`: Starts Whistle on the specified port (default is `8899`).
3. `w2 start --httpsPort 8001`: Starts Whistle and enables the HTTPS proxy port.
4. `w2 start --socksPort 1080`: Starts Whistle and enables the SOCKSv5 proxy port.
5. `w2 start -S storageName`: Starts Whistle on the specified storage directory (uppercase `S`).
> `storageName` should be a plain directory name (not a full path). For multiple instances, the following requirements must be met:
> - Use a separate directory for each instance.
> - Configure different listening ports.
> ``` sh
> w2 start
> w2 start -p 8100 -S storageName2
> ```

## w2 restart
1. `w2 restart`: Restarts Whistle.
- If there's no Whistle instance running for the corresponding port and storage directory, it will be started.
- If there's a Whistle instance running for the corresponding port and storage directory, it will be shut down before starting.
2. `w2 restart --no-prev-options`: Equivalent to `w2 stop && w2 start`
3. `w2 restart -p 8100`: Restarts and changes the port number.
4. `w2 startrestartt --httpsPort 8001`: Restarts and enables the HTTPS proxy port.
4. `w2 restart --socksPort 1080`: Restarts and enables the SOCKSv5 proxy port.
5. `w2 restart -S storageName`: Restarts the Whistle instance for the specified storage directory.

## w2 stop
1. `w2 stop`: Stops Whistle for the default storage directory.
2. `w2 stop -S storageName`: Stops Whistle for the specified storage directory.

> You can use `w2 status --all` to view the Whistle instances currently running in the background. Example

## w2 status

1. Output all Whistle instances currently running in the command line background: `w2 status --all`
``` sh
[i] All running Whistle instances:
1. PID: 51512, Port: 8899
2. PID: 53951, Port: 8080, Storage: 8080
```
2. Output the default instance running in the command line background: `w2 status`
``` sh
[!] whistle@version is running
[i] 1. Use your device to visit the following URL list and obtain the IP address of the URL you can access:
http://127.0.0.1:8899/
http://192.168.10.153:8899/
http://10.211.55.2:8899/
http://10.37.129.2:8899/
Note: If all URLs are inaccessible, check firewall settings.
For help, see https://github.com/avwo/whistle
[i] 2. Set the HTTP proxy on your device with the above IP & PORT (8899)
[i] 3. Use Chrome to visit http://local.whistlejs.com/ to get started.

## w2 add
1. `w2 add`: Execute `.whistle.js` (or `.whistle.mjs`) in the current directory and set the exported `name`, `rules`, or `groupName` (optional) to the Rules interface.
2. `w2 add filepath`: Customize the executed file.

`.whistle.js` file contents:
``` js
const pkg = require('./package.json');

exports.groupName = 'Project Development Environment'; // Optional, set the group. Requires Whistle version >= v2.9.21
exports.name = `[${pkg.name}] Local Environment Configuration`;
exports.rules = `
test.example.com http://127.0.0.1:5566
# cgi live network
test.example.com/cgi-bin ignore://http
```

Or asynchronously obtain rules:
``` js
const assert = require('assert');
const path = require('path');
const pkg = require('./package.json');

module.exports = (cb, util) => {
  // If you depend on a plugin, you can check for it.
  assert(util.existsPlugin('@scope/whistle.combo')
    || util.existsPlugin('whistle.combo'), 'Please install the plugin first: w2 i whistle.combo');
  // You can also obtain rules remotely.
  // do sth
  cb({
    name: `[${pkg.name}] Local Environment Configuration`,
    rules: `
      test.example.com/combo whisle.combo://${path.join(__dirname, 'dev')}
      test.example.com http://127.0.0.1:5566
      # Interface goes to the live network
      test.example.com/cgi-bin ignore://http
      `
  });
};
```

Whistle will check if a rule with the same name exists:
- If the rule does not exist or is empty: a new rule will be automatically created and enabled.
- If the rule already exists and is not empty: the user will be prompted for confirmation to prevent accidental overwriting.
- To force overwriting of existing rules, explicitly add the `--force` parameter:
``` sh
w2 add --force
```

## w2 proxy
1. `w2 proxy`: Set the system proxy.
   - IP: `127.0.0.1`
   - Port: Whistle Running port. If Whistle is not running, use the default port 8899.
2. `w2 proxy 0`: Disable the system proxy.
3. `w2 proxy 8100`: Set the system proxy.
   - IP: `127.0.0.1`
   - Port: `8100`
4. `w2 proxy www.test.com:8100`: Set the system proxy.
   - IP or domain: `www.test.com`
   - Port: `8100`

## w2 ca
1. `w2 ca`: Install the local Whistle root certificate (this command is generally used to install the local Whistle root certificate).
2. `w2 ca 8080`: Download and install the Whistle root certificate from the specified port (IP: `127.0.0.1`).
4. `w2 ca www.test.com:8080`: Install Whistle for the specified port and IP (or domain). Certificate (can be used to install a remote Whistle root certificate)
5. `w2 ca certUrl`: Downloads and installs the certificate from the specified URL
6. `w2 ca localCertPath`: Installs the certificate from the specified local path

## w2 install
1. `w2 install whistle.script`: Installs the plugin
2. `w2 install whistle.script --registry=https://npm-registry`: Installs the plugin and specifies the npm registry

Recommended UI installation: [Use plugin](./extensions/usage)

## w2 uninstall
`w2 uninstall whistle.script`: Uninstalls the specified plugin

Recommended UI uninstall: [Use plugin](./extensions/usage)
## w2 exec
`w2 exec xxx`: Executes the `bin` command configured in the plugin's package.json file (i.e., the executable script provided by the plugin).
> Suitable for plugin developers or when calling the plugin's CLI functionality.

## w2 run
`w2 run`: Starts Whistle in development and debugging mode, outputting plugin and system log information to the console in real time, automatically refreshing UI code changes, and supports all `w2 start` configuration options.

## Other Options
1. `-D, --baseDir` `[baseDir]`: Customize the Whistle storage root directory (defaults to `$WWHISTLE_PATH/.whistle`)
  > Example: `w2 start -D ~/my_whistle_data`
2. `-n, --username [username]`: Set the management interface login username
3. `-w, --password [password]`: Set the management interface login password
  > Example: `w2 start -n abc -w 123`
4. `-N, --guestName [username]`: Set a read-only guest account (guests can only view configuration and capture packets, but cannot modify them)
5. `-W, --guestPassword [password]`: Set the guest account password (guests can only view configuration and capture packets, but cannot modify them)
  > Example: `w2 start -N test -W 123`
6. `-P, --uiport [uiport]`: Set a separate management interface port (defaults to the same as the proxy port)
  > Example: `w2 start -P 8889
7. `-e, --extra [extraData]`: Passes data to the specified plugin at startup (e.g., {inspect: data}`).
  > Example: `w2 start -e '{"debug":true}'`
8. `--allowOrigin [originList]`: Allows cross-origin requests to the domain name of the management interface.
  > Example: `w2 start --allowOrigin *`
9. `--no-global-plugins`: Does not load plugins installed with `npm i -g whistle.xxx` at startup.
  > Example: `w2 start --no-global-plugins`
10. `--inspect [[host:]port]`: Enables Node.js debugging (default port 9229), for use with Chrome DevTools.
  > Example: `w2 start --inspect`
11. `--inspectBrk [[host:]port]`: Enables debugging and sets a breakpoint on the first line.
  > Example: `w2 `start --inspectBrk`
12. `--config [config]`: Load parameters from a configuration file
  > Example: `w2 start --config /data/xxx.json`

To set a user password for requests, you need a plugin (or develop your own): [whistle.proxyauth](https://github.com/whistle-plugins/whistle.proxyauth)
    