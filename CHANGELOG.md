

# v2.9.25
1. refactor: 优化插件开发调试，参见：https://github.com/avwo/lack
# v2.9.24
为跟 Homebrew 版本保持一致，跳过此版本
# v2.9.23
1. refactor: 设置代理只需输入一次 root 密码：https://github.com/avwo/whistle/issues/746
2. fix: M1 Pro 上执行 `brew install whistle` 安装 Whistle 失败问题

# v2.9.22
1. fix: 修复部分插件规则优先级问题
2. feat: 支持通过 `pattern operation lineProps://important` 提升规则的优先级

# v2.9.21
1. feat: Rules 与 Values 支持分组
2. fix: `resCors://origin=xxx` 失效问题

# v2.9.20
1. fix: `resCors://*` 失效问题

# v2.9.19
1. feat: 支持自定义 `Upgrade` 请求协议
2. fix: `enable://proxyFirst` 可能出现重复请求问题

# v2.9.18
1. fix: 请求经过代理后 `x-whistle-client-id` 丢失问题
2. feat: 支持在 `Network / Tools` 里面自定义 Tab，详见：https://github.com/whistle-plugins/examples/tree/master/whistle.view-md5

# v2.9.17
1. fix: 规则列表无法拖动排序问题
2. refactor: `enable://clientId` 对所有请求生效（之前只对批评设置代理规则的请求生效）
3. docs: 调整 README

# v2.9.16
1. style: 添加 `Replay Times` 和 `Repeat Times` 菜单，最多可以重放请求 100 次
2. refactor: `compose` cgi 支持设置 `repeatTimes`（不能超过 100 次）
3. feat: 新增 CGI `/rules` `/values` `/rules?name=xxx` `/values?name=xxx` 获取 Whistle 的当前启用的规则和指定规则

# v2.9.15
1. feat: 支持通过 `w2 ca [host:port]` 安装对应 Whistle 代理的根证书（不填参数，默认加载当前本机运行版本）
2. feat: 支持通过 `w2 start[restart|run] --init [bypass]` 启动时同时设置代理和安装根证书，利用此特性可以实现通过 `npm i -g whistle && w2 restart --init` 一键安装 Whistle
3. feat: 支持上传 `.cer` 及 `.pem` 证书
4. feat: 支持通过 `process.env.WHISTLE_MODE` 定义启动参数 `-M xxx`
5. fix: `utf8` 编码不支持 `0x7f` 字符问题

# v2.9.14
1. feat: 支持通过命令行 `w2 proxy [off] [port] [host:port] [-x bypass]` 设置系统的全局代理
	- `w2 proxy`: 设置全局代理 `127.0.0.1:port`，port 为运行的默认实例的端口（`storage` 为空），如果没有默认实例则为 `8899`
	- `w2 proxy -x "<local>, domain1, domain2"`: 设置全局代理 `127.0.0.1:port`，port 为运行的默认实例的端口（`storage` 为空），如果没有默认实例则为 `8899`，**并设置不代理域名白名单**
	- `w2 proxy 8899`: 设置指定端口的代理，host 默认为 `127.0.0.1`
	- `w2 proxy www.test.com:8080` 或 `w2 proxy www.test.com:auto`: 指定代理的 host 和 port
	- `w2 proxy www.test.com:8080 -x "<local>, domain1, domain2"`: 组合应用
	- `w2 proxy off`: 关闭全局代理

# v2.9.13
1. refactor: 内联规则 `protocol://(key1=value1&key2=value2...)` 不再自动 `decodeURIComponent`
2. refactor: 如果内联规则 `protocol://key1=value1&key2=value2...` 无 `()`，会先检测下对应文件是否存在，不存在就当成 `protocol://(key1=value1&key2=value2...)` 处理

# v2.9.12
1. fix: https://github.com/avwo/whistle/issues/726
2. refactor: 优化 `excludeFilter://host=pattern`

# v2.9.11
1. fix: 使用 `https2http-proxy://host:port` 时，某些 `post` 请求无法正常发送问题
2. fix: 确保模板字符串的 `clientId` 优先获取传过来的请求 `clientId`（需要用本地的 `clientId` 可以使用 `localClientId`）

# v2.9.10
1. feat: 添加 `skip` 协议， skip 与 ignore 的区别，ignore 是将匹配的规则删除掉，skip 是跳过指定的规则不做匹配
2. fix: https://github.com/nodejs/node/issues/42787

# v2.9.9
1. feat: 支持通过 `w2 i 任意url` 安装插件
2. feat: 支持插件通过 `options.getPlugins(cb)` 获取当前 Whistle 安装的插件信息
3. feat: 支持通过 `ignore://matcher=xxx` （等价于 `ignore://operator=xxx`）、`ignore://pattern=xxx` 删除指定匹配的规则
4. style: 插件 `Sync` 功能支持获取历史记录列表

# v2.9.8
1. fix: TUNNEL 代理的 HTTP 请求被拦截后一些代理请求头的透传问题
2. feat: 支持通过 `w2 i git-url` 安装插件

# v2.9.7
1. style: 下次打开 Plugins 页面自动打开之前已打开的插件 Tab
2. refactor: `w2 add` 可以设置的规则大小由 16k 改成 256k
3. fix: TUNNEL 请求帧数据可能显示不全问题

# v2.9.6
1. fix: 长连接里面的帧数据可能展示补全问题
2. fix: 经过插件转发后的请求 client id 丢失问题

# v2.9.5
1. refactor: 如果启动绑定网卡，将网卡显示到 Online 里面
2. style: Tunnel 代理，支持通过请求头或响应头的 `x-whistle-transport-protocol` 自定义 `Protocol` 显示，响应头优先

# v2.9.4
1. fix: auth 插件钩子可能对被拦截的 tunnel 请求不生效问题
2. style: 支持导出的数据自带 Node 和 Whistle 的版本号
3. feat: 插件支持通过 package.whistleConfig.peerPluginList 配置安装插件式自动加载的关联插件列表（最多不超过 15 个插件）

# v2.9.3
1. feat: `redirect` 归类为 `rule` 与 `file`、`statusCode` 等协议同级别
2. refactor: 添加 ts 描述文件
3. refactor:`w2 i plugin` 支持 `w2 i plugin@version`
4. fix: Node 16 引入 `req.filter` 方法引发的问题

# v2.9.2
1. feat: 支持启动参数设置 `options.server` 方便第三方服务集成
	> `server` 可以为 `http.Server` 或 `events.EventEmitter` 对象，在第三方应用中可以通过 `server.emit('request'| 'upgrade' | 'connect', req, res)` 将请求交给 Whistle 处理
2. feat: 支持通过插件引入远程 Value：`protocol://$plugin/xxx`，这种配置会自动从插件 whistle.plugin uiServer 的 `/api/key/value?key=xxx` 获取对应的值
3. refactor: 优化错误日志路径 & `w2 status --all` 显示进程 id
4. refactor: 支持 HTTP2 的 Node 最低版本有 12 调整为 14（低版本的 HTTP2 模块存在一些 bug） 
5. fix: https://github.com/avwo/whistle/issues/697

# v2.9.1
1. feat: 支持通过 `pattern enable://clientIp` 让 Whistle 自动设置 `x-forwarded-for` 请求头
2. style: Values 编辑器支持 JSON 对象折叠，详见：https://github.com/avwo/whistle/pull/683
3. refactor: Whistle 的日志统一放 `$WHISTLE_PATH/whistle.log` 文件，默认为 `~/.WhistleAppData/whistle.log`

# v2.9.0
1. style: 修复禁用所有插件编辑器对应插件规则无法显示插件已失效的问题
2. style: `Frames` 移入 `Inspectors`
3. feat: 将请求匹配的 pattern 传给插件，可以通过 `req.originalReq.isRegExp` 及 `req.originalReq.pattern` 获取
4. feat: 支持自定义 Inspectors tab，详见：https://github.com/whistle-plugins/examples/tree/master/whistle.view-md5
5. feat: 支持自定义 Composer tab，详见：https://github.com/whistle-plugins/examples/tree/master/whistle.view-md5
6. refactor: 插件全局异常也会写入启动目录的日志文件 `whistle.log`，且支持插件通过 `process.handleUncaughtPluginErrorMessage = (errMsg) => {}` 获取全局异常信息，且可以通过 `return false` 来禁止插件自动退出


# v2.8.10
1. fix: 插件的 sniCallback 返回 `false` 请求没有重新走 TUNNEL 代理问题
2. refactor: 如果插件接收到的请求是 https，则 `req.url` 将为完整的路径

# v2.8.9
1. feat: 支持自定义 `inspectors tab`，详见：https://github.com/whistle-plugins/examples/tree/master/whistle.view-md5
2. feat: 支持通过 `disable://abort` 禁用 `enable://abort`
3. feat: Whistle 默认显示的抓包数据不超过 1.5m，可以通过 `enable://bigData` 扩大到 `2.5m`

# v2.8.8
1. feat: 支持通过 `enable://useLocalHost` 和 `enable://useSafePort` 修改 log 和 weinre 请求 URL 的域名或端口
2. style: 界面提供 `api.selectIndex` 选中指定下标的抓包数据
3. feat: 支持插件获取 `originalReq.remoteAddress` 与 `originalReq.remotePort`

# v2.8.7
1. feat: `--httpsPort` 启动的 HTTPS Server 支持从插件获取证书
2. feat: 支持通过 `excludeFilter://from=httpServer`、`includeFilter://from=httpsServer`、`excludeFilter://from=httpServer`、`includeFilter://from=httpsServer` 过滤请求

# v2.8.6
1. refactor: 禁止通过页面上传根证书 `root.key & root.crt`
2. refactor: Whistle 自动生成的证书过期时自动续期（有效期一年）

# v2.8.5
1. feat: 支持通过 `ignore://-*` 过滤 `ignore://*`
2. feat: 支持 `proxy` 和 `pac` 配置 `lineProps://proxyHostOnly`，当用户配置了 `host` 代理才会生效
3. feat: 非 SNI 请求也支持通过插件自定义证书，且支持直接上传和删除用户自定义证书

# v2.8.4
1. fix: 可能无法导入 saz 文件问题

# v2.8.3
1. fix: https://github.com/avwo/whistle/pull/657
2. feat: 插件 `server` 钩子支持通过 `req.setReqRules & req.setResRules` 设置动态规则
3. feat: 支持通过 `enable://forceReqWrite` 和 `enable://forceResWrite` 强制 `reqWrite`、`reqWriteRaw` 和 `resWrite`、`resWriteRaw`
4. feat: `reqWrite:///path/to/` 和 `reqWrite:///path/to` 加以区别，前者会自动把根路径补成 `index.html`
5. feat: 插件的 auth hook 默认情况下如果开启了捕获 https，则对这部分请求只会对解析后的 https 请求生效，如果需要对隧道代理生效可以设置 `enable://authCapture`
6. feat: 默认不启用 `x-forwarded-host` 和 `x-forwarded-proto` 直接放过，可以通过以下方式启用：
	- 启动参数 `-M x-forwarded-host|x-forwarded-proto`
	- 请求进入 Whistle 之前设置请求头 `x-whistle-forwarded-props: host,proto,for,clientIp,ip`

# v2.8.2
1. feat: `resMerge://json1 resMerge://json2` 默认采用 `extend({}, json1, json2)`，新版支持通过 `resMerge://json1 resMerge://json2 resMerge://true` 开启  `extend(true, {}, json1, json2)`
2. refactor: 插件规则里面的 req 和 res rules 分开执行

# v2.8.1
1. refactor: 优化获取证书逻辑，合并多次相同请求
2. refactor: 处理 `unhandledRejection` 事件
3. feat: 支持通过请求头设置响应规则
4. fix: sniCallback 内存泄露问题

# v2.8.0
1. feat: 支持启动 `--cluster [workers]` 模式，通过该方式可以启动多进程模式（worker 为 Whistle headless）
2. fix: 启动时绑定非 `127.0.0.1` 网卡，插件远程规则访问失败问题

# v2.7.29
1. fix: https://github.com/avwo/whistle/issues/643

# v2.7.28
1. fix: WebSocket 无法抓包问题

# v2.7.27
1. fix: 插件用到 `storage.setProperties` 失效问题
2. feat: 插件 `whistleConfig` 支持配置 `inheritAuth` 复用 Whistle 的登录账号

# v2.7.26
1. feat: 支持通过插件 `sniCallback(req, options)` hook 获取远程证书
2. feat: 支持通过 `--config localFile` 加载启动配置，优先级高于命令行

# v2.7.25
1. fix: 某些情况下响应 stream pause 问题
2. refactor: 优化 `w2 stop`，找不到指定实例时自动显示当前所有运行的实例
3. style: 支持将 Rules 添加到最前面

# v2.7.24
1. refactor: 优化 `lineProps://proxyHost|proxyTunnel|proxyFirst`

# v2.7.23
1. style: 优化显示 Composer 历史记录列表
2. style: 禁用 Rules、Plugins 显示小黄条提醒

# v2.7.22
1. feat: 插件 auth 方法支持 `req.setRedirect(url);`
2. perf: 优化启动速度
3. fix: 修复第三方集成时，一些内部请求转发问题

# v2.7.21
1. fix: 清除搜索框历史记录 js 报错问题
2. feat: 普通 HTTP 请求也支持 `customParser`（或 `customFrames`）：https://github.com/whistle-plugins/whistle.custom-parser

# v2.7.20
1. fix: Cannot read property 'headers' of undefined

# v2.7.19
1. feat: HTTP2 支持非 HTTPS 请求
2. feat: 插件支持通过 `options.getCert(domain, (cert || '') => {})` 获取指定域名证书
3. refactor: 优化 `reqDelay` 和 `resDelay` 实现
# v2.7.18
1. feat: 支持插件设置 `tunnelKey` 将指定的隧道代理请求头带到解开后的 http/https/ws 请求头
2. feat: 插件 `auth` 方法支持处理 Whistle 的内部请求
3. feat: 插件 `auth` 支持设置 `req.showLoginBox` 弹出登录框
4. style: 显示 UI 请求情况
5. refactor: 优化内部请求转发逻辑的实现方式

# v2.7.17
1. feat: WebSocket 和 Tunnel 请求支持 `replaceStatus`

# v2.7.16
1. fix: Maximum call stack size exceeded

# v2.7.15
1. perf: 去掉 `Empty Request`，减少内存及 CPU 占用
2. style: Network 的  `Body` 支持显示请求内容大小

# v2.7.14
1. feat: 插件支持通过 `options.require` 直接引用 Whistle 里面的第三方模块或文件
2. refacto: 插件在不同实例使用不同的存储目录

# v2.7.13
1. fix: 特殊情况下 Whistle 无法展示 WebSocket 前几个请求帧问题
2. feat: 支持在模板字符串里面通过 `clientPort` 和 `serverPort` 分别获取客户端和服务端端口
3. refactor: `alert`、`confirm`、`prompt` 等浏览器内置的窗口改用自定义实现，防止 https://www.chromestatus.com/feature/5148698084376576

# v2.7.12
1. fix: `reqReplace` 及 `resReplace` 可能因为拆包导致匹配不准确问题
2. fix: Rules 编辑器行首字母输入 `!` 报错问题

# v2.7.11
1. feat: 插件 hook 支持 `async-await`：

		``` js
		module.exports = async (server, options) => {
			// ... do sth
		};
		```
2. feat: `pipe://xxx` 支持插件内部通过 `req.originalReq.ruleValue` 获取 `xxx://value` 的 `value` 值

# v2.7.10
1. feat: 支持通过 `-M disableForwardedHost` 禁止 Whistle 使用 `x-forwarded-host` 请求头，默认 Whistle 会用该请求头作为请求 URL 的域名
2. feat: 支持通过 `-M disableForwardedProto` 禁止 Whistle 使用 `x-forwarded-proto` 请求头，默认当该请求头值为 `https` 时， Whistle 会把请求当成 HTTPS 处理
3. feat: 第三方通过 `const proxy = startWhistle(options);` 启动 Whistle 时，可以通过 `proxy.on('perfDataChange', (perfData) => {})` 获取 cpu、内存、请求量等数据
4. refactor: 第三方通过 `const proxy = startWhistle(options);` 启动 Whistle 时，可以通过 `proxy.on('pluginLoad', child, name, moduleName);`、`proxy.on('pluginLoadError', err, name, moduleName);` 监听插件启动信息

# v2.7.9
1. feat: 支持 `pattern %plugin=xxx`
2. feat: 支持插件通过 `options.getTop(data => data && console.log(data))` 获取所在 Whistle 的 CPU、内存及请求量等信息

