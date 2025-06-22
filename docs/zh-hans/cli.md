# 命令行操作
Whistle 命令行版本支持以下命令行操作，查看完整命令行功能执行命令：`w2 -h`

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
1. `w2 start`：启动 Whistle，并使用默认存储目录
2. `w2 start -p 8100`：启动指定端口的 Whistle（默认为 `8899`）
3. `w2 start --httpsPort 8001`：启动 Whistle，并开启 HTTPS 代理端口
4. `w2 start --socksPort 1080`：启动 Whistle，并开启 SOCKSv5 代理端口
5. `w2 start -S storageName`：启动指定存储目录的 Whistle（大写 `S`）
> `storageName` 应为纯目录名（非完整路径），多实例运行时需满足：
> - 每个实例使用独立目录
> - 配置不同监听端口
> ``` sh
> w2 start
> w2 start -p 8100 -S storageName2
> ```

## w2 restart
1. `w2 restart`：重启 Whistle
   - 如果对应的端口和存储目录未有运行的 Whistle 实例，则会启动该 Whistle
   - 如果对应的端口和存储目录有运行的 Whistle 实例，会先关闭该实例再启动
2. `w2 restart --no-prev-options`：等价于 `w2 stop && w2 start`
3. `w2 restart -p 8100`：重启并修改端口
4. `w2 starrestartt --httpsPort 8001`：重启并开启 HTTPS 代理端口
4. `w2 restart --socksPort 1080`：重启并开启 SOCKSv5 代理端口
5. `w2 restart -S storageName`：重启指定存储目录的 Whistle 实例

## w2 stop
1. `w2 stop`：停止默认存储目录下的 Whistle
2. `w2 stop -S storageName`：停止指定存储目录的 Whistle

> 可通过下面 `w2 status --all` 查看当前命令行后台运行的 Whistle 实例

##  w2 status

1. 输出所有当前命令行后台运行的 Whistle 实例：`w2 status --all`
    ``` sh
    [i] All running Whistle instances:
      1. PID: 51512, Port: 8899
      2. PID: 53951, Port: 8080, Storage: 8080
    ```
2. 输出命令行后台运行的默认实例：`w2 status`
    ``` sh
    [!] whistle@version is running
    [i] 1. use your device to visit the following URL list, gets the IP of the URL you can access:
          http://127.0.0.1:8899/
          http://192.168.10.153:8899/
          http://10.211.55.2:8899/
          http://10.37.129.2:8899/
          Note: If all URLs are inaccessible, check firewall settings
                For help see https://github.com/avwo/whistle
    [i] 2. set the HTTP proxy on your device with the above IP & PORT(8899)
    [i] 3. use Chrome to visit http://local.whistlejs.com/ to get started
    ```

## w2 add
1. `w2 add`：执行当前目录下的 `.whistle.js`（或 `.whistle.mjs`）并将 export 出来的 `name`、`rules`、或 `groupName`（可选） 设置到界面的 Rules 里面
2. `w2 add filepath`：自定义执行的文件

