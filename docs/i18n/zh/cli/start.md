# w2 start & restart & run & stop
启动（重启）、关闭 Whistle 服务命令，Whistle 提供了丰富的启动参数以满足各种应用场景。

## w2 start
1. 默认启动
    ``` sh
    w2 start
    ```
    > 默认会在 `8899` 启动一个 Whistle 服务
2. 指定监听端口
    ``` sh
    w2 start -p 8888
    ```
3. 指定网卡
    ``` sh
    w2 start -H 10.x.x.x
    ```
4. 启动时自动设置代理及安装根证书（第一次启动时执行即可）：
    ``` sh
    w2 start --init "*.apple.com *.mzstatic.com *.icloud.com"
    ```
    > `w2 start --init [bypass]`，其中 `bypass` 可选，为不代理的域名
5. 启动多个服务
    ``` sh
    w2 start -p 6666 -S 6666
    ```
    > `-S 6666` 表示使用自定义存储目录 `6666`， 不同服务需要不同的存储目录，否则会出现配置相互覆盖问题

更多启动参数参见后面介绍。

## w2 restart
重启当前运行的 Whistle 服务，如果没有运行的服务，其作用相当于 `w2 start`。

1. 重启默认服务
    ``` sh
    w2 restart
    ```
2. 重启默认服务并修改端口
    ``` sh
    w2 restart -p 8888
    ```
    > 重启也可以设置启动参数，新增的参数会自动替换调之前服务的启动参数
3. 重启非默认服务
    ``` sh
    w2 restart -S 6666
    ```
    > 重启自己指定存储目录的服务需要加 `-S xxxx` 参数，如果不清楚之前设置了哪个目录可以通过 `w2 status --all` 查看

更多参数同启动参数参见后面介绍。

## w2 run
在前台运行 Whistle（不能关闭命令行），相当于开启 Whistle 调试模式，有以下功能：
1. 查看 Whistle 服务及插件 `console.xxx` 输出的日志
2. 自动加载启动目录的 Whistle 插件

其它用法同 `w2 start`。
## w2 stop
1. 停止默认运行的 Whistle 服务
    ``` sh
    w2 stop
    ```
2. 停止指定存储目录的服务
    ``` sh
    w2 stop -S xxx
    ```

# 启动参数
``` sh
w2 -h

Usage: w2 <command> [options]


  Commands:

    status      Show the running status
    add         Add rules from local js file (.whistle.js by default)
    proxy       Set global proxy
    ca          Install root CA
    install     Install whistle plugin
    uninstall   Uninstall whistle plugin
    exec        Exec whistle plugin cmd
    run         Start a front service
    start       Start a background service
    stop        Stop current background service
    restart     Restart current background service
    help        Display help information

  Options:

    -h, --help                                      output usage information
    -D, --baseDir [baseDir]                         set the configured storage root path
    -z, --certDir [directory]                       set custom certificate store directory
    -l, --localUIHost [hostname]                    set the domain for the web ui (local.whistlejs.com by default)
    -L, --pluginHost [hostname]                     set the domain for the web ui of plugin  (as: "script=a.b.com&vase=x.y.com")
    -n, --username [username]                       set the username to access the web ui
    -w, --password [password]                       set the password to access the web ui
    -N, --guestName [username]                      set the the guest name to access the web ui (can only view the data)
    -W, --guestPassword [password]                  set the guest password to access the web ui (can only view the data)
    -s, --sockets [number]                          set the max number of cached connections on each domain (256 by default)
    -S, --storage [newStorageDir]                   set the configured storage directory
    -C, --copy [storageDir]                         copy the configuration of the specified directory to a new directory
    -c, --dnsCache [time]                           set the cache time of DNS (60000ms by default)
    -H, --host [boundHost]                          set the bound host (INADDR_ANY by default)
    -p, --port [proxyPort]                          set the proxy port (8899 by default)
    -P, --uiport [uiport]                           set the webui port
    -m, --middlewares [script path or module name]  set the express middlewares loaded at startup (as: xx,yy/zz.js)
    -M, --mode [mode]                               set the starting mode (as: pureProxy|debug|multiEnv|capture|disableH2|network|rules|plugins|prod)
    -t, --timeout [ms]                              set the request timeout (360000ms by default)
    -e, --extra [extraData]                         set the extra parameters for plugin
    -f, --secureFilter [secureFilter]               set the path of secure filter
    -r, --shadowRules [shadowRules]                 set the shadow (default) rules
    -R, --reqCacheSize [reqCacheSize]               set the cache size of request data (600 by default)
    -F, --frameCacheSize [frameCacheSize]           set the cache size of webSocket and socket's frames (512 by default)
    -A, --addon [pluginPaths]                       add custom plugin paths
    --init [bypass]                                 auto set global proxy (and bypass) and install root CA
    --config [workers]                              start the cluster server and set worker number (os.cpus().length by default)
    --cluster [config]                              load the startup config from a local file
    --dnsServer [dnsServer]                         set custom dns servers
    --socksPort [socksPort]                         set the socksv5 server port
    --httpPort [httpPort]                           set the http server port
    --httpsPort [httpsPort]                         set the https server port
    --no-global-plugins                             do not load any globally installed plugins
    --no-prev-options                               do not reuse the previous options when restarting
    --inspect [[host:]port]                         activate inspector on host:port (127.0.0.1:9229 by default)
    --inspectBrk [[host:]port]                      activate inspector on host:port and break at start of user script (127.0.0.1:9229 by default)
    -V, --version                                   output the version number
```

### 设置用户名密码


### 设置游客账号


### 自定义管理界面监听端口


### 自定义管理界面域名


### 自定义插件界面域名


### 启动 HTTPS 代理


### 启动 Socks 代理


### 再监听一个 HTTP 代理端口（支持同时设置两个 HTTP 代理端口）


### 作为纯代理转发

### 开启调试模式


### 其它参数
1. ``：
2. ``：
3. ``：
4. ``：
5. ``：
7. ``：
8. ``：