# v2.7.8
1. feat: 源码目录添加 Dockerfile: https://github.com/avwo/whistle/pull/601
2. feat: 支持在插件的根目录执行 `w2 run` 时自动加载该插件
3. refactor: 设置 `resCors://enable` 如果请求头不存在 `origin` 则自动忽略该设置
4. fix: https://github.com/avwo/whistle/issues/600

# v2.7.7
1. fix: [pipe](https://wproxy.org/whistle/rules/pipe.html) 无法直接透传 WebSocket 的二进制包问题
2. style: 支持显示自定义根证书及删除自定义证书导引
3. style: `pipe` 支持智能提示

# v2.7.6
1. feat: 支持通过类似 `--dnsServer http://dns.alidns.com/resolve` 自定义 `dns-over-https` 服务： https://github.com/avwo/whistle/issues/439
2. style: 优化错误提示

# v2.7.5
1. feat: 支持通过 `disable://interceptConsole` 禁止 `log://` 拦截 `console` 的请求，用户只能通过代码 `window._whistleConsole && _whistleConsole.xxx(a, b, ...)` 记录日志
2. feat: 支持在规则里面同时设置多个s `%plugin-name=xxxx` （最多 10 个），Whistle 会自带将这些值带到插件的对象： `req.originalReq.pluginVars`
3. refactor: 显示插件转发的 HTTP 协议 

# v2.7.4
1. refactor: 调整 `delete://reqH.xxxx` 的时机

# v2.7.3
1. style: 优化左侧菜单
2. styl: 修复 Values 右键菜单 Copy / Key 弹出创建新 key 输入框问题
3. feat: 支持设置 `-M shadowRules` （抓包 + 设置 shadowRules） 或 `-M shadowRulesOnly` （无法查看抓包）

# v2.7.2
1. feat: 支持通过命令行参数 `--dnsServer "1.1.1.1,8.8.8.8,10.3.2.1:8080"` 自定义 DNS server
		> 如果需要请求自定义 DNS server 出错时自动转成默认可以用: `--dnsServer "1.1.1.1,8.8.8.8,10.3.2.1:8080,default"`
		> 自定义 DNS server，默认是获取 IPv4，如果需要获取 IPv6，要手动指定 `--dnsServer "2001:4860:4860::8888,[2001:4860:4860::8888]:1053,ipv6"`
2. fix: 修复 List View 通过表头排序后无法 Reset 的问题

# 2.7.1
1. fix: Tree View 抓包数据满了后无法自动更新问题
# v2.7.0
1. feat: Network 支持 Tree View 展示
2. feat: `pac` 支持设置用户名密码：`pac://user:pass@pacPath`
3. style: 支持显示 `Raw Url` 详见：https://github.com/avwo/whistle/issues/572

# v2.6.16
1. fix: 解决规则文件名称过长保存失败的问题
2. feat: 域名统配也支持获取子匹配内容 

# v2.6.15
1. refactor: 优化命令行启动输出的信息
2. feat: 编辑器 `Show Line Number` 时，双击行数可以注释或取消注释
3. feat: `Network / Tools / Toolbox` 支持将对象转成 `Query` 参数
4. style: 支持扩展 `util.openEditor(value)` 方法 

# v2.6.14
1. chore: https://github.com/avwo/whistle/issues/559

# v2.6.13
1. style: Network 搜索框支持最多3个关键字过滤
2. style: Network 右键菜单新增 `Open/Source` 查看当前抓包数据的源码
3. refactor: `onSocketEnd` 添加 `timeout` 事件，兼容各种诡异行为
4. refactor: 优化内部连接管理

# v2.6.12
1. feat: 支持通过 url 参数的 clientId 过来抓包数据
2. feat: 支持通过 `disable://proxyConnection` 将代理转发头改为 `Proxy-Connection: close`

# v2.6.11
1. perf: 确保及时关闭无用连接，减少内存占用
2. style: Online 支持显示 QPS，及 内存、CPU、QPS 的最大值
3. refactor: 处理处理请求过程中无法捕获的异常

# v2.6.10
1. feat: 支持导出 har 文件
2. feat: 支持设置 `-M "disabledBackOption|disabledMultipleOption|notAllowDisableRules"`
3. feat: 内部路径 `/...whistle-path.5b6af7b9884e1165...///` 支持设置域名 `/...whistle-path.5b6af7b9884e1165...///__domain__port__/path/to` (`port__` 可选) 或 `/...whistle-path.5b6af7b9884e1165...///path/to?_whistleInternalHost_=__domain__port__` (`port__` 可选) 

# v2.6.9
1. feat: 支持通过 `--shadowRules jsonString` 导入规则到 Rules
2. style: 支持通过设置请求参数 `disabledEditor=1` 将 Rules & Values 编辑框设置为只读模式

# v2.6.8
1. fix: `excludeFilter` `includeFilter` 混合配置时结果错乱问题
2. feat: 支持 -M `rulesOnly` 及 `pluginsOnly`

# v2.6.7
1. fix: https://github.com/avwo/whistle/issues/540

# v2.6.6
1. fix: 管理界面 CGI 路径可以随意拼接问题

# v2.6.5
1. fix: 部分 Node 版本可能卡死问题
2. fix: [pipe](http://wproxy.org/whistle/rules/pipe.html) 可能导致数据丢失问题

# v2.6.4
1. fix: 编辑器高亮显示插件规则的一些问题
2. feat: 本地文件替换的响应头头默认加入 `content-length` 字段，可以通过 `delete://resH.content-length` 禁用
3. feat: 支持通过 CGI 或 API 获取当前处理的请求总数

# v2.6.3
1. style: 支持预览 SVG 文件
2. feat: 支持通过 `process.on('pforkError', (info) => {})` 获取插件抛出的异常信息
3. perf: 调整GC参数 `--max-semi-space-size=64`

# v2.6.2
1. fix: `v15.5.0` 版本界面无法打开问题

# v2.6.1
1. fix: `v15.5.0` 版本自动设置 `autoDestroy` 导致无法请求的问题

# v2.6.0
1. feat: 支持通过 `Online` 菜单查看当前进程的请求数、CPU、内存状态等
2. feat: 支持通过 `proxy.getRuntimeInfo()` 获取当前进程的请求数、CPU、内存状态等
3. feat: 添加回收站，删除的 Rules 或 Values 会先存放到回收站（最多缓存120条），并可以点击恢复
4. feat: `Network > Tools > ToolBox` 支持通过域名生成对应的证书，方便开发其它 https 服务使用

# v2.5.32
1. feat: tunnel 代理支持确认机制，详见：https://github.com/avwo/lack-proxy/blob/master/lib/proxy.js#L100

# v2.5.31
1. fix: http 请求走 tunnel 代理没有主动调用 `socket.resume()`，可能导致用 lack-proxy 代理的部分请求超时
2. style: 插件禁用后在页面的标签显示 `Disabled`

# v2.5.30
1. fix: 页面 Content Encoding 显示错误问题

# v2.5.29
1. feat: `enable://servername` 删除 https 请求的 sni
2. feat: 支持 `w2 run -M prod` 方便 docker 部署
3. refactor: 自动简称请求或响应内容是否支持gzip

# v2.5.28
1. feat: 新增 `lineProps://proxyHost|proxyTunnel` 只对当前行生效

# v2.5.27
1. feat: 以 `/...whistle-path.5b6af7b9884e1165...///` 路径开头的内部请求也支持 `enable://proxyTunnel`

# v2.5.26
1. style: JSONView 的右键菜单新增 `Collapse Parent`
2. feat: 添加 `enable://proxyTunnel`，支持两层http代理 **请求 -> http 代理 -> http 代理**
		``` txt
    www.test.com proxy://10.0.0.1:5566 10.1.2.3:8080 enable://proxyHost|proxyTunnel
		```
		上述表示请求将通过 http 代理 `10.0.0.1:5566` 转发到上层 http 代理 `10.1.2.3:8080`

# v2.5.25
1. feat: 支持通过 `-M useMultipleRules` 启用多选，相当于在 Rules/Settings 勾选 `Use multiple rules`
2. fix: 解决 `https2http-proxy` 部分请求无法正常转换问题，该协议主要是将请求自动转成http，并代理到指定 `http proxy`，功能同 `internal-proxy`，但 `internal-proxy` 无法[同时设置host](https://github.com/avwo/help/issues/5)

# v2.5.24
1. feat: 添加 [cipher](http://wproxy.org/whistle/rules/cipher.html) 支持自定义兜底加密算法

# v2.5.23
1. fix: 代理请求头 `Host` 错乱问题（不影响正常使用）

# v2.5.22
1. refactor: 更新 node-forge 解决安全问题
2. fix: h2 请求转成 https 请求时，界面显示响应头大小问题
3. feat: 启动参数 `options` 支持通过字段 `allowPluginList` 和 `blockPluginList` 分别设置可加载的插件及不可加载的插件列表 

# v2.5.21
1. style: Overview 规则列表 hover 上去可以点击查看帮助文档
2. style: Network 搜索框添加历史记录功能

# v2.5.20
1. fix: `reqHeaders://cookie=xxx` 和 `reqCookies://test=123` 无法同时生效问题
2. feat: 支持通过请求参数 `hideLeftMenu=true` 或启动参数 `-M hideLeftMenu` 隐藏左菜单

# v2.5.19
1. feat: 插件自动添加trailers，可以通过 `res.disableTrailer` 禁用
2. refactor: 优化监听 `res.on('end', cb)` 事件，确保事件触发

# v2.5.18
1. feat: 支持传递 `trailers`
2. feat: 支持通过 `delete://trailer.xxx|trailer.yyy` 删除指定tailer（如果存在）
3. feat: 支持通过 `headerReplace://trailer.key:pattern=value` 及 `trailers://json` 修改tailers
4. fix: 自动修改 websocket origin 问题

# v2.5.17
1. feat: 支持 `includeFilter://reqH.cookie=pattern` 等价与 `includeFilter://reqH:cookie=pattern`
2. style: 调整Network字体加粗效果
3. fix: 配置hosts的websocket的https请求无法自动转http请求问题

# v2.5.16
1. fix: https://github.com/avwo/whistle/issues/462

# v2.5.15
1. fix: #464
2. feat: 支持自定义 plugins 列表的卸载及安装命令名称
3. chore: 优化界面及依赖

# v2.5.14
1. feat: 支持通过 `delete://body` 删除请求及响应内容，或 `delete://req.body` 删除请求内容，`delete://res.body` 删除响应内容
2. feat: 支持通过 `reqBody://()` 或 `resBody://()` 分别清空请求或响应内容（不影响reqPrepend、reqAppend 等注入的内容）
3. fix: #456

# v2.5.13
1. refactor: 新增访客模式可以访问的接口
2. style: 页面时间支持显示毫秒

# v2.5.12
1. style: 加粗 Composer 里面的 whistle 自定义请求头
2. fix: https://github.com/avwo/whistle/issues/451
3. refactor: 减少暴露无登录态的接口

# v2.5.11
1. feat: 支持显示 websocket 关闭的错误码
2. style: 支持将请求头以 JSON 文本拷贝

# v2.5.10
1. fix: `--addon "path1,path2"` 无法填多个路径问题
2. fix: 某些服务没按http标准执行，如 `302` 返回内容，可能导致页面或下游代理 pending问题

# v2.5.9
1. style: Frames 里面支持快捷键 `Ctrm[Cmd] + R` 重放请求
2. refactor: 插件里面可以通过 `req.originalReq.ruleUrl` 获取 [rule](https://wproxy.org/whistle/rules/rule/) 匹配结果
3. feat: 拦截 https 请求后，会保留 tunnel 代理请求头 `x-whistle-tunnel-data` 的数据
4. feat: 去掉同步系统hosts设置，且左侧菜单新增 checkbox 可以快速禁用或启用 Rules/Plugins

# v2.5.8
1. perf: gzip 返回抓包数据的 cgi
2. fix: Composer 构造没有body的请求不设置 `content-length: 0` 问题
3. style: 添加快捷键 `ctrl[cmd] + r` 或 `ctrl[cmd] + shift + r` 重放请求

# v2.5.7
1. fix: 通过 [urlParams](https://wproxy.org/whistle/rules/urlParams.html) 和 [pathReplace](https://wproxy.org/whistle/rules/pathReplace.html) 修改请求URL参数的问题
2. style: Network 右键菜单添加 `Actions>Mark` 标记抓包数据
3. refactor: `statusCode` 移入 `rule` 里面跟 `file` 等协议同级

# v2.5.6
1. style: Plugins 添加 `ReinstallAll` 按钮，可以copy插件安装命令
2. fix: 还原匹配顺序，修复：https://github.com/avwo/whistle/issues/421

# v2.5.5
1. fix: `Node >= 14.1` 无法使用http2问题
2. fix: 某些规则可能会被插件返回的规则覆盖问题
3. feat: 模板字符串支持通过 `${hostname}` 获取系统的 `os.hostname()`

# v2.5.4
1. fix: 请求包含匹配的插件规则时，可能导致 Overview 界面脚本报错问题（可能导致某些配了请求映射及包含插件规则的请求 Overvew 出现空白）

# v2.5.3
1. refactor: 优化 `resCors://enable` 支持自动设置 `OPTIONS` 请求的 `access-control-request-headers`, `access-control-request-method` 字段
2. fix: https://github.com/avwo/whistle/issues/412

# v2.5.2
1. feat: 支持 `-M proxifier` 开头 `proxfifier` 模式，该模式下会 whistle 会对所有请求域名为 `ip` 且端口为 `80`, `443` 的请求进行 https 拦截，并判断是否有上传自定义证书
2. fix: Node13~14 开启 http2 功能
3. feat: 支持 json5 配置（Node版本最低要求改为 6）

# v2.5.1
1. fix: `includeFilter://h:key=pattern` 只能匹配请求头，无法匹配响应头问题
2. feat: JSON Tree 支持 Copy 字节点数据
3. feat: Composer 支持上传本地文件

# v2.5.0
1. feat: 支持自定义客户端证书：https://wproxy.org/whistle/custom-certs.html
2. refactor: 优化建立连接时的错误处理
3. style: 现在 Composer 输入的文本长度防止浏览器卡死

# v2.4.17
1. feat: 支持客户端服务端双向认证，详见：[自定义证书](https://wproxy.org/whistle/custom-certs.html)
2. feat: 支持在 Network 自定义列，详见：[style](https://wproxy.org/whistle/rules/style.html)
3. style: 在 Overview 里面显示匹配的 `includeFilter`

# v2.4.16
1. fix: `includeFilter://b:pattern` 失效问题
2. refactor: 鉴于低版本 Node 的 HTTP/2 模块 bug比较多，统一调整为 `Node v12.12.0` 及以上版本才会支持 HTTP/2

# v2.4.15
1. chore: 去掉安装过程中的 `warning`

# v2.4.14
1. style: Frames 页面新增 Overview Tab 用于查看帧数据的基本信息
2. style: Frames 里面二进制数据字体加粗

# v2.4.13
1. fix: Express 框架默认添加的 `x-powered-by` 响应头：https://github.com/avwo/whistle/issues/395

# v2.4.12
1. fix: 部分网站可能出现的 `ERR_HTTP2_SESSION_ERROR`

# v2.4.11
1. feat: 支持 post 等包含请求内容的https请求自动降级到http请求（如果不支持https服务的话）

# v2.4.9
1. refactor: 优化远程规则更新机制，防止误判拉取失败，导致远程规则被情况
2. feat: 支持通过 `-M disableUpdateTips` 禁用版本升级通知（一般用于集成 whistle 的第三方应用）

# v2.4.8
1. fix: 本地 hosts 文件没配 `127.0.0.1 localhost` 可能导致https请求失败问题
2. feat: HTTP2 的 `DELETE` 请求如果携带请求内容，则自动降级为 http/1.1，否则会出现 400 或 忽略请求内容

# v2.4.7
1. fix: https://github.com/avwo/whistle/pull/383
2. refactor: HTTP/2 支持 delete 请求携带 body
3. style: `HTTPS > View custom certs info` 支持高亮显示过期证书，且支持 copy 证书安装路径
3. fix: 设置 `reqBody://(xxxx) method://post` 无法同时生效问题

# v2.4.6
1. fix: https://github.com/avwo/whistle/issues/380

# v2.4.5
1. feat: 添加 `internal-http-proxy` 大致功能与 `internal-proxy` 一致，只是前者针对 websocket 请求使用的是 tunnel 代理，而后者使用直接 upgrade 请求

# v2.4.4
1. refactor: 传给 Composer 的响应数据改成 base64
2. refactor: 支持从请求 headers 里面的规则解析出 pipe 规则

# v2.4.3
1. fix: 使用 `pipe` 时请求异常导致没有捕获问题，及 http 请求 pipe 失效问题
2. style: 支持在 Overview 里显示 HTTPS 自动转 HTTP 所消耗的时间
3. fix: 调整 `includeFilter` 和 `excludeFilter` 匹配方式，需要满足所有 `includeFilter` 中的一个，且不能匹配到任何 `excludeFilter`，即 `excludeFilter://p1 excludeFilter://p2 includeFilter://p3 includeFilter://p4` 相当于 `!(p1 || p2) && (p3 || p4)`

# v2.4.2
1. fix: 启用 `--socksServer port` 后请求出现异常可能导致程序 crash 问题

# v2.4.1
1. refactor: 支持显示saz文件里面的非文本内容
2. feat: 添加启动参数 `-M safe` 开启安全模式，安全模式下会对服务端的证书进行校验，如果本地的根证书链不支持，则请求会报 `unable to verify the first certificate`，参见：https://github.com/avwo/whistle/issues/368
3. fix: Network 搜索过滤可能出现重复数据的问题

# v2.4.0
1. fix: 上个版本引入的配置 host 出错问题

# <del>v2.3.8</del>
> 该版本有bug，请用最新版本

1. refactor: 优化 IPv6 配置
2. refactor: 去掉多余的接口

# v2.3.7
1. style: Network 的 `URL` 支持修改宽度（个人体验考虑其它列暂时不支持修改宽度）
2. refactor: websocket 如果返回非 101 状态，则透传给浏览器

# v2.3.6
1. refactor: 添加 `package-lock.json`
2. perf: 引入 [react-virtualized](https://github.com/bvaughn/react-virtualized) 极大提升列表性能，详见：https://github.com/avwo/whistle/pull/358
3. feat: 调整列表长度，默认支持同时显示 1500 条抓包数据，可以通过 Network > Filter > Max Rows Number 调整大小

# v2.3.5
1. refactor: 在之前版本设置 `log://xxx weinre://xxx` 时，为了防止把注入都js缓存到浏览器，whistle 会自动删除缓存的响应头，即使设置了 `cache://xxx` 也无用，新版以 `cache://xxx` 优先级最高，并支持通过设置 `cache://reserve` 强制保留原来的请求头
2. refactor: 某些 Node 版本会出现某些 socket 没有没有监听 `error` 事件，这里会强制设置一个空的 errorHandler，防止异常抛出
3. fix: 非 SNI 的 https 请求无法解包问题
4. fix: 设置代理重试后重复添加路径问题

# v2.3.4
<del>v2.3.3</del>
1. style: 修复同时安装的插件可能出现排序跳动问题

# v2.3.2
1. fix: WebSocket 请求采用 `internal-proxy://host:port` 时无法准确带上 clientIp 的问题
2. feat: 支持通过设置 `enable://strictHtml` 可以在使用 `htmlXxx, jsXxx, cssXxx` 注入内容到html页面时，会先判断是否第一个非空白字符是 `<` 才会注入
3. feat: 支持通过设置 `enable://safeHtml` 可以在使用 `htmlXxx, jsXxx, cssXxx` 注入内容到html页面时，会先判断是否第一个非空白字符不是是 `{{` 才会注入 （用于统一给某个域名的页面注入脚本等时，防止一些非标准等接口响应类型设置为html，导致误注入的问题）
4. feat: 支持通过启动参数 `-M noGzip` 禁用所有请求的 `gzip` 功能
5. perf: 限制 zlib 的并发量，减少内存泄露（原因参见：	[https://github.com/nodejs/node/issues/8871#issuecomment-250915913](https://github.com/nodejs/node/issues/8871#issuecomment-250915913)）

# v2.3.1
1. fix: 修复 `x-forwarded-for` 混乱问题，直接请求默认不带 `x-forwarded-for`（代理转发会自动带上非本地IP），可以通过 `forwardedFor://ip` 或 `reqHeaders://x-forwarded-for=ip` 自定义 `x-forwarded-for`
2. style: https://github.com/avwo/whistle/issues/354
3. feat: 插件新增方法 `optins.isEnable((enable) => {})` 获取插件是否处于启用状态
4. feat: 插件的 `rules.txt`、`_rules.txt`、`values.txt`、`resRules.txt` 文件支持设置占位符 `{{whistlePluginName}}` 获取插件的短名称（不包含 `whistle.`）, 以及通过 `{{whistlePluginPackage.xx.yy.zzz}}` 获取插件 `package.json` 的值

# v2.3.0
1. feat: `@url` 请求时自动带上 `x-whistle-runtime-id` 便于插件判断请求是否来自宿主代理
2. fix: https://github.com/avwo/whistle/issues/352
3. fix: 修复 HTTP2 模块对http2请求响应格式要求过于严格，导致某些网站http2请求失败问题

# v2.2.4
1. feat: 支持通过启动命令行参数添加规则
	``` txt
	# 从 https://xxx 加载规则，如果远程规则有更新也会自动同步更新
	w2 start -r "@https://xxx"

	# 从本地绝对路径 filepath 加载规则，如果文件有更新也会自动同步更新
	w2 start -r "@filepath"

	# 直接设置规则
	w2 start -r "www.test.com/path/to reqHeaders://x-test=1"
	```
	> 组合设置 JSON.stringify('@https://xxx\n@filepath\nwww.test.com/path/to reqHeaders://x-test=1')

# v2.2.3
1. feat: 部分在响应阶段才会执行的规则放到请求响应后再做匹配
2. style: `Networt > HTTPS > Enable HTTP/2` 去选后接收和发送请求的方式都改用非 H2

# v2.2.2
1. fix: https://github.com/nodejs/node/issues/27384
2. refactor: 优化 H2 session 缓存策略

# v2.2.1
1. refactor: 去掉请求超时设置

# v2.2.0
1. feat: 支持通过 `Network -> HTTPS -> Enable HTTP/2` 关闭或开启 HTTP/2 请求，可以通过 `pattern enable://h2` 局部开启 HTTP/2
2. refactor: 支持自动检测 `xxx.har` 文件是否使用base64编码
3. fix: 修复了内部请求重试可能导致死循环的问题

# v2.1.3
1. style: Composer 里面支持自定义方法
2. perf: 减少h2的session数，每个客户端到h2 session可以完全复用

# v2.1.2
1. feat: 多行形式的 JSON 对象支持设置数组及多层嵌套的值
		
	`v2.1.1` 及以前版本以下内联对象文本不支持数组及多层嵌套
	````
	``` test
	[1]: "test"
	[10]: 1
	```
	````
	``` txt
	xxx.test.com resMerge://{test}
	```
	上述文本会转成对象：
	``` txt
	{
		"[1]": "test",
		"[10]": 1
	}
	```

	而 `v2.1.2` 版本开始，上述文本会转成
	```
	var arr = [];
	arr[1] = 'test';
	arr[10] = 1;
	```
	更复杂的规则：
	````
	``` test
	[a.b[3].c]: abc
	```
	````
	等价于
	``` 
	{"a": { b: [undefined, undefined, {
		c: "abc"
	}]}}
	```
	> 如果不希望进行自动转义，可以使用双引号 `"[xxx.yyy[n]]"`
	2. feat: 添加在域名中 `.` 匹配模式
		``` txt
		.test.com 表示匹配 x.test.com 与 test.com
		*.test.com 表示匹配 x.test.com，不匹配 test.com
		**.test.com 表示匹配 x.test.com 及其所有子孙代域名
		***.test.com 表示匹配 test.com 及其所有子孙代域名
		上述匹配可以加协议及路径进行更精确代匹配 `http://.test.com/path/to/*`
		```

# v2.1.1
1. fix: 修复自定义插件hint时，如果只有一个补全数据不显示的问题，以及请求和响应内容为空时不显示大小的问题
2. style: Overview 里面支持显示gzip前后的大小
3. feat: 支持通过环境变量 `env.WHISTLE_PLUGIN_EXEC_PATH` 或启动参数 `-M buildIn` 设置 fork whistle 插件进程的 Node 路径 （默认为全局 Node ）

# v2.1.0
1. fix: 修复url替换 `url replacementUrl` path取错问题

# v2.0.0
1. feat: **支持 HTTP2 功能**
	> 请确保运行的 Node 版本为 [LTS(>= 10.16.0) 或 Stable(>= 12.12.0) 的最新版本](https://nodejs.org/en/)，否则可能会出现一些异常，如：[#24037](https://github.com/nodejs/node/issues/24037)、[#24470](https://github.com/nodejs/node/issues/24470)
2. feat: `**/path/to` 如果 `path/to` 里面包含 `*`，如 `*/cgi-*`，则等价与 `^*/cgi-*`

# v1.17.1
1. fix: 引入Http2导致请求abort后浏览器无法收到断开的指令
2. refactor: `enable://proxyHost` 支持显示真实的请求ip

# v1.17.0
1. feat: 浏览器和 whistle 之间支持通过 HTTP2 建立连接，（**需要把 [Node](https://nodejs.org) 更新到 `v10.16.0` 及以上版本**）
2. refactor: 调整连接缓存策略，任何连接不做长缓存，减少内存占用
3. fix: 长连接获取clientIp失败问题

# v1.16.13
1. fix: 模板字符串 `${whistle.xx.repalce(p,v)}` 失效问题

# v1.16.12
1. feat: 支持通过 `reqRules://file|values|inlineValues` 及 `resRules://file|values|inlineValues`  批量设置规则
2. fix: Composer切换到 pretty 模式时无法设置换行符问题
3. fix: 某些Node版本（如：`v10.16.2` 在部分Mac机型上）可能存在bug，会出现一些异常无法让程序捕获捕获导致程序crash问题

# v1.16.11
1. fix: https://github.com/avwo/whistle/issues/329

# v1.16.10
1. refactor: 优化后缀匹配规则 `^.js`，避免匹配域名，且支持直接配置 `.js`
2. feat: 支持扩展Network的右键菜单，具体参见：[插件开发](http://wproxy.org/whistle/plugins.html)

# v1.16.9
1. fix: `head` 请求按规范不允许注入及返回响应内容，详见： https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.4
2. feat: 模板字符串支持通过 `${{key}}` 的方式自动 `encodeURIComponent` 内容
3. feat: 支持通过 `^.xxx` 匹配url文件后缀为 `xxx` 的请求

# v1.16.8
1. fix: 无法用 `/...whistle-path.5b6af7b9884e1165...///` 内部路径访问插件的 WebSocket 服务问题
2. perf: 减少轮询接口输出的无用内容

# v1.16.7
1. feat: 插件新增 `options.updateRules()` 用于立即更新通过 `@whistle.xxx/path/to` 引入的规则
2. feat: 新增方法 `proxy.setUIHost(host)`、`proxy.setPluginUIHost(name, host)` 方便第三方动态设置whistle或其插件ui的域名

# v1.16.6
1. feat: 支持在插件到 `server` hooks 到 `req.request([uri, ]cb[, opts={host, port, rules}])` 到方式自定义请求目标及设置响应rules
2. perf: WebUI到js文件开启gzip压缩，减少传输的文件大小，提升页面打开速度
3. refactor: 调整UI展示的js文件内容大小（0.5m -> 1.5m）
4. fix: 修复 `WebSocket Proxy` 及 `includeFilter://xxx excludeFilter://xxx` 但一些bug

# v1.16.5
1. feat: 插件列表添加 `Sync` 按钮可用于获取插件的规则或值并设置到界面的Rules或Values
2. feat: 支持通过插件 package.json 配置 `"whistleConfig: { "hintUrl": "/cgi-xxx/xxx" }"`  等方式自定义自动补全列表功能
3. feat: 支持通过 `req.sessionStorage.[get|set|remove]` 实现插件各个server hooks之间的数据传递

# v1.16.4
1. fix: https://github.com/avwo/whistle/issues/316

# v1.16.3
1. fix: https://github.com/avwo/whistle/issues/316
2. fix: 通过 `w2 i @org/whistle.xxx` 安装的插件无法执行 `w2 run xxx` 的问题
3. fix: 安装插件可能导致whistle crash问题

# v1.16.2
1. fix: `Composer` 面板里面的 `Rules` 禁用后无法开启的问题
2. feat: 支持通过 `w2 run --inspect` 或 `w2 run --inspectBrk` 开启调试模式

# v1.16.1
1. feat: 支持通过 uiurl#network?name=h&value=v&name1=h1&value1=v1&...&name5=h5&value5=v5 根据多个请求头过滤抓包数据
2. refactor: 支持 `pattern host proxy://xxx enable://proxyHost` 如果出现tls错误自动降级到http请求

# v1.16.0
1. feat: 支持插件通过 `options.getRules(cb), options.getValues(cb), options.getCustomCertsInfo(cb)`，分别获取插件Rules、Values、自定义证书信息
2. style: HTTPS菜单的对话框添加 `View custom certs info` 按钮，用于查看自定义证书状态（是否过期等）
3. fix: WebSocket请求无法设置 `reqDelay://msNum` 的问题

# v1.15.16
1. fix: http请求访问某些上游代理服务器返回400问题

# v1.15.15
1. fix: https://github.com/avwo/whistle/issues/310
2. feat: 插件新增 `req.originalReq.relativeUrl` 获取匹配后拼接的url

# v1.15.14
1. feat: 支持 `^***/path/to` 及 `***/path/to` 匹配所有类似 `https://www.test.com/xxx/.../path/to` 的url
2. fix: 使用代理及 `x-whistle-real-host` 穿透nginx时出现的nginx可能读取原始host的问题

# v1.15.13
1. feat: 支持通过 `x-forwarded-host` 或 `x-whistle-real-host` 自定义请求的host，方便通过Nginx的反向代理到whistle
2. feat: 支持通过 `enable://proxyFirst` 调整 proxy 配置的优先级高于 host （默认：host > proxy）

# v1.15.12
1. perf: 优化请求失败重试机制
2. fix: 解决插件里面调用 `req.request(options)` 时再次触发 `statsServer` 等问题 

# v1.15.11
1. refactor: 支持捕获插件的 `unhandledRejection` 异常
2. refactor: 调整url匹配的请求参数追加方式：
	``` txt
	# 配置
	www.test.com?2 www.abc.com?abc
	www.test.com www.abc.com?abc

	# 原来的效果
	www.test.com?123 -> www.test.com?abc123
	www.test.com?234 -> www.test.com?abc34
	# v 1.15.11+ 的效果
	www.test.com?123 -> www.test.com?abc&123
	www.test.com?234 -> www.test.com?abc&34
	```
3. feat(https://github.com/avwo/whistle/issues/303): 支持通过 `style://color=!xxx&fontStyle=xxxxx&bgColor=red` 设置请求的字体颜色/样式/背景颜色
4. style: Frames 支持通过 `Ctrl[Command] + X` 清空列表


# v1.15.10
1. fix: 解决在Windows系统里面无法用 `w2 install whistle.xxx` 安装插件的问题，以及异步加载插件顺序问题

# v1.15.9
1. refactor: 支持通过自定义相对路径加载插件，`w2 start -A ./plugins`
2. style: 修复界面checkbox对齐问题

# v1.15.8
1. refactor: 优化默认超时时间 3m -> 1h
2. refactor: 调整最大连接数 60 -> 256
3. perf: 优化重试逻辑，减少内存占用

# v1.15.7
1. perf: 优化监听连接的关闭事件，减少内存占用
2. refactor: 使用Values设置rawfile时，自动删除 `content-encoding` 响应头
3. fix: 安装插件 `w2 i @org/whistle.xxx` 出现报错问题

# v1.15.6
1. perf: 优化搜索框的性能
2. refactor: 优化 `w2 install` 和 `w2 uninstall`，避免卸载失败
3. perf: 解决了一些长连接无法及时清理导致的内存占用过高问题

# v1.15.5
1. fix: `w2 uninstall` 在windows里面无法执行的问题

# v1.15.4
1. fix: 修复 `w2 install` 会删除其它已存在插件的问题

# v1.15.3
1. style: `Frames` 搜索支持忽略大小写
2. refactor: Node 11及以上版本禁用请求连接复用，这些版本在复用请求连接时会导致复用的连接意外断开

# v1.15.2
1. refactor: 启动时如果不设置 `-H boundHost`，默认检测在 `127.0.0.1` 的端口是否被占用，如果被占用会报错（可以通过启动参数 `-M INADRR_ANY` 禁掉）
2. feat: 支持通过命令行参数 `-M rules` 启动无抓包页面模式，这种模式下UI将看不到Network，无法抓包且插件无法通过 `req.getSession(cb)` 获取抓包数据
3. feat: 支持通过 `w2 install xxx` 或 `w2 i xxx` 的方式安装插件，如果用 cnpm 或 tnpm 安装可以采用 `w2 ti xxx` 或 `w2 ci xxx`，也可以指定 registry：`w2 i xxx --registry=https://r.npm.taobao.org`
4. feat: 支持通过 `w2 uninstall xxx` 的方式卸载通过 `w2 install xxx` 安装的插件
5. feat: 支持通过 `w2 run xxx ...` 或 `w2 exec xxx ...` 执行命令行命令

# v1.15.1
1. fix: 页面脚本错误（该错误不影响使用）
2. refactor: Node 11及以上版本禁用请求连接复用，这些版本在复用请求连接时会导致复用的连接意外断开
3. refactor: 优化搜索whistle插件的路径，增加搜索目录，减少插件搜索不到的问题

# v1.15.0
1. feat: 支持通过命令行参数 `--socksPort 1080` 启动指定监听端口的socks v5服务（目前只支持普通tcp请求，udp请求还有ftp请求的带来暂不支持）
2. feat: 插件server添加了 `req.passThrough()`，`req.request(url/options, cb)`，	`req.writeHead(code, message, headers)` 等方法用于将插件里面的请求转发到指定服务

# v1.14.10
1. refactor: 调整 `pipe://plugin` 的实现，支持通过pipe获取请求或响应内容，再传给 `rulesServer` 或 `resRulesServer` 

# v1.14.9
1. perf: 优化 Network 列表的性能

# v1.14.8
1. feat: 新增命令行参数 `--httpPort` 和 `--httpsPort`，分别用于启动普通的 http 和 https server，方便做反向代理，且可用于再启动一个 `http proxy` （跟默认的 http 代理功能一致）和 `https proxy` （可作为https代理服务器） 功能
	> 应用实例：`w2 restart --httpPort 80 --httpsPort 443`，这样通过配系统host就可以抓包到无法设置代理的 app 请求包
2. feat: 支持将自定义证书或根证书(`root.crt` & `root.key`) 存在 `~/.WhistleAppData/custom_certs` 目录里面，whistle会优先使用该目录的证书
	> 也可以通过命令行参数 `-z /custom/certs/dir/xxx` 指定自定义证书的目录
3. feat: 支持在插件所在目录启动 `w2 run` 时，自动加载当前目录的所有插件，方便调试插件
4. fix: https://github.com/avwo/whistle/issues/292

# v1.14.7
1. refactor: 优化启动参数 [--max-http-header-size=size](https://nodejs.org/dist/latest-v10.x/docs/api/cli.html#cli_max_http_header_size_size) 

# v1.14.6
1. fix: `querystring.parse('+')` 自动转转成空格 ' ' 或 %2B 问题
2. refactor: `w2 add` 如果当前规则已存在，则选中该规则
3. feat: 支持通过请求头 `x-forwarded-proto` 设置 `http` 或 `https` 请求

# v1.14.5
1. fix: `jsPrepend://url`、`cssPrepend://url` 无法同时设置多个的问题
2. feat: 支持通过设置 `pattern disable://hide` 禁用 `pattern enable://hide`
3. feat: 新增 `headerReplace://` 协议，用来通过字符串或正在替换指定关键字，详见：[headerReplace](https://avwo.github.io/whistle/rules/headerReplace.html)
4. perf: 优化内存占用

# v1.14.4
1. perf: 固定的缓存长连接数，减少大规模访问是连接数缓存太多导致的内存占用过多问题
2. fix(pipestream): stream内部缓存堆积问题 

# v1.14.3
1. fix: `stream.write()` 无返回缓存状态导致缓存堆积问题

# v1.14.2
1. refactor: 请求上游代理的 `UA` 默认使用当前请求的 `UA`
2. refactor: 通过命令行 `-M strict` 设置的严格模式下，限制每个包的缓存大小 (这个参数一般用于部署访问量比较大的公共服务时使用，一般用户不要设置)

# v1.14.1
1. fix: https://github.com/avwo/whistle/issues/285

# v1.14.0
1. feat: `Log` 改成 `Tools`，并新增 `ToolBox` 里面集成：生成二维码、查看JSON对象、生成图片生成Base64的工具
2. feat: 新增 [pipe](http://wproxy.org/whistle/rules/pipe.html) 功能，可以把http[s]、websocket、tunnel请求数据流pipe到插件，插件可以自定义对数据流的解包及组包，具体参见：http://wproxy.org/whistle/rules/pipe.html
3. fix: 上个版本导致的tunnel代理path设置出错问题

# v1.13.28
1. style: Plugins添加 `UpdateAll` 按钮，方便获取更新所有有新版本插件的命令
2. fix: whistle集群内部路径跳转问题
3. fix: 设置代理时SNI出错问题

# v1.13.27
1. feat: 支持通过日志级别过滤日志内容
2. style: 支持设置 `pattern enable://clientId|mutilClient` 启用请求带上clientId
3. style: [log](http://wproxy.org/whistle/rules/log.html) 添加钩子 `window. onBeforeWhistleLogSend(result, level)` 用于自定义显示的日志内容，可以用来添加一些自定义详细日志信息
4. feat: 支持通过 `pattern enable://gzip` 强制开启 `gzip` 模式

# v1.13.26
1. feat: 支持上传文件作为规则配置，解决远程部署是无法在Values设置大块内容的问题，详见：http://wproxy.org/whistle/webui/files.html
2. feat: 支持显示包含WebSocket帧数据的saz文件
3. feat: Log里面支持设置是否展开json对象的根节点

# v1.13.25
1. fix: 将weinre或log注入到缺少分号的js文件中出现的脚本错误问题
2. refactor: 插件里面每个钩子占用一个随机端口改成整个插件最多只占用一个随机端口
3. refactor: 优化插件配置 `whistle.xxx://value` 与 `xxx://value` 等价(无实现server钩子的情况下)
4. refactor: 优化 [excludeFilter](http://wproxy.org/whistle/rules/filter.html) 和 [includeFilter](http://wproxy.org/whistle/rules/filter.html) 
5. feat: 插件的uiServer支持WebSocket连接

# v1.13.24
1. fix: 重新设置port可能导致插件里面的 `req.getSession(cb)` 的回调无法执行问题

# v1.13.23
1. fix: https://github.com/avwo/whistle/issues/271

# v1.13.22
1. fix: http协议的websocket请求无法获取真实clientIp问题

# v1.13.21
1. feat: webui直接复用whistle的端口，不再独占一个端口，所以默认不再支持通过类似 `http://127.0.0.1:8900` 的方式访问ui，只能通过类似 `http://127.0.0.1:8899` 的方式访问(其中 `8899` 为代理端口)，如果需要ui另起一个端口，可以通过启动命令行参数 `-P xxxx` 设置
2. feat: 直接通过whislte模块起服务时，支持获取server对象
	```
	const startWhistle = require('whistle');
	const proxy = startWhistle({...});
	console.log(proxy.server)
	```
3. feat: 显示所有响应内容(之前版本对二进制内容默认不显示)
4. perf: 优化内部请求解析流程，提升whistle处理性能

# v1.13.20
1. fix: 替换带端口的url后 `req.headers.host` 的显示问题

# v1.13.19
# v1.13.18
1. feat: 命令行添加 `--no-prev-options` 启动选项，支持通过 `w2 restart` 时不复用先前设置的选项
2. refactor: 插件的内部规则 `_rules.txt` 改成 `reqRules.txt`
3. fix: `www.test.com http://127.0.0.1:3000 log://` log不生效问题

# v1.13.17
1. feat: 本地替换新增响应206功能，支持iOS播放本地替换的视频文件

# v1.13.16
1. fix: [jsBody](http://wproxy.org/whistle/rules/jsBody.html)失效问题
2. style: 精简Network的右键菜单

# v1.13.15
1. fix: 页面设置 `<meta http-equiv="Content-Security-Policy" content="script-src *.qq.com *.gtimg.cn *.gtimg.com 'unsafe-inline' 'unsafe-eval';"/>` ，导致 [log](http://wproxy.org/whistle/rules/log.html) 和 [weinre](http://wproxy.org/whistle/rules/weinre.html) 失效
2. fix: `ServerPort` 显示问题及设置 `proxy://host:port?host=ip:port2 pattern` 时带上默认端口号问题（https: 443，http: 80）

# v1.13.14
1. style: HexView添加 `CopyHex` 按钮，支持Copy纯二进制
2. feat: Frames/Composer支持输入HexText

# v1.13.13
1. feat: 插件支持通过package.json配置 `"pluginHomepage": "http://xxx.xxx.com/"` 自定义UI URL
2. fix: 在iOS12里面log无法显示 `error.message` 的问题，参见：https://github.com/avwo/whistle/issues/257
3. refactor: 优化插件错误输出，支持显示初始化错误

# v1.13.12
1. feat: 支持通过请求内容过滤 `pattern operation filter://b:pattern`
2. feat: [log](http://wproxy.org/whistle/rules/log.html)支持注入 `whistle.onWhistleLogSend(level, logStr)` 获取页面日志信息自己做上报
3. perf: 去掉本地请求的连接缓存，优化本地请求速度

# v1.13.11
1. fix: `pattern host://{key1}` 和 `pattern proxy://{key2}` 失效问题

# v1.13.10
1. refactor: 解决[log](http://wproxy.org/whistle/rules/log.html)里面显示循环引用对象的问题
2. feat: 支持 `Stop Record`（默认）与 `Pause Record`，前者已存在，会忽略后续的抓包数据，后者只是暂停

# v1.13.9
# <del>v1.13.8</del>
1. fix: [includeFilter](http://wproxy.org/whistle/rules/filter.html)、[excludeFilter](http://wproxy.org/whistle/rules/filter.html)无法匹配请求头问题，已经里面正则导致子匹配失效问题

# v1.13.7
1. perf: 优化界面性能
2. style: Frames里面的 `AutoRefresh` 改为 `Record`
3. fix: 页面Frames里面数据帧可能丢失的问题

# v1.13.6
1. style: Log里面的 `AutoRefresh` 改为 `Record`
2. refactor: 不导出被过滤掉的日志
3. refactor: `reqCors://*` 等价于 `reqCors://origin=*`
4. feat: Network里面的右键菜单添加过滤快捷键，可以快速过滤指定域名或url
5. feat: Network里面的Filter拆分成 `Exclude Filter` 和 `Include Filter`，分别用于设置不显示的抓包数据和要显示的抓包数据，具体功能参见：[webui/filter](http://wproxy.org/whistle/webui/filter.html)
6. feat: [filter](http://wproxy.org/whistle/rules/filter.html) 分拆成语义更明确的 [excludeFilter](http://wproxy.org/whistle/rules/filter.html) 和 [includeFilter](http://wproxy.org/whistle/rules/filter.html)，且新增了通配符匹配

# v1.13.5
1. fix: 导入saz文件 `Set-Cookie` 等重名头部覆盖问题
2. feat: 支持导入导出日志文件
3. feat: `AutoRefresh` 改成 `Record`，可以手动关闭请求后台数据

# v1.13.4
1. fix: Network隐藏是按F12切换详情面板时高度可能变成0
2. refactor: 支持插件更新提醒
3. feat: Composer新增历史记录按钮，可以查看在Composer里请求过的记录
4. feat: 避免一行配置过程，该版本引入换行功能
	```
	www.test.com file://(test) filter://*/cgi-bin
	# 等价于
	line`
	www.test.com file://(test)
	filter://*/cgi-bin
	`
	# 或
	line`
	www.test.com
	file://(test)
	filter://*/cgi-bin
	`
	```

# v1.13.3
1. feat: `***.xxx.com` (3个 `*` 及以上功能相同) 等价于 `**.xxx.com` + `xxx.com`，`^***.xxx.com` 同理
2. feat: 模板字符串支持通过 `${xxx.replace(,defaultValue)}` 设置默认值
3. feat: 支持切换详情右侧详情面板到底部
4. perf: 缓解页面切换Inspectors时卡顿问题

# v1.13.2
1. style: 调整 `AutoRefresh` 的位置， `Abort` 按钮图标加警告色 
2. feat: 在顶部菜单栏的 `Replay` 按钮下拉菜单添加 `Abort` 按钮，支持Abort掉处于pending状态的请求
	![Abort](https://user-images.githubusercontent.com/11450939/48121171-30c26300-e2af-11e8-842c-7b3c7c7e6067.png)

# v1.13.1
1. fix: 启用 `customParser` 且延迟延迟响应可能导致连接自动断开的问题
2. style: 高亮显示插件的 `EnableAll` 按钮

# v1.13.0
1. feat: 支持通过插件的 `tunnelServer` 及设置 `enable://customParser` 对tunnel请求(即：tpc请求或未拦截的https、websocket请求)自定义解包组包，参见：[whistle.custom-parser](https://github.com/whistle-plugins/whistle.custom-parser)
2. feat: 支持在插件里面添加 `resRules.txt` 文件，用于设置静态规则，功能相当于 `resRulesServer` 吐出的规则
3. feat: 支持在模板字符串里面获取插件规则的值 `pattern whistle.xxx://ruleValue` ，可以在插件的 `_rules.txt` 的模板字符串里面 `${whistle.xxx}` 获取 `ruleValue`，具体参见：[whistle.inspect](https://github.com/whistle-plugins/whistle.inspect/) 

### v1.12.17
1. feat: 插件列表添加 `Uninstall` 按钮，用于展示协助插件的方法
2. refactor: 搜索列表时暂停自动滚动
3. fix: `reqHeaders://Host=xxx.com` 的 `Host` 不支持忽略大小写的问题 
4. fix: 内联 `Value` 可能被清空的问题

### v1.12.16
### v1.12.15
1. fix: `www.test.com file:///User/xxx/test/` 配置 `http://www.test.com/?id=xxx` 无法匹配 `/User/xxx/test/index.html` 问题

### v1.12.14
1. fix: `ignore://host|xxx` 用 `|` 同时配置多个忽略属性失效的问题
2. fix: 启用 `Back rules first` 且规则配置为空导致启动失败的问题[https://github.com/avwo/whistle/issues/230](https://github.com/avwo/whistle/issues/230))

### v1.12.13
1. feat: 支持从本地路径自动加载规则 `@~/xxx/test.txt`
2. feat: 支持从插件接口加载规则：` @whistle.nohost/cgi-bin/global-rules`
3. feat: 支持禁用响应内容压缩 `pattern disable://gzip`
4. feat: [模板字符串](http://wproxy.org/whistle/data.html)支持`replace`，且支持子匹配
	```
	pattern protocol://`${search.replace(pattern1,replacment)}`
	www.test.com file://`${search.replace(/Course_(id)\,?/ig,$1cid)}${test.html}`
	```
	`pattern1` 为正则或普通字符串(不需要加引号)

> 其它功能参见：[@](http://wproxy.org/whistle/rules/@.html)

### v1.12.12
1. feat: 支持在Rules里面通过以下方式内联多行的Value:
		
		``` test.js
		alert(1);
		console.log(2);
		// do sth
		```
	上述配置表示key为 `test.js`，value为:
	```
	alert(1);
		console.log(2);
		// do sth
	```
	这样可以通过类似以下方式引用该Value：
	```
	pattern protocol://{test.js}
	```
	
### v1.12.11
1. refactor: [reqCookies](http://wproxy.org/whistle/rules/reqCookies.html)、[resCookies](http://wproxy.org/whistle/rules/resCookies.html)里面的Value如果都为latin1字符则不进行encodeURIComponent
2. refactor: debug状态下插件支持输出异步错误

### v1.12.10
1. feat: 支持通过在Rules配置中 `@https://rules.host.com/xxx` 的方式远程自动加载规则（支持http和https请求，直接返回规则配置）
2. feat: 支持启动参数设置 `shadowRules`（只支持作为第三方模块传入，不支持命令行方式传入）
3. fix: 修复 [filter://pattern](http://wproxy.org/whistle/rules/filter.html) 只能同时生效两个的问题

### v1.12.9
1. feat: 支持在规则里面用模板字符串，具体内容参见：[操作值](http://wproxy.org/whistle/data.html)
2. style: 修改编辑器的字体，以便更好显示模板字符串

### v1.12.8
1. fix: Composer和Inspectors里面的Response可能出现联动的问题
2. feat: [resCookies](http://wproxy.org/whistle/rules/resCookies.html)支持设置[SameSite](https://www.owasp.org/index.php/SameSite)

### v1.12.7
1. refactor: 调整抓包数据缓存策略，优化内存占用
2. feat: 支持在Rules、Values、JSONView里面按住 `Ctrl[Command]+鼠标点击` 在新窗口打开链接
3. feat: [resScript](http://wproxy.org/whistle/rules/resScript.html)协议支持 `filter://s:404`、`filter://resHeader:key=value`、`filter://serverIp:ip`

### v1.12.6
1. style: 优化Composer，支持展示 `Response` 数据
2. feat: 支持通过 `filter://m:methodName`、`filter://i:clientIp`、`filter://h:key=subValue` 过滤规则，及支持取非 `filter://m:!methodName`、`filter://i:!clientIp`、`filter://h:key!=subValue`，`value` 也可以用正则 `/xxx/` 或 `/xxx/i` 替代
3. feat: 删除对 `whistle-ssl` 特性的支持


### v1.12.5
1. refactor: 支持 `delete` 请求传递请求body
2. feat: 支持配置IPv6的host，如：`pattern [fe80::2c6a:87c9:2ceb:d047]:8099` 或 `pattern fe80::2c6a:87c9:2ceb:d047`

### v1.12.4
1. fix: [proxy](http://wproxy.org/whistle/rules/proxy.html)设置的用户名和密码无法生效的问题

### v1.12.3
1. perf: 优化显示大文本的性能
2. feat: 添加[https-proxy](http://wproxy.org/whistle/rules/https-proxy.html)协议，支持设置请求转发到上游https代理服务器
3. feat: 为简化whistle的规则配置，该版本会删除以下使用比较少或配置比较复杂，且可以用其它方案替代的协议，点击链接可以查看替代方案：
	- [dispatch](http://wproxy.org/whistle/rules/dispatch.html)
	- [hostname](http://wproxy.org/whistle/rules/hostname.html)
	- [etag](http://wproxy.org/whistle/rules/etag.html)
	- [accept](http://wproxy.org/whistle/rules/accept.html)
	- [location](http://wproxy.org/whistle/rules/location.html)
	- [req](http://wproxy.org/whistle/rules/req.html)
	- [res](http://wproxy.org/whistle/rules/res.html)

### v1.12.2
1. fix: 选中状态自动更新可能会自动切换Changed状态
2. style: 微调背景色，保持与 `Chrome 69+` 主色调一致
3. refactor: `^/cgi-` 等价于 `^**/cgi-`

### v1.12.1
1. style: Composer失败时会弹框提醒
2. feat: 支持在 `Rules > Settings > Back rules first` 调整规则的优先顺序，默认从上到下，其中Default里面的规则优先级最低，这个设置只对在Rules配置的规则生效，对reqScript和插件设置的规则不生效

### v1.12.0
1. feat: 删除协议 `exports://` 和 `exportsUrl://`，请用更灵活方便的插件获取：[插件开发](http://wproxy.org/whistle/plugins.html)
2. feat: 支持插件里面获取WebSocket和socket请求的帧数据，详见：[插件开发](http://wproxy.org/whistle/plugins.html)

### v1.11.4
1. style: 解决Mac下 `Ctrl+F` 冲突问题
2. feat: Overview支持只显示匹配的规则
3. feat: 支持在插件获取请求数据，具体参见：[插件开发](http://wproxy.org/whistle/plugins.html)
4. fix: 处理 `socket hand up` 错误

### v1.11.3
1. feat: 调整规则匹配机制，一些协议支持同时匹配多个：ignore, enable, filter, disable, plugin, delete, urlParams, params, reqHeaders, resHeaders, reqCors, resCors, reqCookies, resCookies, reqReplace, urlReplace, resReplace, resMerge, reqBody, reqPrepend, resPrepend, reqAppend, resAppend, resBody, htmlAppend, jsAppend, cssAppend, htmlBody, jsBody, cssBody, htmlPrepend, jsPrepend, cssPrepend，更多协议参见：[协议列表](https://avwo.github.io/whistle/rules)

### v1.11.2
1. feat: 支持给上游代理转发的请求设置hosts：`pattern proxy://ip:port?proxyHost` 或 `pattern enable://proxyHost` 或 `pattern proxy://ip:port?host=ip:port`
2. feat: 添加 `xhost://...` 功能同 `host://...`，前者如果发现服务没起来，会自动请求现网
3. refactor(UI): 默认主题的host高亮显示，判断离线机制等，WebSocket返回失败预览等。 

### v1.11.1
1. fix: 精确匹配无法带上请求参数的问题
2. fix: Network空白处无法弹出右键菜单问题
3. feat: 支持右键菜单打开预览图片
4. feat: websocket和socket请求支持Pause、Ignore、Composer、Replay, Abort操作

### v1.11.0
1. feat: https请求自动降级([https://github.com/avwo/whistle/issues/176](https://github.com/avwo/whistle/issues/176))
2. feat: 支持显示HexView（二进制）
3. feat: 支持远程导入Sessions/Rules/Values，通过 `Shift + Export按钮`
4. feat: 支持在新窗口预览HTML页面
5. fix: 导入saz文件时把https请求自动转成http请求的问题
6. refactor: 导致saz文件时也会保留whislte的一些特有信息 
7. style: `Request` 和 `Response` 统一放到 `Inspectors` 显示，详见：https://github.com/avwo/whistle/issues/180

### v1.10.10
1. feat: 支持显示图片
2. feat: 通过 `w2 status [-S storage]` 或 `w2 --all` 显示当前whistle运行状态
3. refactor: WebSocket请求贞数据二进制显示格式

### v1.10.9
1. feat: 添加更新插件的按钮，点击该按钮弹出更新命令
2. feat: 支持通过命令行 `w2 use` 或 `w2 enable` 获取当前目录 `.whistle.js` 输出的规则配置，具体参见：[命令行参数](http://wproxy.org/whistle/cli.html)

### v1.10.8
1. refactor: 放宽对json格式的要求
2. refactor: resMerge支持返回类型为html的请求
3. fix: 127.0.0.1请求无法发出去的问题

### v1.10.7
1. chore: 修复README没发布出去的问题
2. fix: 编辑器搜索问题
3. feat: 支持设置多个访问webui的域名 `-l "webui1.example.com|webui2.example.com"`

### v1.10.6
1. fix: 用proxifier代理http post请求可能会卡住的问题

### v1.10.5
1. refactor: 自动检测是否支持sni
2. fix: reqScript和resScript里面换行自动变成空格问题
3. feat: 支持域名为ip的https请求
4. feat: 全面支持proxifier代理请求
5. feat: 自动切换web请求和普通的socket请求

### v1.10.4
1. feat: 支持tunnel代理http请求
2. feat: 支持通过设置 `tunnel://host enable://inspect` 后在 `Network -> Response -> Frames` 查看tunnel请求的内容
3. feat: 过滤pattern支持简单的通配符 `filter://*/xxx`
4. feat: 支持端口匹配 `:12345 operatorURI`
5. refactor: IE9+及WebKit、Gecho默认支持SNI技术

### v1.10.3
1. feat: 通过命令行参数 `-z 证书目录` 设置自定义证书对应的域名将自动启用拦截https请求
2. feat: [weinre](http://wproxy.org/whistle/rules/weinre.html)支持通过js文件注入
3. refactor: 调整的[weinre](http://wproxy.org/whistle/rules/weinre.html)和[log](http://wproxy.org/whistle/rules/log.html)请求路径及禁用缓存

### v1.10.2
1. feat: Network的右键菜单新增 `QR Code` 用于生成指定URL的二维码
2. fix: saz文件导入如果不存在host无法显示的问题
3. fix: 使用[xxxPrepend](http://wproxy.org/whistle/rules/jsPrepend.html)注入html、js、css到页面是可能出现非严格模式的问题

### v1.10.1
1. fix: Network中如果请求被选中右键菜单中 `按住Shift + 点击Replay` 无法弹出设置次数对话框的问题
2. fix: 不支持多个[filter](http://wproxy.org/whistle/rules/filter.html)的问题
3. feat: [ignore](http://wproxy.org/whistle/rules/ignore.html)和[filter](http://wproxy.org/whistle/rules/filter.html)支持忽略(过滤) `pattern`
  ```
   operator pattern1 pattern2 filter://reg1 filter://!reg2 ignore://!reg3 ignore://reg4
  ``` 
4. feat: Values里面的右键菜单加入 JSON > Validate + Format 功能

### v1.10.0
> 该版本新增了一些比较有用的功能，建议大家[及时更新](http://wproxy.org/whistle/update.html)

1. feat: 右键 -> 按住 `Shift` -> 点击Replay，可以输入Replay当前请求的次数(只支持Replay单个请求的情况)
2. feat: [ignore](http://wproxy.org/whistle/rules/ignore.html)和[filter](http://wproxy.org/whistle/rules/filter.html)支持忽略(过滤) `pattern`
  ```
  pattern operator1 operator2 filter://reg1 filter://!reg2 ignore://!reg3 ignore://reg4
  ```  
  	> 其中 `reg1~reg4` 为形如 `/xxx/` 或 `/xxx/i` 的正则表达式，`!reg` 表示 `reg` 取非， 该配置表示请求要匹配`pattern`，但要过滤掉【匹配 `reg1`或 `reg4`】、【不匹配`reg2`】、【不匹配`reg3`】的请求。

3. feat: [params](http://wproxy.org/whistle/rules/params.html)改成[reqMerge](http://wproxy.org/whistle/rules/reqMerge.html)，并支持修改请求类型为json的数据，新增[resMerge](http://wproxy.org/whistle/rules/resMerge.html)用于修改返回类型为json或jsonp请求的数据，直接可以通过设置json对象覆盖返回的json对象对应字段(深度合并)。
4. fix: JSONView里面如果数值位数太大显示出现偏差的问题
5. refactor: Network下方的搜索框支持正则过滤 `/xxx/i`

### v1.9.12
1. fix: The fs.promises API is experimental (Node.js 10.1.0)
2. refactor: 支持非过滤(https://github.com/avwo/whistle/issues/155)

### v1.9.11
1. fix: 如果请求的域名为IP，则默认不进行解包，需要解包可以通过设置规则 `tunnel://x.x.x.x enable://capture` 实现
2. fix: Node 10无法导入导出saz文档的问题
3. fix: 某些包含 `\x3f` 等16进制转义字符无法解析成JSON对象的问题
4. refactor: 支持通过url的hash请求参数设置 `clearNetwork=true` 让network不要加载缓存抓包数据 
5. feat: 支持设置log id：`pattern log://xxx`(logId长度不能超过36，且不能包含`/`、`\`、`(`、`)`、`{`、`}`、`<`、`>`)，并通过log id过来日志
![log id](https://user-images.githubusercontent.com/11450939/39676336-74797444-519b-11e8-85f0-935f9d692240.png)

### v1.9.10
1. feat: Composer自动保存已填写的数据
2. fix: Composer里面如果头部出现JSON字符串可能导致无法解析请求头的问题

### v1.9.9
1. fix: Node 10更新openssl带来的问题：error:0D0E20DD:asn1 encoding routines:c2i_ibuf:illegal

### v1.9.8
1. fix: 启动时卡住命令行

### v1.9.7
1. fix: `node v9.11.1` 带来的bug
  ```
Node: v9.11.1
Date: 2018-4-23 19:22:33
TypeError: Cannot read property 'res' of null
    at Socket.socketCloseListener (_http_client.js:355:11)
    at Socket.emit (events.js:180:13)
    at TCP._handle.close [as _onclose] (net.js:541:12)
  ```
2. refactor: 去掉命令行里面 `-A, --ATS`，whistle会默认自动检测
3. refactor: 重新翻译命令行参数
4. refactor: 优化[log](http://wproxy.org/whistle/rules/log.html)捕获错误的堆栈信息
5. refactor: 调整界面轮询频率

### v1.9.6
1. refactor: 如果tunnel请求被拦截，则不请求 `plugins.tunnelRulesServer` 
2. fix: Composer构造get请求时，如果出现 `Content-Length` 及请求内容导致请求无法正常响应的问题
3. feat: 插件新增构造服务 `plugin.initial(options)` 用于初始化插件

### v1.9.5
1. fix: 通过Composer构造的WebSocket请求是Client IP显示错误的问题
2. fix: 设置[log](http://wproxy.org/whistle/webui/log.html)时可以出现的`Converting circular structure to JSON`异常
3. feat: 支持 `ignore://*|-yyy` 等价与 `ignore://*|ignore.yyy`
4. feat: 添加钩子 `plugin.resStatsServer` 用于插件统计响应状态

### v1.9.4
1. fix: 修改请求头可能导致 `content-length` 被自动删除的问题
2. fix: `ignore://socks`、`ignore://http-proxy` 失效问题

### v1.9.3
1. fix: JSONView里面点击AddToValues下载文件的问题
2. refactor: 支持点击AddToValues或Download按钮时，根据当前url自动填写默认名称
3. refactor: 去掉插件中没什么用处的statusServer，避免与statsServer混淆
4. style: 界面修改为默认显示左侧菜单模式
5. feat: 支持设置 `disable://capture` 及 `enable://capture`，这两个等价于原来的 `disable://intercept` 及 `enable://intercept`

### v1.9.2
1. refactor: 界面微调，及Log界面的性能优化
2. refactor: 去掉HTTPS里面 `Hide TUNNEL CONNECTs` 选项 

### v1.9.1
1. feat: 增强[v1.8.9](v189)版本的 `ignore://allRules`功能，支持双ignore的规则，即：`ignore://allRules|ignore.host|ignore.whistle.script` 或 `ignore://allRules|ignore:host|ignore:whistle.script` 这个时候whistle会忽略 `host` 和 `whistle.script` 以外的所有规则
2. perf: 优化了JSONView里面切换到Source模式时可能出现的卡顿问题
3. style: 禁用所有Rules或Plugins时左侧按钮会自动变灰，修改Rules或Values时左侧按钮会加 `*`
4. refactor: 默认不带 `x-forwarded-for`，如果需要可以通过设置 `pattern forwardedFor://` 实现

### v1.9.0
1. feat: 界面Network右侧的Composer支持设置临时的Rules
2. feat: 支持通过命令行 `-M network` 设置为抓包模式，该模式只能查看抓包不能设置规则及加载插件
3. feat: 界面暴露了一些接口供第三方扩展，具体用法参见后续的插件[nohost](https://github.com/imweb/nohost)
4. feat: 支持通过命令行 `-L "script=a.b.com&vase=x.y.com&nohost=imweb.nohost.pro"` 自定义访问插件的域名

### v1.8.9
1. fix: 点击Network的Time表头时响应时间没有按数值大小排序的问题
2. feat: Rules里面的`@`符号支持扩展
3. feat: 支持通过设置 `ignore://allRules` 忽略掉所有配置的规则

### v1.8.8
1. refactor: 避免url里面的参数自动转义，保留原有url的字符
2. refactor: Offline状态下菜单栏灰显
3. fix: 作为代理转发时，客户端ip可能传递出错的问题

### v1.8.7
1. feat: 在Network中双击右侧的Tab按钮，可以将当前选择的行滚动到可视区域
2. feat: 点击选中的请求数据不会因为请求列表的滚动导致被删除
3. feat: 在 Plugins 里面新增 `EnableAll` 按钮

### v1.8.6
1. fix: 导出Rules或Values时，只能导出全部的问题
2. feat: 选择导出Rules或Values对话框里面添加 `Export All` 按钮
3. feat: 添加右键菜单按钮 `Remove -> Others`，删除其它抓包数据

### v1.8.5
1. feat: 支持导入har文件
2. feat: 支持JSON数据直接添加到Values中
3. refactor: 优化界面性能[#110](https://github.com/avwo/whistle/issues/110)

### v1.8.4
1. feat: 添加命令行参数 `-f, --secureFilter` 用于过滤隐藏显示到界面的抓包数据，如cookie里面的登录态信息
2. refactor: 支持同时根据多个ip过滤抓包数据
3. perf: 大幅提升[pac](https://avwo.github.io/whistle/rules/pac.html)、[reqScript](https://avwo.github.io/whistle/rules/reqScript.html)、[resScript](https://avwo.github.io/whistle/rules/resScript.html)的性能

### v1.8.3
1. fix: RegUrl后面请求参数匹配问题，`^ke.qq.com/?*` 与 `^ke.qq.com/?**`
2. feat: 支持 `Copy As CURL`

### v1.8.2
1. fix: 无法清楚[log](https://avwo.github.io/whistle/webui/log.html)的问题

### v1.8.1
1. feat: Network、Rules、Values重新定义右键菜单

### v1.8.0
1. feat: tunnel请求支持[resScript](https://avwo.github.io/whistle/rules/resScript.html)、[responseFor](https://avwo.github.io/whistle/rules/responseFor.html)、[resHeaders](https://avwo.github.io/whistle/rules/resHeaders.html)
2. feat: 添加新协议：[htmlPrepend](https://avwo.github.io/whistle/rules/htmlPrepend.html)、[htmlBody](https://avwo.github.io/whistle/rules/htmlBody.html)、[htmlAppend](https://avwo.github.io/whistle/rules/htmlAppend.html)、[cssPrepend](https://avwo.github.io/whistle/rules/cssPrepend.html)、[cssBody](https://avwo.github.io/whistle/rules/cssBody.html)、[cssAppend](https://avwo.github.io/whistle/rules/cssAppend.html)、[jsPrepend](https://avwo.github.io/whistle/rules/jsPrepend.html)、[jsBody](https://avwo.github.io/whistle/rules/jsBody.html)、[jsAppend](https://avwo.github.io/whistle/rules/jsAppend.html)、其中：[htmlAppend](https://avwo.github.io/whistle/rules/htmlAppend.html)、[cssAppend](https://avwo.github.io/whistle/rules/cssAppend.html)、[jsAppend](https://avwo.github.io/whistle/rules/jsAppend.html)分别等价于 [html](https://avwo.github.io/whistle/rules/html.html)、[css](https://avwo.github.io/whistle/rules/css.html)、[js](https://avwo.github.io/whistle/rules/js.html)
3. feat: 支持匹配方式 `www.*.com operator-uri`、`www.**.com operator-uri`等: `www.**.com/test 1.1.1.1`
4. feat: 支持匹配方式 `^www.**.com/** operator-uri`、`^www.**.com/** operator-uri`等: `^www.*.com/*** file://E:\test/$2`
5. fix: 子匹配的一些问题

### v1.7.3
1. feat: 支持通过 `@xxx` 设置变量值，插件(`options.GLOBAL_VALUE_HEADER`)或[reqScript](https://avwo.github.io/whistle/rules/reqScript.html)、[resScript](https://avwo.github.io/whistle/rules/resScript.html)(`value`)可以读取到该值
2. refactor: 启动时的数据备份问题

### v1.7.2
1. refactor: 数据备份优化，如果原文件没有数据，重新用备份文件写入

### v1.7.1
1. fix: [reqScript](https://avwo.github.io/whistle/rules/reqScript.html)的body为空的问题：[issue#74](https://github.com/avwo/whistle/issues/94)，及render无法使用的问题，建议大家升级到最新版本
2. refactor: `visitorName` 改为 `guestName`
3. feat: 添加[responseFor](https://avwo.github.io/whistle/rules/responseFor.html)，功能与[forwardedFor](https://avwo.github.io/whistle/rules/responseFor.html)对应，用于在Network的severIp上显示真实的服务器环境

### v1.7.0
1. feat: 将[rulesFile](https://avwo.github.io/whistle/rules/rulesFile.html) 改为 [reqScript](https://avwo.github.io/whistle/rules/reqScript.html)，原来的rulesFile还可以使用，功能与reqScript一样
2. feat: 添加[resScript](https://avwo.github.io/whistle/rules/resScript.html)，支持在响应后修改通过脚本修改规则
3. fix: 通过rulesFile设置proxy时会出错的问题

### v1.6.7
1. refactor: 调整证书策略，防止域名里面有不合规的字符，导致Chrome出现证书校验失败
2. refactor: [rulesFile](https://avwo.github.io/whistle/rules/rulesFile.html)添加一些新的内置方法和对象:

		var context = {
          url: req.fullUrl,
          method: util.toUpperCase(req.method) || 'GET',
          httpVersion: req.httpVersion || '1.1',
          isLocalAddress: function(_ip) {
            return util.isLocalAddress(_ip || ip);
          },
          ip: ip,
          headers: extend(true, {}, req.headers),
          body: body,
          rules: [],
          values: {},
          getValue: values.get,
          parseUrl: parseUrl,
          parseQuery: parseQuery,
          tpl: tpl
        };

### v1.6.6
1. feat: [正则匹配和精确匹配](https://avwo.github.io/whistle/pattern.html)支持非操作，可以通过 `!/reg/i` 或 `!$www.test.com/xxx` 实现非匹配操作
2. feat: 支持通过启动命令行参数选择监听的网卡 `-H 127.0.0.1` 或 `--host 192.168.0.100`
3. fix: 获取通过代理转发过来请求的clientIp错误的问题

### v1.6.5

### v1.6.4
1. feat: 在Network的列表及Overview里面支持显示Content-Encoding
2. feat: Rules里面支持Autocomplete，输入过程中如果有匹配的规则会自动显示，或者Windows按住 `Alt+/`，Mac按住 `Option+/` 可以手动调出可以选规则列表，且选择或hover到某个规则后按 `F1` (笔记本可能要按 `fn+F1`)可以自动打开对应的帮助文档
3. feat: 支持通过按`F1`打开对应的帮助文档

### v1.6.3
1. fix: 在Frames的列表没有加React的key导致性能比较差的问题
2. fix: websocket设置代理后路径被改为根路径的问题

### v1.6.1
1. feat: 支持 `ws://www.test.com/xxx https://www.abc.com/a/b` 匹配，whistle会根据匹配url的协议 `http` 或 `https` 自动转成 `ws` 或 `wss`
2. feat: `hosts://` <=> `host://`
3. feat: 支持websocket(socket)请求设置[statusCode](https://avwo.github.io/whistle/rules/statusCode.html)、[reqDelay](https://avwo.github.io/whistle/rules/reqDelay.html)、[urlParams](https://avwo.github.io/whistle/rules/urlParams.html)、[params](https://avwo.github.io/whistle/rules/params.html)、[delete](https://avwo.github.io/whistle/rules/delete.html)、[reqHeaders](https://avwo.github.io/whistle/rules/reqHeaders.html)、[resHeaders](https://avwo.github.io/whistle/rules/resHeaders.html)、[referer](https://avwo.github.io/whistle/rules/referer.html)、[referer](https://avwo.github.io/whistle/rules/referer.html)、[disable](https://avwo.github.io/whistle/rules/disable.html)、[reqCookies](https://avwo.github.io/whistle/rules/reqCookies.html)、[reqCors](https://avwo.github.io/whistle/rules/reqCors.html)、[resCors](https://avwo.github.io/whistle/rules/resCors.html)
4. refactor: Network -> Log -> Console支持JSONView的形式
![Log](http://7tszky.com1.z0.glb.clouddn.com/Fv7fZgpm2MWwuf8FYRuhN7jnjj7S)

### v1.6.0
1. feat: 支持WebSocket的抓包与构造，详情参见[WebSocket操作文档](https://avwo.github.io/whistle/webui/websocket.html)
2. feat: 支持下载请求响应数据，hover到[Request|Response]/[TextView|JSONView]/ViewAll/Download
3. feat: 导出的数据支持自定义文件名称
4. feat: 原来的版本，如果请求的路径的ip和端口与whistle的ip和端口一样，或请求域名为localUIHOst，则都会转到whistle的UI，`v1.6.0` 以后，如果路径为:`http://localIP:whistlePort/_/xxx`的请求会自动转成 :`http://localIP:whistlePort/xxx`，这样就可以通过在whistle上配置规则 `localIP:whistlePort/xxx 127.0.0.1:6001` 实现反向代理的功能(`_`也可以换成`-`)。
5. feat: 原来默认uiport为 `port + 1`，且可以通过启动参数 `-P 9999` 更改，`v1.6.0` 以后如果非自定义的uiport被占用会自动获取一个随机端口

### v1.5.20
1. fix([#87](https://github.com/avwo/whistle/issues/87)): Node9启动失败的问题及zlib的bug
2. feat: 支持Composer构造ws和tcp请求
3. feat: 支持Replay带头部规则的请求

### v1.5.19
1. feat: 支持双击 `AutoRefresh` 停止滚动，或双击顶部菜单栏空白位置滚动到顶部
2. refactor: 优化文本显示的性能

### v1.5.18
1. feat: [rulesFile](https://avwo.github.io/whistle/rules/rulesFile.html)，支持通过body获取当前请求的内容(如果没有请求内容，则body=''，如果请求内容大于16k，body内容可能比请求内容小)
2. refactor: `pattern enable://abort`是抓包界面显示502的问题，改成 `aborted`
3. refactor: 在Values里面以js结尾的key的值支持通过快捷键 `Ctrs[Command]+?` 注释

### v1.5.17
1. feat: 兼容Chrome浏览器的本地路径 `file:///C:/Users/xxx/Downloads/jq221663.html` 等价于 `file://C:/Users/xxx/Downloads/jq221663.html` 
2. feat: 支持通过启动参数 `-M pureProxy` 将whistle设置为纯http代理的模式，这种模式下只能通过 `http://local.wproxy.org` 访问配置界面
3. feat: 支持通过 `pattern http://local.whistlejs.com/xxx` 或  `pattern http://local.wproxy.org/xxx` 的匹配方式，把请求转到whistle的配置界面
4. feat: 支持通过 `pattern enable://abort` 强制中断掉请求，如果你想延迟中断，可以通过 `pattern enable://abort reqDelay://3000` 实现

### v1.5.16
1. fix: 选择导出抓包数据的默认文件类型错误的问题(第一次使用Ctrl[Command] + S的方式导出，且没有手动选择类型时时会有这个问题)
2. feat: 插件数据返回数据支持通过 `options.ETAG_HEADER`、`options.MAX_AGE_HEADER` 两个字段设置etag或max-age，这样whistle会自动缓存数据，并判断过期时间，插件可以通过 请求头的`options.ETAG_HEADER=x-whistle-etag`的字段来判断是否有缓存及通过响应 `304` 来继续使用缓存的数据，具体参见[nohost](https://github.com/imweb/nohost)的用法
3. feat([#72](https://github.com/avwo/whistle/issues/72)): 支持通过启动参数 `-P 80` 修改whistle操作界面的端口(其中 `P` 为大写)

### v1.5.15
1. refactor([#70](https://github.com/avwo/whistle/issues/70)): 默认超时时间改为 `1min`，与浏览器的默认超时时间一致，空闲超时调整为 `3min`
2. feat: 添加 `reqHost` 用于修改请求头的host字段，等价于[hostname](https://avwo.github.io/whistle/rules/hostname.html)

### v1.5.14
1. refactor: 本地请求去掉 `x-forwarded-for` 请求头，防止后台通过 `x-forwarded-for` 获取ip时不准确

### v1.5.13
1. refactor: 获取真实的本机ip，防止通过 `x-forwarded-for = 127.0.0.1` 时访问某些服务会有问题。
2. refactor: [issue#68](https://github.com/avwo/whistle/issues/68)

### v1.5.12
1. feat: 通过请求头 `x-forwarded-for` 带上真实的客户端ip
2. feat: 支持通过插件的根目录文件 `_values.txt` 设置插件私有的Values(不支持 `values.txt`)，与私有规则 `_rules.txt` 配套使用
3. feat: 自动判断根证书格式是否正确，如果不正确会自动更新，安装新版本的whistle后出现证书不可用的情况请[重新安装下根证书](https://avwo.github.io/whistle/webui/https.html)即可

### v1.5.11
1. fix: [weinre](https://avwo.github.io/whistle/rules/weinre.html)不可用的问题[#65](https://github.com/avwo/whistle/issues/65)
2. refactor: 去掉请求插件的连接池，提升请求速度

### v1.5.10
1. 自动对请求头的 `x-whistle-rule-key` 进行转码

### v1.5.9
1. feat: 支持导入导出Rules和Values
2. feat: 支持通过请求头 `x-whistle-rule-key` 或 `x-whistle-rule-value` 设置规则，且支持通过 `x-whistle-rule-host` 设置hosts，其中 `x-whistle-rule-key` 将自动从Values里面加载规则，在设置代理 `pattern proxy://host:port?proxyHosts` 时，后面新增的请求参数表示代理规则优先，且会通过 `x-whistle-rule-host` 自动带上设置的hosts
3. feat: 界面支持切换到左侧菜单的简单模式，详见[issue#64](https://github.com/avwo/whistle/issues/64)

### v1.5.8
1. fix: reload rule或values时，可能出现的脚本错误

### v1.5.7
1. feat: 显示请求客户端的端口号和服务器的端口号
2. feat: 支持预览图片(目前没做缓存，直接通过请求的url加载)
3. feat: Network->Log支持搜索过滤
4. refactor: 编辑器的字体使用默认字体，bootstrap的字体空格宽度太小
5. fix: 微信开发者工具https请求被误认为http请求的问题

### v1.5.6
1. refactor([issue#36](https://github.com/avwo/whistle/issues/36)): 打开多个页面时操作时，把修改信息实时同步给其它页面
2. refactor: 把列表选择信息存储到localStorage

### v1.5.5
1. fix([issue#60](https://github.com/avwo/whistle/issues/60)): 建议大家升级到最新版本

### v1.5.4
1. fix: 编辑器设置显示行数的问题

### v1.5.3
1. refactor: 更改DNS的缓存策略，默认缓存30000ms，可以通过启动参数 `-c 600000` 修改缓存时间，时间单位为ms

### v1.5.2
1. fix: 更新weinre，解决安装whistle提示express@2.x及connect@2.x deprecated的提醒

### v1.5.1
1. fix([#58](https://github.com/avwo/whistle/issues/58)): `w2 restart -S xxx -C` 会导致文件被清空的问题
2. fix: Settings的输入框按 `Ctrl+D` 清空后无法同步的本地存储的问题

### v1.5.0
1. feat: 支持Network的表头及Rules、Values列表拖拽排序
2. feat: 去掉 `Filter` 菜单，改为 `Settings` 菜单，支持设置多种过滤条件及自定义表格字段，详见：[Settings](https://avwo.github.io/whistle/webui/settings.html)
3. feat([#56](https://github.com/avwo/whistle/issues/56)): Network多选是在Overview里面显示统计信息

### v1.4.21
1. feat: [ignore](https://avwo.github.io/whistle/rules/ignore.html)支持 `pattern ignore://http|https|tunnel|ws|wss` 等协议
2. refactor: 支持同时设置 [log](https://avwo.github.io/whistle/webui/log.html) 和 [weinre](https://avwo.github.io/whistle/webui/weinre.html) 
3. fix: https://github.com/nodejs/node/issues/13539

### v1.4.20
1. feat: 
	- 支持插件通过${ruleKey}内联规则
	- 命令行添加参数 `-D, -baseDir` 用于指定whistle的存储目录，默认为 `~/.WhistleAppData` 
2. refactor: 优化导入导出saz文件的性能

### v1.4.19
1. fix: 转发到插件请求头 `x-forwarded-for` 的问题
2. refactor: Values中名称形如 `xxx.rules` 的key作为正常的rules文件处理
3. style: Hover到顶部 `Help` 按钮显示帮助文档列表

### v1.4.18
1. fix: 新增setTimeout导致无法后台运行的问题

### v1.4.17
1. fix: getPluginByPluginRule返回undefined的问题

### v1.4.16
1. refactor: 使用 delete:// 删除头部字段是忽略大小写
2. style: 在Network下方过滤输入框输入内容高亮显示

### v1.4.15
1. perf: 优化 `os.networkInterfaces` 的性能
2. fix: 支持注入的文本根据响应头进行编码

### v1.4.14
1. refactor: Values支持rules的快捷键操作
2. refactor: 错误页面的 text/plain 改成 text/html
3. feat: 在规则配置中如果单独一行 `{xxx}` 表示从Values对应的key(xxx)内联文本

### v1.4.13
1. fix: 加入用户名和密码时，[log](https://avwo.github.io/whistle/webui/log.html)无法使用的问题
2. feat: 添加新的路径匹配方式：
		
		# 对所有域名对应的路径 protocol://a.b.c/xxx[/yyy]都生效
		~/
		~/xxx
		tunnel://~/ # tunnel只支持根路径匹配
		http://~/
		https://~/xxx
		ws://~/xxx
		wss://~/xxx

		# 也可以指定路径，不包含该路径的子路径
		$~/
		$~/xxx
		$tunnel://~/ # tunnel只支持根路径匹配
		$http://~/
		$https://~/xxx
		$ws://~/xxx
		$wss://~/xxx

### v1.4.12
1. fix: 通过 `pattern cache://seconds` 设置缓存时间单位出错的问题

### v1.4.11
1. feat: 支持第三方应用在启动whistle时传人如下参数
	- `disableAllRules`: 不设置表示使用默认设置或用户通过界面设置，如果设置为 `true` 表示禁用所有规则，包括插件，如果设置为 `false` 表示启用所有规则，如果设置了true或false会覆盖通过页面的设置
	- `disableAllPlugins`: 不设置表示使用默认设置或用户通过界面设置，如果设置为 `true` 表示禁用所有插件，如果设置为 `false` 表示启用所有插件，如果设置了true或false会覆盖通过页面的设置
	- `allowMultipleChoice`: 不设置表示使用默认设置或用户通过界面设置，如果设置为 `true` 表示允许在Rules种同时启用多个规则，即允许多选，如果设置为 `false` 表示只能启用除Default以外的一个规则，如果设置了true或false会覆盖通过页面的设置
	- `rules`: 通过参数设置规则列表
		- 如果为string或数组，则表示只设置 `Default` 的规则
		- 如果为对象可以设置多个规则，及决定使用哪些规则(要同时启用多个规则，需要 `allowMultipleChoice` 设置为true)

				{
					Default: {
						rules: ['fffffffffffff', '000000000000'],
						enable: false,
            			replace: false
					},
					test1: 'abc\n123',
					test2: {
						rules: 'www.test.com 127.0.0.1'.
						enable: true
					}
				}
			
	- `values`:  为对象，{ test: 'abc', testJson: {abc: 123} }

### v1.4.10
1. feat: 支持通配符的匹配方式(配置两边位置可以调换)

		# 匹配二级域名以 .com 结尾的所有url，如: test.com, abc.com，但不包含 *.xxx.com
		*.com file:///User/xxx/test
		//*.com file:///User/xxx/test

		# 匹配 test.com 的子域名，不包括 test.com
		# 也不包括诸如 *.xxx.test.com 的四级域名，只能包含: a.test.com，www.test.com 等test.com的三级域名
		*.test.com file:///User/xxx/test
		//*.test.com file:///User/xxx/test

		# 如果要配置所有子域名生效，可以使用 **
		**.com file:///User/xxx/test
		**.test.com file:///User/xxx/test

		# 限定协议，只对http生效
		http://*.com file:///User/xxx/test
		http://**.com file:///User/xxx/test
		http://*.test.com file:///User/xxx/test
		http://**.test.com file:///User/xxx/test

		# 路径
		*.com/abc/efg file:///User/xxx/test
		**.com/abc/efg file:///User/xxx/test
		*.test.com/abc/efg file:///User/xxx/test
		**.test.com/abc/efg file:///User/xxx/test

		http://*.com/abc/efg file:///User/xxx/test
		http://**.com/abc/efg file:///User/xxx/test
		http://*.test.com/abc/efg file:///User/xxx/test
		http://**.test.com/abc/efg file:///User/xxx/test
		
2. fix([#47](https://github.com/avwo/whistle/issues/47)): 证书被吊销过可能出现无法打开的问题

### v1.4.9
1. fix: 解决Composer中url包含非ASCII字符时出现乱码的问题(如果请求头有非ASCII字符该字段将被忽略)
2. refactor: 改善whistle的pac脚本解析，全面支持dnsResovler

### v1.4.8

1. refactor: 
   - 优化转发到插件的请求头，支持把proxy和pac配置规则带过去
   - `host://:port` === `host://remoteServerIP:port`
2. fix: 在Rules或Values按 `Ctrl + X` 清空Network的问题

### v1.4.7

1. refactor: 确保转发到插件的请求可以把一些用户配置的Rule带过去
2. fix: 修复Mac上 `Chrome>=59` 出现的 `ERR_SSL_SERVER_CERT_BAD_FORMAT`的问题，需要启动时加 `w2 restart -A` 重新生成根证书，并安装，具体参见：[Https](https://avwo.github.io/whistle/webui/https.html)、[关于iOS的ATS](https://avwo.github.io/whistle/ats.html)

### v1.4.6

1. fix: 屏蔽Node8自身bug导致崩溃的问题: [Assertion `(trigger_id) >= (0)' failed.](https://github.com/nodejs/node/issues/13325)

### v1.4.5
1. fix: [log](https://avwo.github.io/whistle/webui/log.html)的缓存问题

### v1.4.4
1. fix: Header name must be a valid HTTP Token

### v1.4.3
1. refactor: 
  - `Network -> Response -> TextView` 的Editor按钮打开的url改成相对路径
  - Network表格中的 `host IP` 改成 `serverIP`，语意更明确

### v1.4.2
1. refactor: 不区分第三人称和单复数，ruleFile和rulesFile等价、export和exports等价、 exportUrl和exportsUrl等价
2. feat:
  - 添加 `https2http-proxy://`，whistle把该https转成http后发送到指定代理
  - 添加 `internal-proxy://`，功能和 `https2http-proxy://` 一样，只是如果代理对象是whistle的话，会把http又转成https，主要用于whistle的扩展使用，一般用户无需了解
  - 添加 `http2https-proxy://`，whistle把该http转成https后发送到指定代理

### v1.4.1
1. fix: 在Network -> Overview中content-length显示为0的问题

###  v1.4.0
1. fix: 
  - 更新内部的一些随机端口机制，防止监听某些特殊端口导致无法响应的问题
  - 导出saz文件出现pending的问题
2. feat: 
  - 把ui界面的所有链接都改成相对路径，方便使用ip或域名直接访问及集成到第三方应用
  - 同时配置 [host](https://avwo.github.io/whistle/rules/host.html)和 [proxy(socks)](https://avwo.github.io/whistle/rules/proxy.html)，host的优先级高于proxy(socks) 
3. refactor: 响应cookie的显示

### v1.3.20
1. fix: Fiddler的saz文件格式不兼容的问题
2. refactor: cgi改用相对路径，方便集成到其它应用中

### v1.3.19
1. refactor: 导入saz文件时，支持自动解码
2. refactor: 非文本或文本太大无法显示时给出提示

### v1.3.18
1. feat: 
  - 支持拖拽请求到Composer
  - 支持json-tree
2. refactor: 
  - 修改Network/Log下面的Conosle和Server背景颜色，让两者区分开来
  - 调整ATS参数的命令行提示

### v1.3.17

### v1.3.16
1. fix: 设置 `proxy://` 第三方代理服务器返回的数据格式有问题会导致抛异常的问题

### v1.3.15
1. fix: 
  - 新安装的插件内置规则文件 `_rule.txt` 无法自动生效的问题
  - 注释快捷键(Ctrl + ? 或 Command + ?)与常用编辑对齐
2. refactor: 
  - 支持切换properties到source模式，方便直接copy到Values里面使用
  - 支持如下json格式设置同名属性，whistle自动解析成数组

     Set-Cookie: a=b
     	Set-Cookie: c=d
     	test: 123

### v1.3.14
1. refactor: 
  - 请求和响应保留原有头部字段的大小写
  - 修改Network中匹配到规则是的url字体颜色
2. fix: rawfile头部存在 `content-encoding` 导致解析失败的问题

### v1.3.13
1. fix: 
  - 通过[rulesFile](https://avwo.github.io/whistle/rules/rulesFile.html)设置host或proxy无效的问题
  - Rules编辑器高亮显示的问题
2. refactor: 
  - 提升https请求的响应速度
  - 优化了证书生成，防止后续Chrome版本无法识别，如果发现手机或Chrome浏览器无法识别证书，参见：[关于iOS的ATS](https://avwo.github.io/whistle/ats.html)，启动时带上参数 `w2 start -A`，重新生成根证书，再安装新的根证书即可

### v1.3.12
1. feat: 支持根据请求头的 `content-encoding` 解压请求内容
2. refactor: 支持在[rulesFile](https://avwo.github.io/whistle/rules/rulesFile.html)的脚本中执行 `console.log`，并可以在 `Network->Log->Server`里面显示
3. fix: Node v7.7.0+引入的 `"listener" argument must be a function` 问题

### v1.3.11
1. fix: 导出Fiddler是saz文件时，响应的cookie合并在一起的问题
2. refactor: 更新`tunnel-agent`

### v1.3.10
1. refactor: 防止获取不到外网ip可能导致代理无限循环的问题
2. feat: 支持自定义插件目录列表 `pluginPaths`，主要用于第三方模块使用，参见：[koa-whistle](https://github.com/avwo/koa-whistle)

### v1.3.9
1. fix: 如果获取本地获取不到外网ip会导致`http://externalIP:whistlePort/`访问时无限循环的问题
2. style: 给Network菜单加title `双击删除所有sessions`

### v1.3.8
1. feat: 支持设置没有schema的url，如 `//ke.qq.com/test file:///User/xxx/abc` 与原来的 `ke.qq.com/test file:///User/xxx/abc` 等价

### v1.3.7
1. fix: 某些服务器未按标准实现，导致无法识别纯小写的请求头，v1.3.7版本开始统一转成 `Xxx-Yxx` 的形式
2. style: 把Rules里面的 `Edit` 菜单名称改成语义更明确的 `Rename`

### v1.3.6
1. fix: 无法修改 `connection` 请求头的问题
2. fix：兼容Fiddler某些情况导出的请求url无法显示域名的问题

### v1.3.5
1. feat: 支持iOS的ATS安全标准，把RSA加密算法的密钥长度修改为2048（安装运行的Node版本不能小于 `v6.0.0` ），参见：[关于iOS的ATS](https://avwo.github.io/whistle/ats.html)
2. fix: 把请求头`proxy-connection`转成`connection`

### v1.3.4
1. fix: 导入导出saz文件的一些小问题

### v1.3.3
1. fix: 去掉socksv5的空闲超时设置，感谢  [@echopi](https://github.com/echopi) 反馈

### v1.3.2
1. fix: 导出saz文件时，如果res为空报错的问题

### v1.3.1
1. fix: 导出非utf8编码的内容为saz文件时出现的的乱码问题

### v1.3.0
1. feat: 支持在规则中设置局部变量，`pattern file:///User/xxx/${filename}`或直接拼接[Values]()的值 `pattern file://(${key1},${key2},${keyN})`，具体功能参考：[Values]()
2. feat: 支持通过Network下拉菜单或者快捷键(`Ctrl[Command] + i`、`Ctrl[Command] + S`)、拖拽文件导入导出Fiddler2、Fiddler4的saz文件
3. feat: 支持tunnel请求设置`statusCode://xxx`
4. refactor: 新增`status://xxx`等价于`statusCode://xxx`
5. refactor: 支持ip:port映射到ip:port，即：`127.0.0.1:6001 127.0.0.1:7001`，访问`http://127.0.0.1:6001`会转发到`http://127.0.0.1:7001`
6. refactor: 加入agent的连接池中空闲连接的超时机制，防止请求某些情况下无法触发`free`事件，导致连接无法释放

### v1.2.6
1. refactor: 方便手动输入url，把安装根证书的url修改为http://rootca.pro/

### v1.2.5
1. feat: 新增协议[ignore](https://avwo.github.io/whistle/rules/ignore.html)
2. feat: 新增协议[enable](https://avwo.github.io/whistle/rules/enable.html)

### v1.2.4
1. fix: tunnel代理中通过插件设置tunnelProxy无效的问题
2. fix: websocket映射没有同步修改请求path的问题
3. fix: 兼容大量不规范的头部处理方式，将输出的响应头的字段名称的首字母及`-`后面的字母都转成大写

### v1.2.3
1. feat: 支持自定义根证书及特定域名的证书、通配证书
2. feat: 插件新增statsServer，可以用于统计请求及获取所有请求的参见就头信息，详见[插件开发](https://avwo.github.io/whistle/plugins.html)

### <del>v1.2.2

### v1.2.1
1. fix： Buffer.from兼容性问题，在node v5上不支持字符串参数
2. refactor: 去掉head这个老协议，可以使用跟方便的reqXxx，resXxx协议

### v1.2.0
1. fix: #16
2. feat: 支持通过`Ctrl + Shift + /`切换Rules编辑框的注释状态，选中的行中如果注释将解除注释，如果没有注释，则会注释掉这行
3. feat: 新增[rulesFile](https://avwo.github.io/whistle/rules/rulesFile.html)，可以批量设置规则或者通过脚本动态设置规则
4. refactor: 支持通过(`whistle.xxx://`、`whistle.yyy://`)同时匹配多个插件
5. refactor: 调整[pac](https://avwo.github.io/whistle/rules/pac.html)逻辑，让替换后的请求也有作用
6. refactor: 把socks、proxy协议作为一个独立的协议，使得给匹配的规则设置代理

### v1.1.1
1. chore: 调整协议列表的顺序
2. docs: 修改帮助文档链接，提升访问速度： [https://avwo.github.io/whistle/](https://avwo.github.io/whistle/)

# v1.1.2
1. feat: 新增精确匹配(原来也可以通过正则实现，只是对这种情形用这方式比较方便)，`$url operator-uri`详见[匹配方式](https://avwo.github.io/whistle/pattern.html)
2. feat: 支持各个rules server(pluginRulesServer, rulesServer, tunnelRules, resRulesServer)传values过来，详见[插件开发](https://avwo.github.io/whistle/plugins.html)
3. style: 添加双击`Network`按钮情况请求列表的快捷方式
4. style: 添加输入系统或插件没有对应的协议时加中划线及字体颜色变红
5. chore：处理了所有eslint错误

### v1.1.0
1. fix: 修复了匹配顺序的bug，如下配置访问http://test.com:8080会匹配到下面的规则：
   ​	
   test.com operator-uri
   	/./ operator-uri
2. fix:　插件相关的一些绝对路径的问题，用到插件最好[升级到最新版本](https://avwo.github.io/whistle/update.html)
3. feat:新增[pac](https://avwo.github.io/whistle/rules/pac.html)用于设置pac脚本
4. feat: 新增[delete](https://avwo.github.io/whistle/rules/delete.html)可用于delete请求或响应的头字段，而通过[reqHeaders](https://avwo.github.io/whistle/rules/reqHeaders.html)或[resHeaders](https://avwo.github.io/whistle/rules/resHeaders.html)只能设置为空字符串
5. style: 把删除选中或非选中的数据及清空整个列表的按钮放到Network按钮的菜单列表里面
6. style: 在Network下拉菜单里面新增`查看选中数据`，可以获取当前选中数据的json格式化数据。

### v1.0.4
1. feat: plugin新增tunnelServer，支持把tunnel请求转发到tunnelServer
2. feat:　新增协议[plugin.xxx、whistle.xxx](https://avwo.github.io/whistle/rules/plugin.html)，whistle.xxx://value <=> plugin.xxx://value <=> plugin://xxx://value 
3. refactor: 优化了`socks`和`proxy`的代理设置，新增socket复用及请求头的修改

### v1.0.3
1. refactor: 把ruleValue传给tunnelRulesServer
2. refactor: 把cgi和正常请求的客户端ip透传给插件
3. feat: 支持local.whistlejs.com与xxx.local.whistlejs.com带端口访问
4. feat: 支持plugin://name(ruleValue)或plugin://name://ruleValue的方式传值个插件的除server和uiServer以外的server
5. feat: 新增命令行参数 `-l, --localUIHost`支持修改访问配置页面的域名，默认为`local.whistlejs.com`

### v1.0.2
1. fix：windows的默认换行符导致命令行在Mac会Linux上不可用，请更新到最新版本即可：[更新whistle](https://avwo.github.io/whistle/update.html)

### v1.0.1
1. fix： https代理可能出现异常的问题
2. feat: 新增[plugin.tunnelRulesServer](https://avwo.github.io/whistle/plugins.html)用于在插件上设置代理tcp请求的规则
3. feat: 通过https代理过来的请求，没被拦截的请求都认为tunnel协议，如： tunnel://www.baidu.com:443，具体参加：[注意事项](https://avwo.github.io/whistle/attention.html)
4. feat: 代理请求新增`x-whistle-policy`用于设置whistle策略，目前只`tunnel`让whistle不要拦截https代理。
5. test: 新增对https代理的一些测试用例

### v1.0.0
1. fix: Linux设置开机启动无法找到homedir的问题
2. feat: 新增开机启动脚本，如何设置开机启动，请参考[开机启动](https://avwo.github.io/whistle/autoStart.html)
3. feat: plugin中新增statusServer，用于获取请求的状态: 请求开始、请求结束或请求出错，具体参见[插件开发](https://avwo.github.io/whistle/plugins.html)
4. fix: 修复插件的plugin.rulesServer可能导致whistle crash的问题
5. feat: 新增[plugin](https://avwo.github.io/whistle/rules/plugin.html)，用于实时通知指定插件请求状态的变化及动态修改rules，如果匹配了插件的协议，则会忽略plugin的配置

### v0.12.3
1. feat: 加入[urlReplace](https://avwo.github.io/whistle/rules/urlReplace.html)支持类似字符串的replace方法，替换请求url的路径内容
2. style: 在Overview里面精确显示匹配`pattern matcher`，并在title里面显示配置规则的原始配置

### v0.12.2
1. test: 加入自动化持续集成travis，并修复了一下bug
2. fix: 响应有错误信息直接显示在抓包列表上

### v0.12.1
fix: 修复请求头有非法字符导致程序奔溃的问题

### v0.12.0
1. feat: 支持配置配置ip:port，如：`pattern host://ip:port`(port可选)，这与`pattern ip:port`的区别是：后者会把请求头的`host`字段修改为`ip:port`(ip为IPv4或IPv6)
2. feat: 支持同一个用户启动多个whistle服务`w2 start -S newStorageDir -p newPort`，具体参见[安装启动](https://avwo.github.io/whistle/install.html)
3. docs: 修改页面中帮助文档的链接
4. fix: 重写文档的过程中把所有功能都人肉跑了一遍，修复了一下问题，后续版本把自动化持续集成的功能加上

### v0.11.4
1. fix: 修复在[Values](https://github.com/avwo/whistle/wiki/%E7%95%8C%E9%9D%A2%E6%93%8D%E4%BD%9C)中按`Ctrl+S`会弹出修改名称输入框的问题
2. refactor: 允许同时安装多个不同的whistle根证书，安装根证书请参考：[启用HTTPS](https://github.com/avwo/whistle/wiki/%E5%90%AF%E7%94%A8HTTPS)

### v0.11.3
1. feat: 新增[hostname](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#hostname)用于修改`req.headers.host`
2. feat: 支持通过`WHISTLE_PLUGINS_PATH`配置插件路径，whistle会优先从`join(WHISTLE_PLUGINS_PATH, 'node_modules')`加载插件
3. fix: 修复在overview中优先显示插件私有规则的问题(PS：在Rules中配置的规则优先级最高)
4. fix: post请求超时时间太短的问题，并把表单上传的请求的默认timeout时间加倍，减少上传失败的概率

### v0.11.2

fix: `statusCode < 100 || statusCode > 999` 会抛出异常导致程序crash

     if (statusCode < 100 || statusCode > 999)
        throw new RangeError(`Invalid status code: ${statusCode}`);

 PS：看了下提交记录，是2016年4月20号提交的代码：[eee69b81faf2df406ac3c571bee31ebd501cfd9d](https://github.com/mscdex/io.js/commit/eee69b81faf2df406ac3c571bee31ebd501cfd9d)

### v0.11.1
1. fix: 修复在https请求中使用[log](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#log)可能出现`Mixed Content`警告的问题
2. feat: [log](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#log)支持同时输出多个参数`console.log(location.href, a1, a2, ...)`的写法
3. fix: 清空请求数据的快捷键为`Ctrl+X`(mac也可以用`Command+X`)，但原来在Clear按钮上的title提示错了
4. feat: 加入快捷键 `Ctrl+D` 或 `Command+D`(Mac)，用于删除请求列表中选中的条目、选中的rule、选中的value
5. feat: 加入快捷键 `Ctrl +向上箭头` 和 `Ctrl +向下箭头` (Mac用`Command+向上箭头` 和 `Command +向下箭头`) 用于调整Rules(Values)列表的顺序
6. feat: 支持点击请求列表的表头重新对列表进行重新排序
7. feat: 把下一个匹配到的Rule通过NEXT_RULE_HEADER(x-whistle-next-rule)的头字段传到rulesServer，这样可以判断是否执行下一个规则

### v0.11.0
1. fix: 修复在调整窗口大小是没有重绘的问题
2. feat: 把官网网址(官网还在开发中...)改为：[http://wproxy.org](http://wproxy.org/)
3. feat: 新增[replaceStatus](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#replacestatus)用于修改服务器响应的状态码，与[statusCode](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#statuscode)的区别是，后者不会请求到后台服务器，而是直接根据设置的状态码响应
4. feat: 新增[location](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#location)用于修改或添加响应头的location字段，一般与[replaceStatus](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#replacestatus)的`replaceStatus://301`、`replaceStatus://302`配合使用

### v0.10.3
1. feat: 检测并提示代理服务器被切换
2. feat: 界面上同时展示的请求数，由360调整为560
3. perf: 极大提升UI界面的性能
4. fix: 可能出现的如下异常

   Date: 2016-06-22 00:47:13.466
   	RangeError: out of range index
   	    at RangeError (native)
   	    at StringDecoder.fillLast (string_decoder.js:94:9)
   	    at StringDecoder.write (string_decoder.js:73:14)
   	    at PassThrough.<anonymous> (/Users/xxx/whistle/lib/util/index.js:931:33)
   	    at emitOne (events.js:96:13)
   	    at PassThrough.emit (events.js:188:7)
   	    at readableAddChunk (_stream_readable.js:172:18)
   	    at PassThrough.Readable.push (_stream_readable.js:130:10)
   	    at PassThrough.Transform.push (_stream_transform.js:128:32)
   	    at afterTransform (_stream_transform.js:77:12)
   	    at TransformState.afterTransform (_stream_transform.js:54:12)

### v0.10.2
1. refactor: 去除自动同步v0.3.0之前版本数据的逻辑(v0.3.0及以后版本的whistle数据存储目录做了一次修改)
2. style: 替换全新的logo，感谢部门的视觉设计同事**[@wjdgh1031(鬼刀)](https://github.com/wjdgh1031)**帮忙设计了新logo

### v0.10.1
1. feat:新增Server Log，用于记录服务端的日志：Network -> Log -> Server
2. refactor: 调整log的加载逻辑，确保在打开Network -> Log前记录的log都能看到
3. fix: 修复[log](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#log)协议出现请求被gc的情况
4. fix: [log](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#log)可能导致页面出现的样式问题

### v0.10.0

1. feat: 新增规则包，可以在插件加入全局及内部的规则包，详见：[自定义插件](https://github.com/avwo/whistle/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E6%8F%92%E4%BB%B6)
2. feat: 新增`rawfile`、 `xrawfile`的功能，详见：[rule](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#%E7%9B%AE%E5%BD%95)
3. fix: 修复headers里面的set-cookie可能导致页面js出错的问题
4. refactor: 更新页面用到的react到最新版本，提升前端性能
5. fix: 如果插件的package.json格式有问题会导致无法自动加载插件
6. fix: 修复reqAppend、resAppend无效的问题

### v0.9.5

refactor: 详细的启动提示信息兼容node v0.10.x

### v0.9.4
1. feature: 加入 `disable://ajax`，用于删除请求头 `x-requested-with`
2. feature: 新增[accept](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#accept)用于修改请求头的accept字段 
3. feature: 加入插件开发过程中输出详细日志，[#3](https://github.com/avwo/whistle/issues/3)
4. feature: 新增菜单栏 -> Rules -> Setting -> Disable all rules的选项，用于禁用所有规则
5. refactor: 修改 `reqType`，`resType`的默认行为，如果`reqType`，`resType`没有带charset的时候，保留原有的charset
6. refactor: 新增详细的启动提示信息

### v0.9.3

refactor: 限制starting的版本为0.1.1，后面发布的starting版本和现有的不兼容

### v0.9.2

bugfix：修复keepAlive可能导致请求无法响应的问题

### v0.9.1
1. 新增[reqCharset](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#reqcharset)和[resCharset](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#rescharset)两个协议，分别用于快速修改请求、响应的编码
2. bugfix：修复可能出现请求出错的情况，https://github.com/nodejs/node/pull/4482

### v0.9.0
1. **重要bugfix：**Fix https post数据时可能出现pending的问题
2. 新增[etag](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#etag)协议，用于修改请求头的etag
3. 支持通过`ua://`、`referer://`、`reqType://`、`resType://`等，把对应的字段置空

### v0.8.2

1. 修复自定义插件不能获取[values]()的值，即 `pattern plugin://{key}` 无法正确获取ruleValue的问题
2. 限制自定义插件的名称不能与内置的协议名称冲突，如果冲突则该自定义插件将无效

### v0.8.1

1. whistle ui -> about -> 插件列表：插件列表显示按ascii码排序
2. 缓存[dispatch](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#dispatch)的script，提升速度
3. 新增[attachment](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#attachment)用于设置下载文件的响应头 `content-disposition: attachment; filename="attachment"`

### v0.8.0

1. 新增插件机制，可以很方便的自定义插件，并提供了平时开发中有用的插件作为例子，具体请参考请查看：[自定义whistle插件](https://github.com/avwo/whistle/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E6%8F%92%E4%BB%B6)
2. 加入请求失败自动重试机制，减少请求出错的情况

### v0.7.2

	bugfix: Cannot read property 'dist-tags' of null

### v0.7.1

新增 [dispatch](https://github.com/avwo/whistle/wiki/功能列表#dispatch) 协议，主要用途：某些情况需要我们根据用户的ip、或ua、或cookie等来动态决定匹配规则，这时可以利用 `dispatch` 来执行自定义脚本来修改url里面的请求参数从而修改请求的url，最后达到修改请求url匹配的规则的目的。

### v0.7.0
1. 支持通过插件开启在网页的右下角显示访问的真实ip，需要安装最新版的Chrome插件：[https://github.com/avwo/whistle-for-chrome](https://github.com/avwo/whistle-for-chrome)
2. 支持`exportsUrl`，可以把匹配到的请求url导出到指定的文件
3. 新增功能`resCors://use-credentials`(等价于`resCors://enable`)，让语义更清晰
4. 新增更简洁的命令行命令 `w2`，新版的whistle同时支持`whistle xxx`和`w2 xxx`，如 `w2 start`、`w2 restart`、`w2 stop`、`w2 --help`等

### v0.6.6

新增 `exports` 功能，用于把请求导出到指定文件（如果该文件不存在，则会自动创建），每一行都是如下json对象（第一行可能为空）：

	{
		startTime: '请求的开始时间',
		dnsTime: 'dns结束时间',
		requestTime: '请求结束时间',
		responseTime: '开始响应的时间',
		endTime: '响应结束的时间',
		url: '请求的url',
		realUrl: '实际请求的url（一般设置了替换规则，才会有realUrl，否则不会显示该字段）',
		method: '请求使用的方法', 
		httpVersion: 'http版本号',
	    clientIp: '用户ip',
	    hostIp: '服务器ip',
	    reqError: '是否请求阶段出错',
	    reqSize: '请求内容的长度',
		reqHeaders: '请求头',
		reqTrailers: '请求的trailers',
		statusCode: '响应状态码',
		resError: '是否在响应阶段出错',
		resSize: '响应内容的长度',
		resHeaders: '响应头',
		resTrailers: '响应的trailers',
		rules: '匹配到的规则'
	}

### v0.6.3

1.  新增`reqWriter`、`resWrite`分别用来把请求内容和响应内容写入到本地文件
2.  新增`reqWriterRaw`、`resWriteRaw`分别用来把请求完整信息和响应的完整信息写入到本地文件（包括路径、协议、方法、响应状态码、头部、内容等）
3.  bugfix: 使用`reqReplace`改变了请求内容长度没有同步处理headers的content-length的问题
4.  支持通过 `params` 替换上传表单的字段
5.  对形如 `[a-z]:\*`、`[a-z]:/xxx`、`/xxx` 自动识别为 `file://...`

   即：

    	www.text.com/ /User/xxx # 或 www.text.com/ D:\workspace 
    	# 等价于
    	www.text.com/ file:///User/xxx # 或 www.text.com/ file://D:\workspace 
    	
### 0.6.4

    1. 修复使用log的时候，多次注入脚本导致console的时候会重复打印多次
    2. 增加repReplace、resReplace的缓存字符串大小

### 0.6.5

1. bugfix:

 修复前：

 	/(.*):8899(\/.*)/ $1$2 

 结果：
 ​	
 	http://xxx:8899 http://http://xxx

 修复后：

 	/(.*):8899(\/.*)/ $1$2 --> http://xxx:8899 http://xxx
 ​

### v0.6.2

1. 加入小版本更新时给出小提示
2. 添加 `disable` 的新功能：301、dnsCache、keepAlive、intercept
3. 新增 `reqReplace` 和 `resReplace` 两个功能：类似js字符串的 `replace` 方法，分别用来替换请求和响应的文本内容

### v0.6.1

1. 新增了 `disable` 协议，用来禁用cache、cookie、referer、ua、timeout、csp，具体参考：[功能列表](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#%E7%9B%AE%E5%BD%95)
2. 纠正了解析[配置操作符](https://github.com/avwo/whistle/wiki/%E9%85%8D%E7%BD%AE%E6%A8%A1%E5%BC%8F#%E4%B8%89%E4%B8%AA%E6%93%8D%E4%BD%9C%E7%AC%A6%E7%9A%84%E4%BD%9C%E7%94%A8)使用拼接后url的问题
3. 原来通过filter启用HTTPS，推荐改用这种方式：[启用HTTPS](https://github.com/avwo/whistle/wiki/%E5%90%AF%E7%94%A8HTTPS)

   ​

### v0.6.0

bugfix：修改了路径匹配可能多加一个 `/` 的问题

形如：

	http://www.test.com/index.html http://www.test.com:8888/index.html

	# http://www.test.com/index.html?query --> http://www.test.com:8888/index.html/?query

​

### v0.5.8

bugfix：修改v0.5.7版直接访问[http://local.whistlejs.com/index.html](http://local.whistlejs.com/index.html)脚本出错的问题

### <del>v0.5.7</del>

新增快捷键：`ctrl[command]+鼠标点击：快速打开rules设置的key(点击形如：`xxx://{key}` 的规则)在values中的位置(如果values中不存在对应的key，则会自动创建)，更多内容请参考：[界面操作](https://github.com/avwo/whistle/wiki/%E7%95%8C%E9%9D%A2%E6%93%8D%E4%BD%9C)

### v0.5.6

修复低版本的node在[拦截https](https://github.com/avwo/whistle/wiki/%E5%90%AF%E7%94%A8HTTPS)时，有可能产生的重复关闭server会抛出异常的情况

### v0.5.5

新增支持配置模式：pattern operator-uri1 operator-uri2 ... operator-uriN （原来只支持operator-uri pattern1 pattern2 ... patternN）

这种情况下 `pattern` 和 `operator-uri1` 不能同时为形如这种形式的uri：`[http[s]|ws[s]://]www.example.com/*`，否则会忽略后面的 `operator-uri2 ... operator-uriN`

### v0.5.4

### v0.5.3

微调parseInlineJSON的实现

### v0.5.2

新增：支持 www.qq.com resHeaders://(content-type=text/plain)格式

### v0.5.1

修复：本地调试时，https的根证书可能被开发目录的根证书自动覆盖问题

### v0.5.0

1. JSON对象的一种inline写法，可以直接写在协议的uri里面，形如： `protocol://name1=values&name2=value2&name3&name4=&name5=value5&nameN=valueN`
2. 加入了如果有大版本的更新，会自动提醒（一般有新功能加入或修复致命bug才会有大版本的更新）

bugFix:

修改了一些子匹配的问题，及urlParams，params可能无效的问题

### v0.4.1、v0.4.2

修改快捷键 `ctrl + /` 的小bug：没有选中，及从后往前选择会导致聚焦有点问题。

### v0.4.0

1. 菜单 `Rules`、`Values`、`Weinre`，hover出现列表（原来需要点击才能出现列表）
2. 新增快捷键 `ctrl + /` 来注释（取消注释）选中的行
3. 新增 `css`、`html`、`js` 3个协议，分别用来注入css、js、html到html页面，或css代码到css文件，js代码到js文件的底部。这个与resPrepend、resBody、resAppend的区别是：系统会自动判断响应的类型来选择注入

### v0.3.12

fix如果请求包含content-length导致weinre无法注入的bug

### v0.3.11

fix配置某些带端口号正则的时候可能导致系统奔溃的情况
