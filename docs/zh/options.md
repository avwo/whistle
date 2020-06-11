# 命令行参数

1. **`w2 status`：** 查看本机运行的 whistle 实例
2. **`w2 add`：** 通过本地文件加载规则，具体参见：[命令行操作](cli.html)
3. **`w2 install plugins [--registry=http://r.tnpm.oa.com]`：** 安装 whistle 插件（也可以全局安装），具体参见：[插件开发](plugins.html)
4. **`w2 uninstall plugins`：** 卸载插件
5. **`w2 exec cmd`：**  执行通过 `w2 install plugins` 安装的插件带命令行命令
6. **`w2 run`：** 开发模式启动 whistle，这种启动方式可以看到插件输出的 `console` 日志，且会自动加载当前目录的所有插件
7. **`w2 start`：** 正常启动 whistle
8. **`w2 stop`：** 停止 whistle（`w2 run` 的方式无法用此命令停止）
9. **`w2 restart`：** 重启 whistle（`w2 run` 的方式无法用此命令重启）
10. **`w2 help` 或 `w2 -h` 或 `w2 --help`：** 查看帮助
11. **`w2 -V` 或 `w2 --version`：** 查看当前版本
12: `w2 start[run] -D baseDir`：** 修改 whistle 配置的存储目录（也可以通过环境变量 `WHISTLE_PATH` 修改）
13. **`w2 start[run] -z certDir`：** 设置加载自定义证书的目录（也可以把自定义证书放在 `~/.WhistleAppData/custom_certs`，whistle 会自动加载）
14. **`w2 start[run] -D baseDir`：** 修改 whistle 配置的存储目录（也可以通过环境变量 `WHISTLE_PATH` 修改）
15. **`w2 start[run] -l localUIHost`：** 添加访问 whistle 配置界面的域名，默认为 `local.whistlejs.com` 或 `local.wproxy.org`，添加后配置代理或设置好DNS，即可通过该域名访问 whistle 配置界面，多个域名可以用 `| , &` 隔开，如：`"whistle.oa.com|whistle.test.com"`
16. **`w2 start[run] -L pluginUIHost`：** 自定义访问插件的域名，多个域名可以用 `| , &` 隔开，如：`"p1.oa.com|p2.test.com"`，设置后配置代理或设置好DNS，可以直接通过这些域名访问插件
17. **`w2 start[run] -n username`：** 设置访问 whistle 界面的用户名
18. **`w2 start[run] -w password`：** 设置访问 whistle 界面的密码
19. **`w2 start[run] -N guestName`：** 设置访问 whistle 界面的访客账号，访客账号可以查看不能修改
20. **`w2 start[run] -W password`：** 设置访问 whistle 界面的访客密码，访客账号可以查看不能修改
21. **`w2 start[run] -s socketsNum`：** 设置单域名长连接数（高版本 Node 无需设置该参数）
22. **`w2 start[run] -S storageDir`：** 修改规则存储目录，不同实例需要设置不同的存储目录，与 `--baseDir` 的区别是后者会影响的配置内容比较多
23. **`w2 start[run] -C storageDir`：** 修改规则存储目录时，可以把指定目录 `storageDir` 的规则 copy 到新目录
25. **`w2 start[run] -c dnsCacheTime`：** 修改 DNS 缓存时间，默认为 1分钟（不建议自己修改）
26. **`w2 start[run] -H boundHost`：** 指定监听的网卡，默认为所有可用网卡（不建议自己设置）
27. **`w2 start[run] -p port`：** 修改 whistle 监听的端口，默认为 `8899`
28. **`w2 start[run] -P uiPort`：** 修改 whistle UI 监听的端口，默认为 `8899` （不建议自己设置）
29. **`w2 start[run] -m middlewares`：** 通过 express 中间件扩展 whistle 功能（建议用插件形式扩展）
30. **`w2 start[run] -M mode`：** 设置 whistle 启动模式，同时设置多个用 `|` 分隔开，如 `-M "pureProxy|debug|multiEnv|capture|disableH2|network|rules|plugins"`
  - **`pureProxy`：** 纯代理模式，对一些内置界面域名 `local.whistlejs.com` 也当初普通请求
  - **`debug`：** 调试模式，会禁用一些超时设置及 dnsCache（不建议使用）
  - **`multiEnv`：** 除了 Default 其它规则都不能启用，应用参见：** https://github.com/nohosts/nohost
  - **`capture`：** 默认开启 `Capture TUNNEL CONNECTs`
  - **`disableH2`：** 默认禁用 `Enable HTTP/2`
  - **`network`：** 配置界面只显示 Network，支持 `network|rules` 或 `netowrk|plugins`
  - **`rules`：**  配置界面只显示 Rules，支持 `network|rules` 或 `rules|plugins`，
  - **`plugins`：** 配置界面只显示 Plugins，支持 `rules|plugins` 或 `netowrk|plugins`
  - **`safe`：** 安全模式，禁用 `rejectUnauthorized`，如果服务端返回自定义证书会报错，默认忽略错误
  - **`notAllowedDisableRules`：** 不允许禁用规则
  - **`notAllowedDisablePlugins`：** 不允许禁用插件
  - **`classic`：** 左侧菜单不显示 checkbox
  - **`socks`：**  socks模式，通过socks转发的请求默认走tunnel
  - **`keepXFF`：** 是否自动带上 `x-forwarded-for` 请求头
  - **`buildIn`：** 插件是否使用跟主进程一样的 Node 版本，默认是全局 Node，一般用于打包 electron 应用时使用
31. **`w2 start[run] -t timeout`：** 修改 whistle 默认超时时间 （一般使用默认即可）
32. **`w2 start[run] -e data`：** 这部分数据可以在插件里面通过 `options.extraData` 获取
33. **`w2 start[run] -f file.js`：** 加载过滤抓包数据的脚本
34. **`w2 start[run] -r shadowRules`：** 启动时设置规则
35. **`w2 start[run] -R reqCacheSize`：** 缓存的抓包数据个数（一般使用默认即可）
36. **`w2 start[run] -F frameCacheSize`：** 缓存的帧数据个数（一般使用默认即可）
37. **`w2 start[run] -A addon`：** 添加加载插件的目录
38. **`w2 start[run] --socksPort socksPort`：** 设置 socksv5 server 端口
38. **`w2 start[run] --httpPort httpPort`：** 作为 http server 接收请求
38. **`w2 start[run] --httpsPort httpsPort`：** 作为 https server 接收请求
38. **`w2 restart --no-prev-options`：** 重启是不加载之前启动的参数
38. **`w2 start[run] --inspect [[host:]port]`：** 同 `node `--inspect [[host:]port]
38. **`w2 start[run] --inspectBrk [[host:]port]`：** 同 `node `--inspectBrk [[host:]port]