`.whistle.js` 文件内容：
``` js
const pkg = require('./package.json');

exports.groupName = '项目开发环境'; // 可选，设置分组， 要求 Whistle 版本 >= v2.9.21
exports.name = `[${pkg.name}]本地环境配置`;
exports.rules = `
test.example.com http://127.0.0.1:5566
# cgi走现网
test.example.com/cgi-bin ignore://http
```

或异步获取规则：
``` js
const assert = require('assert);
const path = require('path');
const pkg = require('./package.json');

module.exports = (cb, util) => {
  // 如果依赖插件，可以检查插件
  assert(util.existsPlugin('@tnpm/whistle.tianma')
    || util.existsPlugin('whistle.combo'), '请先安装插件npm i -g whisltle.combo');
  // 也可以远程获取规则
  // do sth
  cb({
    name: `[${pkg.name}]本地环境配置`,
    rules:  `
      test.example.com/combo whisle.combo://${path.join(__dirname, 'dev')}
      test.example.com http://127.0.0.1:5566
      # 接口走现网
      test.example.com/cgi-bin ignore://http
      `
  });
};
```

Whistle 会检查是否存在同名规则：
- 规则不存在或为空：自动创建新规则并启用
- 规则已存在且非空：提示用户确认，避免意外覆盖
- 若需强制覆盖已有规则，请显式添加 `--force` 参数：
  ``` sh
  w2 add --force
  ```

## w2 proxy
1. `w2 proxy`：设置系统代理
   - IP：`127.0.0.1`
   - 端口：Whistle 运行的端口，如果没有运行的 Whistle，用默认端口 `8899`
2. `w2 proxy 0`：关闭系统代理
3. `w2 proxy 8100`：设置系统代理
   - IP：`127.0.0.1`
   - 端口：`8100`
4. `w2 proxy www.test.com:8100`：设置系统代理
   - IP 或域名：`www.test.com`
   - 端口：`8100`

## w2 ca
1. `w2 ca`：安装本地 Whistle 的根证书（安装本地 Whistle 根证书一般用这个命令即可）
2. `w2 ca 8080`：从指定端口（IP：`127.0.0.1`）下载 Whistle 根证书并安装
4. `w2 ca www.test.com:8080`：安装指定端口及 IP（或域名）的 Whistle 证书（可用于安装远程的 Whistle 根证书）
5. `w2 ca certUrl`：下载指定 URL 的证书并安装
6. `w2 ca localCertPath`：安装本地指定路径的证书

## w2 install
1. `w2 install whistle.script`：安装插件
2. `w2 install whistle.script --registry=https://npm-registry`：安装插件，并指定 npm registry

推荐使用界面安装：[使用插件](/zh-hans/extensions/usage)

## w2 uninstall
`w2 uninstall whistle.script`：卸载指定插件

推荐使用界面卸载：[使用插件](/zh-hans/extensions/usage)
## w2 exec
`w2 exec xxx`：执行插件在 package.json 中配置的 bin 命令（即插件提供的可执行脚本）
> 适用于插件开发者或需要调用插件 CLI 功能的场景

## w2 run
`w2 run`：以开发调试模式启动 Whistle，实时输出插件和系统的日志信息到控制台，支持所有 `w2 start` 的参数配置

## 其它参数
1. `-D, --baseDir [baseDir]`：自定义 Whistle 存储根目录（默认为 `$WWHISTLE_PATH/.whistle`）
   > 示例：`w2 start -D ~/my_whistle_data`
2. `-n, --username [username]`：设置管理界面登录用户名
3. `-w, --password [password]`：设置管理界面登录密码
   > 示例：`w2 start -n abc -w 123`
4. `-N, --guestName [username]`：设置只读权限的游客账号（游客仅可查看配置和抓包，不可修改）
5. `-W, --guestPassword [password]`：设置游客账号密码（游客仅可查看配置和抓包，不可修改）
   > 示例：`w2 start -N test -W 123`
6. `-P, --uiport [uiport]`：单独设置管理界面端口（默认与代理端口相同）
   > 示例：`w2 start -P 8889`
7. `-e, --extra [extraData]`：启动时向指定插件传递数据（`如：{inspect: data}`）
   > 示例：`w2 start -e '{"debug":true}'`
8. `--allowOrigin [originList]`：允许跨域请求管理界面接口的域名
   > 示例：`w2 start --allowOrigin *`
9.  `--no-global-plugins`：启动时不加载 `npm i -g whistle.xxx` 安装的插件
    > 示例：`w2 start --no-global-plugins`
10. `--inspect [[host:]port]`：启用Node.js调试（默认9229端口），配合Chrome DevTools使用
    > 示例：`w2 start --inspect`
11. `--inspectBrk [[host:]port]`：启用调试并在首行断点
    > 示例：`w2 start --inspectBrk`
12. `--config [config]`：通过配置文件加载参数
    > 示例：`w2 start --config /data/xxx.json`

给请求设置用户密码需要用到插件（或自己开发插件）：[whistle.proxyauth](https://github.com/whistle-plugins/whistle.proxyauth)
    