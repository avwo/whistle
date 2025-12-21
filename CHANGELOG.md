## v2.9.106
1. feat: 优化 Composer
2. feat: Network 底部搜索框支持类似 Chrome 开发者工具一样通过类型快速过滤
3. feat: 同一目录出现同名插件（不包含 `@scope/` 部分）以最新的 mtime 为准
4. feat: 优化界面体验
5. feat: 支持通过 Online / Shortcuts Settings 查看及开关快捷键
6. fix: 修复了一些隐藏 bug

## v2.9.105
1. fix: https://github.com/avwo/whistle/issues/1271

## v2.9.104
1. feat: 支持通过 `~/.whistlerc` 加载默认配置，详见：[命令行操作](https://wproxy.org/docs/cli.html#whistlerc)
   ``` txt
   username=xxx
   password=yyy
   [storage.]username=xxx
   [storage.]password=yyy
   ```
2. feat: Network 支持手动 Save 抓包数据
3. feat: Rules 支持查看 `Enabled Rules`
4. fix: frameScript 与界面操作冲突问题
5. fix: 修复了一些隐藏 bug

## v2.9.103
1. feat: 新增 [frameScript](https://wproxy.org/docs/rules/frameScript.html) 用于通过 JS 修改 WebSocket 或普通 TCP 请求内容

## v2.9.102
1. feat: 命令行启动时提醒有版本更新，https://github.com/avwo/whistle/issues/1245
2. feat: 新增功能 `delete://pathname` 及 `delete://pathname.index`
3. fix: https://github.com/avwo/whistle/issues/1222
4. fix: https://github.com/avwo/whistle-client/issues/96
5. fix: 修复了一些隐藏 bug

## v2.9.101
1. fix: https://github.com/avwo/whistle/issues/462
2. feat: Composer 支持显示 SSE 和 Websocket 内容
3. feat: 支持设置匹配概率 `includeFilter://chance:0.5`（`50%` 匹配）或 `excludeFilter://chance:0.5`（`50%` 不匹配）

## v2.9.100
1. feat: https://github.com/avwo/whistle/issues/1221
2. feat: https://github.com/avwo/whistle/issues/1222
3. feat: 默认启用 `localhostCompatible` 模式，`localhost` 在为配置 host 的前提下同时兼容 `127.0.0.1` 和 `::1` 两个 IP，防止出现：https://github.com/avwo/whistle/issues/1200
4. feat: 支持 `req.passThrough({transformReq, transformRes, ...})`
5. fix: 修复了一些隐藏 bug

## v2.9.99
1. feat: 优化 Rules 里面的 `includeFilter://`、`excludeFilter://` 自动补全功能
2. feat: Network 添加 `APP` 列显示请求来源 APP 的名称
3. feat: 如果本地有 npm 命令，则支持通过 Plugins / Install 安装插件
4. feat: 自定义 Tab 支持设置 icon
5. feat: 字段 Network 列支持设置 icon
6. feat: 插件 Option 页面支持设置 favicon

## v2.9.98
1. feat: 优化界面操作及提示文案
2. feat: 支持显示 TTFB
3. fix: Composer 禁用 Whistle Rules 导致自定义的 host 规则无效问题

## v2.9.97
1. feat: 导入 Rules 和 Values 的交互调整，允许用户手动选择需要导入的内容
2. feat: 安装插件功能优化
3. feat: 支持通过 `lineProps://internal` 将规则作用于 Whistle 内部请求（只支持 host、proxy 等部分规则）

## v2.9.96
1. feat: 支持导出指定规则项

## v2.9.95
1. feat: JSON Viewer 的右键菜单支持 Copy 选中的文本
2. feat: Composer 历史列表添加右键菜单
3. feat: 优化界面及性能
4. feat: 支持通过插件安装插件，实现方式参考：https://github.com/whistle-plugins/whistle.installer
5. feat: 支持通过界面卸载插件

## v2.9.94
1. fix: https://github.com/avwo/whistle/pull/1192

## v2.9.93
1. feat: 重放请求时保留 http2 session
2. feat: 添加命令行参数 `--enable-https`：`w2 ca --enable-https`
3. feat: Composer 添加 QUERY 方法
4. feat: locationHref 支持通过设置 locationHref://replace:url 改用 location.replace
5. fix: https://github.com/avwo/whistle/pull/1192

## v2.9.92
1. feat: 优化响应超时机制，关闭 `requestTimeout`

## v2.9.91
1. fix: https://github.com/avwo/whistle/issues/1183
2. fix: https://github.com/avwo/whistle/issues/1173
3. fix: https://github.com/avwo/whistle/issues/1081

## v2.9.90
1. feat: 支持 [whistle-client](https://github.com/avwo/whistle-client) 搜索功能

## v2.9.89
1. feat: Composer 支持导入 CURL 文本
2. feat: 优化 Composer

## v2.9.88
1. perf: 优化 `enable://captureStream`
2. feat: Composer 支持通过右键发送按钮选择发送文件
3. fix: 某些情况下解析配置规则里面的数据对象有误（v2.9.87版本引入）

## v2.9.87
1. feat: `delete://reqType||resType|reqCharset|resCharset`
2. feat: `delete://resBody.xxx` 删除响应的 JSON 数据可以 key
3. feat: `delete://reqBody.xxx` 删除请求内容为表单或 JSON 的 JSON 数据对应 key
4. feat: Network 支持通过 `/` 快速聚集到搜索框

## v2.9.86
1. feat: JSON View 右键菜单 `Inspect Value` 查看当前 key 对应的 Value 对象
2. feat: JSON Dialog 添加前进和后退键查看历史记录
3. feat: 通过 Whistle 构造的请求会在 Network 的 Order 里面加特殊标识

## v2.9.85
1. feat: 支持显示 sse 内容（默认只对非 gzip 及 content-length 头小于 2m 的请求生效，其它类型请求可以通过 `enable://captureStream` 强制开启）
2. fix: https://github.com/avwo/whistle-client/issues/60
3. fix: https://github.com/avwo/whistle/issues/1145

## v2.9.84
1. feat: 证书默认格式改成 cer 以适配更多机型（涉及：短链接，二维码，点击下载）
2. fix: 某些浏览器没有发送 `sec-fetch-site` 导致内部请求误判为跨域请求问题

## v2.9.83
1. fix: https://github.com/nodejs/node/issues/52681
2. fix: https://github.com/avwo/whistle/issues/1137
3. feat: 新增参数 `--allowOrigin` 用于设置允许哪些第三方页面访问 Whistle 的内部接口
4. feat: 插件的 rules.txt 文件支持引入 3 个远程规则 `@path`，之前版本只支持1个

## v2.9.82
1. feat: Overview、Inpsectors 支持自定义右键菜单
2. feat: 支持通过 `-M` `dnsResolve`、`dnsResolve4`、`dnsResolve6` 改 dns 方法
3. refactor: 优化界面，`dns.lookup` 失败使用 `dns.resolve` 或 `dns.resolve6` 重试

## v2.9.81
1. feat: 支持设置 URL 列不显示请求参数
2. feat: 域名为 IP 的 HTTPS 请求不解包

## v2.9.80
1. fix: 远程部署可能出现 `captureError` 问题
2. feat: 优化界面

## v2.9.79
1. feat: 优化 Dark 模式样式，并重新调整为默认不跟随系统的 Dark 模式
2. feat: 根证书过期后，可以通过 `w2 ca` 更新根证书

## v2.9.78
1. feat: 保留无法识别的 `accept-encoding` 请求头
2. feat: Rules 里面的规则如果未发生改变，点击 Save 也可以启用规则
3. feat: `statusCode://401` 默认会弹出输入用户名和密码的登录框，可以通过 `disable://userLogin` 或 `lineProps://disableUserLogin` 去掉登录框

## v2.9.77
1. feat: `locationHref://url` 和 `redirect://url` 自动去重
2. feat: 支持通过 `jsPrepend://` 设置 `window.__WHISTLE_PATH_PREFIX__ = '/path/to';`（可以配置规则或集成在插件） 修改 Whistle 内部路径 `/.whistle-path.5b6af7b9884e1165/` 改成 `${window.__WHISTLE_PATH_PREFIX__}/.whistle-path.5b6af7b9884e1165/`，方便通过 ngnix 转发（ngnix 可以把 `/path/to` 路径去掉再发送给 Whistle）

## v2.9.76
1. refactor: 删除所有 q 模块，解决安装告警问题

## v2.9.75
1. refactor: 优化 sse 请求的 `resReplace` 逻辑
2. fix: 界面 `Enable HTTP/2` 报错问题
3. feat: 新增 `locationHref://url` 和 `locationHref://js:url` 协议，相当于在 html 页面或 js 文件返回 `window.location.href = url`

## v2.9.74
1.fix: https://github.com/avwo/whistle/issues/1098

## v2.9.73
1. feat: 新增启动参数 `-M ipv4first|ipv6first` 用于设置 [dns.lookup的 options.order 参数](https://nodejs.org/docs/latest/api/dns.html#dnslookuphostname-options-callback)
2. feat: `localhost` 的 dns.lookup 默认使用 `ipv4first`
3. feat: Online 支持设置 `Verbatim`、`IPv4-first`、`IPv6-first`
4. feat: 支持 `delete://query.xxx` 删除请求 url 里面的参数

## v2.9.72
1. fix: socks 代理无法获取 clientIp 及 IPv6 转发问题

## v2.9.71
1. feat: 自动更新 Rules & Values
2. feat: Mock 对话框新增 Create 按钮


## v2.9.70
1. feat: 插件列表添加自定义右键菜单
2. feat: 支持通过 `pattern jsAppend://[value|file|url] linePropslineProps://nomodule lineProps://module lineProps://defer lineProps://async lineProps://crossorigin`  设置标签属性

## v2.9.69
1. fix: https://github.com/avwo/whistle/issues/1064
2. feat: 支持通过 `http://local.whistlejs.com/?dataUrl=encodeURIComponent(dataUrl)` 导入 `dataUrl` 返回的数据

## v2.9.68
1. feat: 新增 `enable://abortRes` 在响应阶段中断请求
2. feat: 优化界面展示

## v2.9.67
1. feat: 新增 `enable://requestWithMatchedRules` 及 `enable://responseWithMatchedRules` 支持在请求头或响应头带上当前匹配的规则
2. feat: 调整 Tools/Console 日志的缓存大小
3. feat: Values 的编辑器添加快捷键 `Shift + Ctrl[Command] + F`、`Shift + Ctrl[Command] + I` 分别用来格式化和通过 JSONView 查看 JSON 数据
4. feat: Whistle 默认会对 WebSocket 压缩包进行解压，有[用户反馈存在解压bug][https://github.com/avwo/whistle/issues/1048]，故新增 `wss://xxx disable://wsDecompress` 禁止解压数据包
5. feat: WebSocket Frames 列表添加右键功能

## v2.9.66
1. feat: 支持通过正则表达式搜索日志
2. feat: 支持通过 `disable://captureHttp disable://captureHttps`  关闭 http 或 https 的 TUNNEL 请求

## v2.9.65
1. feat: 支持 Rules 里面的 Values 和临时文件通过 Ctrl[Command] + 鼠标点击快速修改
2. feat: 新增默认临时空白文件 `temp/blank`（支持自定义后缀 `temp/blank.xxx`）
   > 可以通过在 Rules 新建文件 `protocol://temp/blank.xxx` 再通过Ctrl[Command] + 鼠标点击快速修改生成新的临时文件
3. feat: Values 右键菜单新增 JSON / Inspect 查看 JSON 数据对象

## v2.9.64
1. feat: Mock 功能支持对临时文件添加注释
2. feat: 优化 Rules & Values 的拖拽功能
3. fix: https://github.com/avwo/whistle/issues/1040

## v2.9.63
1. feat: 支持 Cookie 的 `Partitioned` 属性（该属性需要跟 `Secure`、`SameSite=None` 一起使用）
2. feat: Composer 添加 `CopyAsCURL` 按钮
3. feat: Composer 添加 `ProxyRules` 选项，去选后可以禁用 Proxy (Whistle) 设置的所有规则（Proxy 里面的规则优先级高于 Composer Rules）

## v2.9.62
1. chore: 更新 CodeMirror 版本
2. feat: Network Settings 支持导入导出
3. feat: Rules & Values 支持通过 `b:keyword` 搜索内容
4. feat: Composer 支持导入导出
5. feat: 插件 Option 支持设置 `openInModal` 以对话框形式打开
6. feat: Network 列表新增 `Back to the bottom` 按钮

## v2.9.61
1. fix: 在新版本 Node 可能存在 [pipe](https://wproxy.org/whistle/rules/pipe.html) 功能失效问题
2. fix: https://github.com/avwo/whistle/issues/1017

## v2.9.60
1. fix: https://github.com/avwo/whistle/issues/1012

## v2.9.59
1. feat: 支持 https://github.com/avwo/whistle/issues/978
2. feat: 客户端支持直接使用 WebView 预览抓包内容


## v2.9.58
1. feat: Network 右键菜单 Mock > Export，通过插件或拖拽导入 Mock 数据
2. feat: 插件支持 `window.whistleBridge.download({name, value[, base64]})` 下载指定数据
3. feat: 新增特殊路径 `/_WHISTLE_5b6af7b9884e1165_/`，Whistle 会自动将url 里面第一个此路径片段替换成 `/`

## v2.9.57
1. feat: Composer 添加修改请求参数按钮 `Params`
2. feat: Composer 面板优化
3. feat: Composer 添加 Cookies 按钮方便获取当前抓包记录里面对应域名的 Cookie
4. feat: 支持通过启动参数 `uiExt` 往页面注入 js 或 html （把 Whistle 作为第三方 npm 包使用时可用）
	``` js
	uiExt?: {
    required?: boolean;
    htmlPrepend?: string;
    htmlAppend?: string;
    jsPrepend?: string;
    jsAppend?: string;
  };
	```

## v2.9.56
1. feat: 支持通过 `Online / IPv6-only network` 强制 dns 获取 ipv6（命令行版本还可以通过 `-M ipv6Only` 开启）
2. feat: `w2 add` 命令支持 `type: module`
## v2.9.55
1. feat: 显示 `captureError`，且可以通过插件获取到这类型错误的抓包数据
2. fix: 完善 `refreshPlugins` 方法（内部方法）

## v2.9.54
1. fix: 修复 Dark Mode 模式下图片显示问题
2. fix: JSON 过滤搜索时保留数组的 index

## v2.9.53
1. feat: 支持通过 `enable://forHttp|forHttps` 设置 `enable://capture` 只对 http 或 https 生效
2. feat: 支持通过请求参数设置登录态
3. feat: 支持 `Dark Mode`，且可以通过界面 `Online -> 打开对话框 -> Disable dark mode` 关闭自动切换 `Dark Mode`

## v2.9.52
1. feat: 跨域请求本地替换自动设置 cors，可以通过 `disable://autoCors` 或 `lineProps://disableAutoCors` 关闭

## v2.9.51
1. fix: https://github.com/avwo/whistle/issues/912
## v2.9.50
1. fix: Node 20.1.0 版本 `http.request` 只支持通过 `options.search` 设置参数问题
2. feat: 支持通过 `--uiport "127.0.0.1:8080"` 限制 WebUI 只能通过指定网卡和端口访问

## v2.9.49
1. fix: `headerReplace://req.host:pattern=value` 无效问题
2. feat: 插件添加 `sharedStorage` 方便插件在不同实例中共享存储数据
3. style: https://github.com/avwo/whistle/pull/898

## v2.9.48
1. feat: 插件扩展的右键菜单和 Tab 添加 `exportSessions(sessions, type, name)` 方法
2. feat: 插件 server 的 options 添加 `generateSaz(sessions): Buffer` 和 `extract(saz: Buffer, cb(sessions))` 方法
3. refactor: 兼容 saz 的 comment，需要配合插件使用：https://github.com/whistle-plugins/whistle.comment.git
4. fix: 修复访问 socks 代理可能出现 pending 的问题
5. style: 界面优化

## v2.9.47
1. refactor: 解决安装时依赖包安全警告问题
2. feat: 支持自定义右键菜单获取树结点下的所有抓包数据

## v2.9.46
1. feat: 扩展 Tab 支持 `copyText` 方法
2. feat: `tpl` 协议支持模板字符串语法

## v2.9.45
1. feat: 插件界面提供 `copyText` 方法
2. feat: 支持 `lineProps://strictHtml` 和 `lineProsy://safeHtml` 只对当前行的规则生效
3. style: Mock Dialog 支持直接保存 Value

## v2.9.44
1. fix: 解决 `qs` 模块不存在问题

## v2.9.43
1. feat: 允许通过 `enable://capture` 解析 socks 代理的 HTTPS 请求
2. feat: 支持通过 Network 右键菜单 `Mock` 按钮快速创建规则：http://wproxy.org/whistle/webui/mock.html

## v2.9.42
1. style: 支持自动提示 Values 的 Key
2. style: Composer 的 History 选项改成箭头按钮
3. feat: 支持批量删除 Rules & Values

## v2.9.41
1. fix: Network Settings 列设置刷新失效问题
2. style: WebForm 支持显示 JSON 对象
3. style: Preview 优先显示 JSON View

## v2.9.40
1. refactor: `Network / Tools / Console & Server` 支持捕获 `unhandledrejection` 的错误信息，且`Console & Server` 最大缓存日志条数调整为 230
2. feat: 支持 earlyHints
3. feat: JSONView 右键支持 `Expand All` 及 `Collapse All`

## v2.9.39
1. feat: JSON View 支持搜索
2. feat: 自动记录用过的 npm registry
3. feat: 模板字符串支持 `${env.xxx}` 获取环境变量 `xxx` 对应的值
4. feat: 支持通过环境变量 `excludeFilter://env.xxx=pattern`
5. style: 匹配 map local 的抓包字体颜色显示成黑色

## v2.9.38
1. refactor: `req.passThrough(handleReq?, handleRes?)` 提供更多功能
	``` js
	req.passThrough(function(rawBuffer, next, ctx) {
		ctx.getText((err, text) => {
			console.log(err, text);
		}, encoding?); // 自动 unzip 并转成字符串，字符编码 encoding 可选
		ctx.getJson((err, text) => {
			console.log(err, text);
			next({
				body: rawBuffer,
				rules: '* file://(abc)'
			});
		}, encoding?); // 自动 unzip 并转成json
	}, function(rawBuffer, next, ctx) {
		ctx.getText((err, text) => {
			console.log(err, text);
		}, encoding?); // 自动 unzip 并转成字符串，字符编码 encoding 可选
		ctx.getJson((err, text) => {
			console.log(err, text);
			next({
				body: rawBuffer,
				rules: '* file://(abc)'
			});
		}, encoding?); // 自动 unzip 并转成json
	});
	```

## v2.9.37
1. fix: `resCookies://` 设置失败问题

## v2.9.36
1. feat: 支持通过插件的配置 `whistleConfig.networkColumn: { title: 'xxx', key: 'xxx', width: 90 }` 扩展 Network 表格的列
2. feat: 支持通过插件的配置 `whistleConfig.webWorker: path` 自定义脚本在界面中执行，可以结合自定义列的功能实现查看接口返回错误码（后续补例子）
3. feat: 插件处理非 WebSocket 及 Socket 请求的 `req.passThrough(handleReq?, handleRes?)` 支持传人两个方法（可选）获取请求或响应内容并返回请求内容及规则
	``` js
	req.passThrough(function(buffer, next) {
		next({
			body: buffer,
			rules: '* file://(abc)'
		});
	}, function(buffer, next) {
		next({
			body: buffer,
			rules: '* resCookies://x-test=123'
		});
	});
	```
4. refactor: `delete://resCookie.xxx` 和 `delete://cookie.xxx`  可以删除浏览器中的 cookie（只支持 `path: /` 及 `Domain=父代` 或本域名）
5. style: Network 右键菜单支持 `Copy Cell Text`

## v2.9.35
1. feat: Netwok 的 table 表头支持通过右键调整列宽度
2. feat: Network / Settings 自定义列支持设置关联的 `Data Key`，可以在界面获取抓包数据，无需配置 `style`
		> 可以通过 Network 抓包列表右键菜单 / Open / Source 获取想要的 `Data Key`
3. fix: 复制 curl 命令是请求内容换行符处理有误的问题

## v2.9.34
1. fix: `Network / Tools / Console` 的 Filter 问题，及 Console 采用浏览器的时间
2. refactor: 远程 rulesValue 加载异常记录日志
2. feat: 支持通过 `delete://urlParams.xxx` 删除名称为 `xxx` 的请求参数
3. feat: 支持通过 `delete://reqCookie.xxx` 删除名称为 `xxx` 的请求 cookie
4. feat: 支持通过 `delete://resCookie.xxx` 删除名称为 `xxx` 的响应 cookie
5. feat: 支持通过 `delete://cookie.xxx` 删除名称为 `xxx` 的请求及响应 cookie
   > 上述删除 cookie 操作只会上述请求或响应阶段的 cookie，不会影响已存在浏览器的 cookie

## v2.9.33
1. fix: 路径有特殊字符的域名通配规则可能导致启动失败

## v2.9.32
1. refactor: 彻底删除 Files 菜单
2. style: 添加删除整个分组的按钮
3. style: 优化 Composer 交互及修复界面的一些问题

## v2.9.31
1. fix: https://github.com/avwo/whistle/issues/789
2. refactor: 优化插件的环境变量，支持通过 `hintSuffix` 自定义提示信息

## v2.9.30
1. feat: 支持通过插件设置规则模板，详见：https://wproxy.org/whistle/plugins.html
2. fix: 修复代理响应 407 问题：https://github.com/avwo/whistle/issues/776

## v2.9.29
1. fix: 导出 har 后再导入改 har 时请求内容可能发生变化问题
2. feat: headless 模式支持加载插件及抓包数据
3. feat: 支持通过 `-M agent` 启动复用连接模式

## v2.9.28
1. fix: https://github.com/avwo/whistle/issues/759

## v2.9.27
1. style: 支持在 `Request / WebForms` 显示上传表单数据
2. style: 弱化有新版本时的界面提醒
3. refactor: 减少安装包体积

## v2.9.26
1. fix: 分组状态下保留数据发送两次请求导致无法一直启用规则问题
2. fix: 导出 saz 后原始 url 可能无法正常显示问题

## v2.9.25
1. refactor: 优化插件开发调试，参见：https://github.com/avwo/lack
## v2.9.24
为跟 Homebrew 版本保持一致，跳过此版本
## v2.9.23
1. refactor: 设置代理只需输入一次 root 密码：https://github.com/avwo/whistle/issues/746
2. fix: M1 Pro 上执行 `brew install whistle` 安装 Whistle 失败问题

## v2.9.22
1. fix: 修复部分插件规则优先级问题
2. feat: 支持通过 `pattern operation lineProps://important` 提升规则的优先级

## v2.9.21
1. feat: Rules 与 Values 支持分组
2. fix: `resCors://origin=xxx` 失效问题

## v2.9.20
1. fix: `resCors://*` 失效问题

## v2.9.19
1. feat: 支持自定义 `Upgrade` 请求协议
2. fix: `enable://proxyFirst` 可能出现重复请求问题

## v2.9.18
1. fix: 请求经过代理后 `x-whistle-client-id` 丢失问题
2. feat: 支持在 `Network / Tools` 里面自定义 Tab，详见：https://github.com/whistle-plugins/examples/tree/master/whistle.view-md5

## v2.9.17
1. fix: 规则列表无法拖动排序问题
2. refactor: `enable://clientId` 对所有请求生效（之前只对批评设置代理规则的请求生效）
3. docs: 调整 README

## v2.9.16
1. style: 添加 `Replay Times` 和 `Repeat Times` 菜单，最多可以重放请求 100 次
2. refactor: `compose` cgi 支持设置 `repeatTimes`（不能超过 100 次）
3. feat: 新增 CGI `/rules` `/values` `/rules?name=xxx` `/values?name=xxx` 获取 Whistle 的当前启用的规则和指定规则

## v2.9.15
1. feat: 支持通过 `w2 ca [host:port]` 安装对应 Whistle 代理的根证书（不填参数，默认加载当前本机运行版本）
2. feat: 支持通过 `w2 start[restart|run] --init [bypass]` 启动时同时设置代理和安装根证书，利用此特性可以实现通过 `npm i -g whistle && w2 restart --init` 一键安装 Whistle
3. feat: 支持上传 `.cer` 及 `.pem` 证书
4. feat: 支持通过 `process.env.WHISTLE_MODE` 定义启动参数 `-M xxx`
5. fix: `utf8` 编码不支持 `0x7f` 字符问题

## v2.9.14
1. feat: 支持通过命令行 `w2 proxy [off] [port] [host:port] [-x bypass]` 设置系统的全局代理
	- `w2 proxy`: 设置全局代理 `127.0.0.1:port`，port 为运行的默认实例的端口（`storage` 为空），如果没有默认实例则为 `8899`
	- `w2 proxy -x "<local>, domain1, domain2"`: 设置全局代理 `127.0.0.1:port`，port 为运行的默认实例的端口（`storage` 为空），如果没有默认实例则为 `8899`，**并设置不代理域名白名单**
	- `w2 proxy 8899`: 设置指定端口的代理，host 默认为 `127.0.0.1`
	- `w2 proxy www.test.com:8080` 或 `w2 proxy www.test.com:auto`: 指定代理的 host 和 port
	- `w2 proxy www.test.com:8080 -x "<local>, domain1, domain2"`: 组合应用
	- `w2 proxy off`: 关闭全局代理

## v2.9.13
1. refactor: 内联规则 `protocol://(key1=value1&key2=value2...)` 不再自动 `decodeURIComponent`
2. refactor: 如果内联规则 `protocol://key1=value1&key2=value2...` 无 `()`，会先检测下对应文件是否存在，不存在就当成 `protocol://(key1=value1&key2=value2...)` 处理

## v2.9.12
1. fix: https://github.com/avwo/whistle/issues/726
2. refactor: 优化 `excludeFilter://host=pattern`

## v2.9.11
1. fix: 使用 `https2http-proxy://host:port` 时，某些 `post` 请求无法正常发送问题
2. fix: 确保模板字符串的 `clientId` 优先获取传过来的请求 `clientId`（需要用本地的 `clientId` 可以使用 `localClientId`）

## v2.9.10
1. feat: 添加 `skip` 协议， skip 与 ignore 的区别，ignore 是将匹配的规则删除掉，skip 是跳过指定的规则不做匹配
2. fix: https://github.com/nodejs/node/issues/42787

## v2.9.9
1. feat: 支持通过 `w2 i 任意url` 安装插件
2. feat: 支持插件通过 `options.getPlugins(cb)` 获取当前 Whistle 安装的插件信息
3. feat: 支持通过 `ignore://matcher=xxx` （等价于 `ignore://operator=xxx`）、`ignore://pattern=xxx` 删除指定匹配的规则
4. style: 插件 `Sync` 功能支持获取历史记录列表

## v2.9.8
1. fix: TUNNEL 代理的 HTTP 请求被拦截后一些代理请求头的透传问题
2. feat: 支持通过 `w2 i git-url` 安装插件

## v2.9.7
1. style: 下次打开 Plugins 页面自动打开之前已打开的插件 Tab
2. refactor: `w2 add` 可以设置的规则大小由 16k 改成 256k
3. fix: TUNNEL 请求帧数据可能显示不全问题

## v2.9.6
1. fix: 长连接里面的帧数据可能展示补全问题
2. fix: 经过插件转发后的请求 client id 丢失问题

## v2.9.5
1. refactor: 如果启动绑定网卡，将网卡显示到 Online 里面
2. style: Tunnel 代理，支持通过请求头或响应头的 `x-whistle-transport-protocol` 自定义 `Protocol` 显示，响应头优先

## v2.9.4
1. fix: auth 插件钩子可能对被拦截的 tunnel 请求不生效问题
2. style: 支持导出的数据自带 Node 和 Whistle 的版本号
3. feat: 插件支持通过 package.whistleConfig.peerPluginList 配置安装插件式自动加载的关联插件列表（最多不超过 15 个插件）

## v2.9.3
1. feat: `redirect` 归类为 `rule` 与 `file`、`statusCode` 等协议同级别
2. refactor: 添加 ts 描述文件
3. refactor:`w2 i plugin` 支持 `w2 i plugin@version`
4. fix: Node 16 引入 `req.filter` 方法引发的问题

## v2.9.2
1. feat: 支持启动参数设置 `options.server` 方便第三方服务集成
	> `server` 可以为 `http.Server` 或 `events.EventEmitter` 对象，在第三方应用中可以通过 `server.emit('request'| 'upgrade' | 'connect', req, res)` 将请求交给 Whistle 处理
2. feat: 支持通过插件引入远程 Value：`protocol://$plugin/xxx`，这种配置会自动从插件 whistle.plugin uiServer 的 `/api/key/value?key=xxx` 获取对应的值
3. refactor: 优化错误日志路径 & `w2 status --all` 显示进程 id
4. refactor: 支持 HTTP2 的 Node 最低版本有 12 调整为 14（低版本的 HTTP2 模块存在一些 bug） 
5. fix: https://github.com/avwo/whistle/issues/697

## v2.9.1
1. feat: 支持通过 `pattern enable://clientIp` 让 Whistle 自动设置 `x-forwarded-for` 请求头
2. style: Values 编辑器支持 JSON 对象折叠，详见：https://github.com/avwo/whistle/pull/683
3. refactor: Whistle 的日志统一放 `$WHISTLE_PATH/whistle.log` 文件，默认为 `~/.WhistleAppData/whistle.log`

## v2.9.0
1. style: 修复禁用所有插件编辑器对应插件规则无法显示插件已失效的问题
2. style: `Frames` 移入 `Inspectors`
3. feat: 将请求匹配的 pattern 传给插件，可以通过 `req.originalReq.isRegExp` 及 `req.originalReq.pattern` 获取
4. feat: 支持自定义 Inspectors tab，详见：https://github.com/whistle-plugins/examples/tree/master/whistle.view-md5
5. feat: 支持自定义 Composer tab，详见：https://github.com/whistle-plugins/examples/tree/master/whistle.view-md5
6. refactor: 插件全局异常也会写入启动目录的日志文件 `whistle.log`，且支持插件通过 `process.handleUncaughtPluginErrorMessage = (errMsg) => {}` 获取全局异常信息，且可以通过 `return false` 来禁止插件自动退出


## v2.8.10
1. fix: 插件的 sniCallback 返回 `false` 请求没有重新走 TUNNEL 代理问题
2. refactor: 如果插件接收到的请求是 https，则 `req.url` 将为完整的路径

## v2.8.9
1. feat: 支持自定义 `inspectors tab`，详见：https://github.com/whistle-plugins/examples/tree/master/whistle.view-md5
2. feat: 支持通过 `disable://abort` 禁用 `enable://abort`
3. feat: Whistle 默认显示的抓包数据不超过 1.5m，可以通过 `enable://bigData` 扩大到 `2.5m`

## v2.8.8
1. feat: 支持通过 `enable://useLocalHost` 和 `enable://useSafePort` 修改 log 和 weinre 请求 URL 的域名或端口
2. style: 界面提供 `api.selectIndex` 选中指定下标的抓包数据
3. feat: 支持插件获取 `originalReq.remoteAddress` 与 `originalReq.remotePort`

## v2.8.7
1. feat: `--httpsPort` 启动的 HTTPS Server 支持从插件获取证书
2. feat: 支持通过 `excludeFilter://from=httpServer`、`includeFilter://from=httpsServer`、`excludeFilter://from=httpServer`、`includeFilter://from=httpsServer` 过滤请求

## v2.8.6
1. refactor: 禁止通过页面上传根证书 `root.key & root.crt`
2. refactor: Whistle 自动生成的证书过期时自动续期（有效期一年）

## v2.8.5
1. feat: 支持通过 `ignore://-*` 过滤 `ignore://*`
2. feat: 支持 `proxy` 和 `pac` 配置 `lineProps://proxyHostOnly`，当用户配置了 `host` 代理才会生效
3. feat: 非 SNI 请求也支持通过插件自定义证书，且支持直接上传和删除用户自定义证书

## v2.8.4
1. fix: 可能无法导入 saz 文件问题

## v2.8.3
1. fix: https://github.com/avwo/whistle/pull/657
2. feat: 插件 `server` 钩子支持通过 `req.setReqRules & req.setResRules` 设置动态规则
3. feat: 支持通过 `enable://forceReqWrite` 和 `enable://forceResWrite` 强制 `reqWrite`、`reqWriteRaw` 和 `resWrite`、`resWriteRaw`
4. feat: `reqWrite:///path/to/` 和 `reqWrite:///path/to` 加以区别，前者会自动把根路径补成 `index.html`
5. feat: 插件的 auth hook 默认情况下如果开启了捕获 https，则对这部分请求只会对解析后的 https 请求生效，如果需要对隧道代理生效可以设置 `enable://authCapture`
6. feat: 默认不启用 `x-forwarded-host` 和 `x-forwarded-proto` 直接放过，可以通过以下方式启用：
	- 启动参数 `-M x-forwarded-host|x-forwarded-proto`
	- 请求进入 Whistle 之前设置请求头 `x-whistle-forwarded-props: host,proto,for,clientIp,ip`

## v2.8.2
1. feat: `resMerge://json1 resMerge://json2` 默认采用 `extend({}, json1, json2)`，新版支持通过 `resMerge://json1 resMerge://json2 resMerge://true` 开启  `extend(true, {}, json1, json2)`
2. refactor: 插件规则里面的 req 和 res rules 分开执行

## v2.8.1
1. refactor: 优化获取证书逻辑，合并多次相同请求
2. refactor: 处理 `unhandledRejection` 事件
3. feat: 支持通过请求头设置响应规则
4. fix: sniCallback 内存泄露问题

## v2.8.0
1. feat: 支持启动 `--cluster [workers]` 模式，通过该方式可以启动多进程模式（worker 为 Whistle headless）
2. fix: 启动时绑定非 `127.0.0.1` 网卡，插件远程规则访问失败问题

## v2.7.29
1. fix: https://github.com/avwo/whistle/issues/643

## v2.7.28
1. fix: WebSocket 无法抓包问题

## v2.7.27
1. fix: 插件用到 `storage.setProperties` 失效问题
2. feat: 插件 `whistleConfig` 支持配置 `inheritAuth` 复用 Whistle 的登录账号

## v2.7.26
1. feat: 支持通过插件 `sniCallback(req, options)` hook 获取远程证书
2. feat: 支持通过 `--config localFile` 加载启动配置，优先级高于命令行

## v2.7.25
1. fix: 某些情况下响应 stream pause 问题
2. refactor: 优化 `w2 stop`，找不到指定实例时自动显示当前所有运行的实例
3. style: 支持将 Rules 添加到最前面

## v2.7.24
1. refactor: 优化 `lineProps://proxyHost|proxyTunnel|proxyFirst`

## v2.7.23
1. style: 优化显示 Composer 历史记录列表
2. style: 禁用 Rules、Plugins 显示小黄条提醒

## v2.7.22
1. feat: 插件 auth 方法支持 `req.setRedirect(url);`
2. perf: 优化启动速度
3. fix: 修复第三方集成时，一些内部请求转发问题

## v2.7.21
1. fix: 清除搜索框历史记录 js 报错问题
2. feat: 普通 HTTP 请求也支持 `customParser`（或 `customFrames`）：https://github.com/whistle-plugins/whistle.custom-parser

## v2.7.20
1. fix: Cannot read property 'headers' of undefined

## v2.7.19
1. feat: HTTP2 支持非 HTTPS 请求
2. feat: 插件支持通过 `options.getCert(domain, (cert || '') => {})` 获取指定域名证书
3. refactor: 优化 `reqDelay` 和 `resDelay` 实现
## v2.7.18
1. feat: 支持插件设置 `tunnelKey` 将指定的隧道代理请求头带到解开后的 http/https/ws 请求头
2. feat: 插件 `auth` 方法支持处理 Whistle 的内部请求
3. feat: 插件 `auth` 支持设置 `req.showLoginBox` 弹出登录框
4. style: 显示 UI 请求情况
5. refactor: 优化内部请求转发逻辑的实现方式

## v2.7.17
1. feat: WebSocket 和 Tunnel 请求支持 `replaceStatus`

## v2.7.16
1. fix: Maximum call stack size exceeded

## v2.7.15
1. perf: 去掉 `Empty Request`，减少内存及 CPU 占用
2. style: Network 的  `Body` 支持显示请求内容大小

## v2.7.14
1. feat: 插件支持通过 `options.require` 直接引用 Whistle 里面的第三方模块或文件
2. refacto: 插件在不同实例使用不同的存储目录

## v2.7.13
1. fix: 特殊情况下 Whistle 无法展示 WebSocket 前几个请求帧问题
2. feat: 支持在模板字符串里面通过 `clientPort` 和 `serverPort` 分别获取客户端和服务端端口
3. refactor: `alert`、`confirm`、`prompt` 等浏览器内置的窗口改用自定义实现，防止 https://www.chromestatus.com/feature/5148698084376576

## v2.7.12
1. fix: `reqReplace` 及 `resReplace` 可能因为拆包导致匹配不准确问题
2. fix: Rules 编辑器行首字母输入 `!` 报错问题

## v2.7.11
1. feat: 插件 hook 支持 `async-await`：

		``` js
		module.exports = async (server, options) => {
			// ... do sth
		};
		```
2. feat: `pipe://xxx` 支持插件内部通过 `req.originalReq.ruleValue` 获取 `xxx://value` 的 `value` 值

## v2.7.10
1. feat: 支持通过 `-M disableForwardedHost` 禁止 Whistle 使用 `x-forwarded-host` 请求头，默认 Whistle 会用该请求头作为请求 URL 的域名
2. feat: 支持通过 `-M disableForwardedProto` 禁止 Whistle 使用 `x-forwarded-proto` 请求头，默认当该请求头值为 `https` 时， Whistle 会把请求当成 HTTPS 处理
3. feat: 第三方通过 `const proxy = startWhistle(options);` 启动 Whistle 时，可以通过 `proxy.on('perfDataChange', (perfData) => {})` 获取 cpu、内存、请求量等数据
4. refactor: 第三方通过 `const proxy = startWhistle(options);` 启动 Whistle 时，可以通过 `proxy.on('pluginLoad', child, name, moduleName);`、`proxy.on('pluginLoadError', err, name, moduleName);` 监听插件启动信息

## v2.7.9
1. feat: 支持 `pattern %plugin=xxx`
2. feat: 支持插件通过 `options.getTop(data => data && console.log(data))` 获取所在 Whistle 的 CPU、内存及请求量等信息

## v2.7.8
1. feat: 源码目录添加 Dockerfile: https://github.com/avwo/whistle/pull/601
2. feat: 支持在插件的根目录执行 `w2 run` 时自动加载该插件
3. refactor: 设置 `resCors://enable` 如果请求头不存在 `origin` 则自动忽略该设置
4. fix: https://github.com/avwo/whistle/issues/600

## v2.7.7
1. fix: [pipe](https://wproxy.org/whistle/rules/pipe.html) 无法直接透传 WebSocket 的二进制包问题
2. style: 支持显示自定义根证书及删除自定义证书导引
3. style: `pipe` 支持智能提示

## v2.7.6
1. feat: 支持通过类似 `--dnsServer http://dns.alidns.com/resolve` 自定义 `dns-over-https` 服务： https://github.com/avwo/whistle/issues/439
2. style: 优化错误提示

## v2.7.5
1. feat: 支持通过 `disable://interceptConsole` 禁止 `log://` 拦截 `console` 的请求，用户只能通过代码 `window._whistleConsole && _whistleConsole.xxx(a, b, ...)` 记录日志
2. feat: 支持在规则里面同时设置多个s `%plugin-name=xxxx` （最多 10 个），Whistle 会自带将这些值带到插件的对象： `req.originalReq.pluginVars`
3. refactor: 显示插件转发的 HTTP 协议 

## v2.7.4
1. refactor: 调整 `delete://reqH.xxxx` 的时机

## v2.7.3
1. style: 优化左侧菜单
2. styl: 修复 Values 右键菜单 Copy / Key 弹出创建新 key 输入框问题
3. feat: 支持设置 `-M shadowRules` （抓包 + 设置 shadowRules） 或 `-M shadowRulesOnly` （无法查看抓包）

## v2.7.2
1. feat: 支持通过命令行参数 `--dnsServer "1.1.1.1,8.8.8.8,10.3.2.1:8080"` 自定义 DNS server
		> 如果需要请求自定义 DNS server 出错时自动转成默认可以用: `--dnsServer "1.1.1.1,8.8.8.8,10.3.2.1:8080,default"`
		> 自定义 DNS server，默认是获取 IPv4，如果需要获取 IPv6，要手动指定 `--dnsServer "2001:4860:4860::8888,[2001:4860:4860::8888]:1053,ipv6"`
2. fix: 修复 List View 通过表头排序后无法 Reset 的问题

## 2.7.1
1. fix: Tree View 抓包数据满了后无法自动更新问题
## v2.7.0
1. feat: Network 支持 Tree View 展示
2. feat: `pac` 支持设置用户名密码：`pac://user:pass@pacPath`
3. style: 支持显示 `Raw Url` 详见：https://github.com/avwo/whistle/issues/572

## v2.6.16
1. fix: 解决规则文件名称过长保存失败的问题
2. feat: 域名统配也支持获取子匹配内容 

## v2.6.15
1. refactor: 优化命令行启动输出的信息
2. feat: 编辑器 `Show Line Number` 时，双击行数可以注释或取消注释
3. feat: `Network / Tools / Toolbox` 支持将对象转成 `Query` 参数
4. style: 支持扩展 `util.openEditor(value)` 方法 

## v2.6.14
1. chore: https://github.com/avwo/whistle/issues/559

## v2.6.13
1. style: Network 搜索框支持最多3个关键字过滤
2. style: Network 右键菜单新增 `Open/Source` 查看当前抓包数据的源码
3. refactor: `onSocketEnd` 添加 `timeout` 事件，兼容各种诡异行为
4. refactor: 优化内部连接管理

## v2.6.12
1. feat: 支持通过 url 参数的 clientId 过来抓包数据
2. feat: 支持通过 `disable://proxyConnection` 将代理转发头改为 `Proxy-Connection: close`

## v2.6.11
1. perf: 确保及时关闭无用连接，减少内存占用
2. style: Online 支持显示 QPS，及 内存、CPU、QPS 的最大值
3. refactor: 处理处理请求过程中无法捕获的异常

## v2.6.10
1. feat: 支持导出 har 文件
2. feat: 支持设置 `-M "disabledBackOption|disabledMultipleOption|notAllowDisableRules"`
3. feat: 内部路径 `/...whistle-path.5b6af7b9884e1165...///` 支持设置域名 `/...whistle-path.5b6af7b9884e1165...///__domain__port__/path/to` (`port__` 可选) 或 `/...whistle-path.5b6af7b9884e1165...///path/to?_whistleInternalHost_=__domain__port__` (`port__` 可选) 

## v2.6.9
1. feat: 支持通过 `--shadowRules jsonString` 导入规则到 Rules
2. style: 支持通过设置请求参数 `disabledEditor=1` 将 Rules & Values 编辑框设置为只读模式

## v2.6.8
1. fix: `excludeFilter` `includeFilter` 混合配置时结果错乱问题
2. feat: 支持 -M `rulesOnly` 及 `pluginsOnly`

## v2.6.7
1. fix: https://github.com/avwo/whistle/issues/540

## v2.6.6
1. fix: 管理界面 CGI 路径可以随意拼接问题

## v2.6.5
1. fix: 部分 Node 版本可能卡死问题
2. fix: [pipe](http://wproxy.org/whistle/rules/pipe.html) 可能导致数据丢失问题

## v2.6.4
1. fix: 编辑器高亮显示插件规则的一些问题
2. feat: 本地文件替换的响应头头默认加入 `content-length` 字段，可以通过 `delete://resH.content-length` 禁用
3. feat: 支持通过 CGI 或 API 获取当前处理的请求总数

## v2.6.3
1. style: 支持预览 SVG 文件
2. feat: 支持通过 `process.on('pforkError', (info) => {})` 获取插件抛出的异常信息
3. perf: 调整GC参数 `--max-semi-space-size=64`

## v2.6.2
1. fix: `v15.5.0` 版本界面无法打开问题

## v2.6.1
1. fix: `v15.5.0` 版本自动设置 `autoDestroy` 导致无法请求的问题

## v2.6.0
1. feat: 支持通过 `Online` 菜单查看当前进程的请求数、CPU、内存状态等
2. feat: 支持通过 `proxy.getRuntimeInfo()` 获取当前进程的请求数、CPU、内存状态等
3. feat: 添加回收站，删除的 Rules 或 Values 会先存放到回收站（最多缓存120条），并可以点击恢复
4. feat: `Network > Tools > ToolBox` 支持通过域名生成对应的证书，方便开发其它 https 服务使用

## v2.5.32
1. feat: tunnel 代理支持确认机制，详见：https://github.com/avwo/lack-proxy/blob/master/lib/proxy.js#L100

## v2.5.31
1. fix: http 请求走 tunnel 代理没有主动调用 `socket.resume()`，可能导致用 lack-proxy 代理的部分请求超时
2. style: 插件禁用后在页面的标签显示 `Disabled`

## v2.5.30
1. fix: 页面 Content Encoding 显示错误问题

## v2.5.29
1. feat: `enable://servername` 删除 https 请求的 sni
2. feat: 支持 `w2 run -M prod` 方便 docker 部署
3. refactor: 自动简称请求或响应内容是否支持gzip

## v2.5.28
1. feat: 新增 `lineProps://proxyHost|proxyTunnel` 只对当前行生效

## v2.5.27
1. feat: 以 `/...whistle-path.5b6af7b9884e1165...///` 路径开头的内部请求也支持 `enable://proxyTunnel`

## v2.5.26
1. style: JSONView 的右键菜单新增 `Collapse Parent`
2. feat: 添加 `enable://proxyTunnel`，支持两层http代理 **请求 -> http 代理 -> http 代理**
		``` txt
    www.test.com proxy://10.0.0.1:5566 10.1.2.3:8080 enable://proxyHost|proxyTunnel
		```
		上述表示请求将通过 http 代理 `10.0.0.1:5566` 转发到上层 http 代理 `10.1.2.3:8080`

## v2.5.25
1. feat: 支持通过 `-M useMultipleRules` 启用多选，相当于在 Rules/Settings 勾选 `Use multiple rules`
2. fix: 解决 `https2http-proxy` 部分请求无法正常转换问题，该协议主要是将请求自动转成http，并代理到指定 `http proxy`，功能同 `internal-proxy`，但 `internal-proxy` 无法[同时设置host](https://github.com/avwo/help/issues/5)

## v2.5.24
1. feat: 添加 [cipher](http://wproxy.org/whistle/rules/cipher.html) 支持自定义兜底加密算法

## v2.5.23
1. fix: 代理请求头 `Host` 错乱问题（不影响正常使用）

## v2.5.22
1. refactor: 更新 node-forge 解决安全问题
2. fix: h2 请求转成 https 请求时，界面显示响应头大小问题
3. feat: 启动参数 `options` 支持通过字段 `allowPluginList` 和 `blockPluginList` 分别设置可加载的插件及不可加载的插件列表 

## v2.5.21
1. style: Overview 规则列表 hover 上去可以点击查看帮助文档
2. style: Network 搜索框添加历史记录功能

## v2.5.20
1. fix: `reqHeaders://cookie=xxx` 和 `reqCookies://test=123` 无法同时生效问题
2. feat: 支持通过请求参数 `hideLeftMenu=true` 或启动参数 `-M hideLeftMenu` 隐藏左菜单

## v2.5.19
1. feat: 插件自动添加trailers，可以通过 `res.disableTrailer` 禁用
2. refactor: 优化监听 `res.on('end', cb)` 事件，确保事件触发

## v2.5.18
1. feat: 支持传递 `trailers`
2. feat: 支持通过 `delete://trailer.xxx|trailer.yyy` 删除指定tailer（如果存在）
3. feat: 支持通过 `headerReplace://trailer.key:pattern=value` 及 `trailers://json` 修改tailers
4. fix: 自动修改 websocket origin 问题

## v2.5.17
1. feat: 支持 `includeFilter://reqH.cookie=pattern` 等价与 `includeFilter://reqH:cookie=pattern`
2. style: 调整Network字体加粗效果
3. fix: 配置hosts的websocket的https请求无法自动转http请求问题

## v2.5.16
1. fix: https://github.com/avwo/whistle/issues/462

## v2.5.15
1. fix: #464
2. feat: 支持自定义 plugins 列表的卸载及安装命令名称
3. chore: 优化界面及依赖

## v2.5.14
1. feat: 支持通过 `delete://body` 删除请求及响应内容，或 `delete://req.body` 删除请求内容，`delete://res.body` 删除响应内容
2. feat: 支持通过 `reqBody://()` 或 `resBody://()` 分别清空请求或响应内容（不影响reqPrepend、reqAppend 等注入的内容）
3. fix: #456

## v2.5.13
1. refactor: 新增访客模式可以访问的接口
2. style: 页面时间支持显示毫秒

## v2.5.12
1. style: 加粗 Composer 里面的 whistle 自定义请求头
2. fix: https://github.com/avwo/whistle/issues/451
3. refactor: 减少暴露无登录态的接口

## v2.5.11
1. feat: 支持显示 websocket 关闭的错误码
2. style: 支持将请求头以 JSON 文本拷贝

## v2.5.10
1. fix: `--addon "path1,path2"` 无法填多个路径问题
2. fix: 某些服务没按http标准执行，如 `302` 返回内容，可能导致页面或下游代理 pending问题

## v2.5.9
1. style: Frames 里面支持快捷键 `Ctrm[Cmd] + R` 重放请求
2. refactor: 插件里面可以通过 `req.originalReq.ruleUrl` 获取 [rule](https://wproxy.org/whistle/rules/rule/) 匹配结果
3. feat: 拦截 https 请求后，会保留 tunnel 代理请求头 `x-whistle-tunnel-data` 的数据
4. feat: 去掉同步系统hosts设置，且左侧菜单新增 checkbox 可以快速禁用或启用 Rules/Plugins

## v2.5.8
1. perf: gzip 返回抓包数据的 cgi
2. fix: Composer 构造没有body的请求不设置 `content-length: 0` 问题
3. style: 添加快捷键 `ctrl[cmd] + r` 或 `ctrl[cmd] + shift + r` 重放请求

## v2.5.7
1. fix: 通过 [urlParams](https://wproxy.org/whistle/rules/urlParams.html) 和 [pathReplace](https://wproxy.org/whistle/rules/pathReplace.html) 修改请求URL参数的问题
2. style: Network 右键菜单添加 `Actions>Mark` 标记抓包数据
3. refactor: `statusCode` 移入 `rule` 里面跟 `file` 等协议同级

## v2.5.6
1. style: Plugins 添加 `ReinstallAll` 按钮，可以copy插件安装命令
2. fix: 还原匹配顺序，修复：https://github.com/avwo/whistle/issues/421

## v2.5.5
1. fix: `Node >= 14.1` 无法使用http2问题
2. fix: 某些规则可能会被插件返回的规则覆盖问题
3. feat: 模板字符串支持通过 `${hostname}` 获取系统的 `os.hostname()`

## v2.5.4
1. fix: 请求包含匹配的插件规则时，可能导致 Overview 界面脚本报错问题（可能导致某些配了请求映射及包含插件规则的请求 Overvew 出现空白）

## v2.5.3
1. refactor: 优化 `resCors://enable` 支持自动设置 `OPTIONS` 请求的 `access-control-request-headers`, `access-control-request-method` 字段
2. fix: https://github.com/avwo/whistle/issues/412

## v2.5.2
1. feat: 支持 `-M proxifier` 开头 `proxfifier` 模式，该模式下会 whistle 会对所有请求域名为 `ip` 且端口为 `80`, `443` 的请求进行 https 拦截，并判断是否有上传自定义证书
2. fix: Node13~14 开启 http2 功能
3. feat: 支持 json5 配置（Node版本最低要求改为 6）

## v2.5.1
1. fix: `includeFilter://h:key=pattern` 只能匹配请求头，无法匹配响应头问题
2. feat: JSON Tree 支持 Copy 字节点数据
3. feat: Composer 支持上传本地文件

## v2.5.0
1. feat: 支持自定义客户端证书：https://wproxy.org/whistle/custom-certs.html
2. refactor: 优化建立连接时的错误处理
3. style: 现在 Composer 输入的文本长度防止浏览器卡死

## v2.4.17
1. feat: 支持客户端服务端双向认证，详见：[自定义证书](https://wproxy.org/whistle/custom-certs.html)
2. feat: 支持在 Network 自定义列，详见：[style](https://wproxy.org/whistle/rules/style.html)
3. style: 在 Overview 里面显示匹配的 `includeFilter`

## v2.4.16
1. fix: `includeFilter://b:pattern` 失效问题
2. refactor: 鉴于低版本 Node 的 HTTP/2 模块 bug比较多，统一调整为 `Node v12.12.0` 及以上版本才会支持 HTTP/2

## v2.4.15
1. chore: 去掉安装过程中的 `warning`

## v2.4.14
1. style: Frames 页面新增 Overview Tab 用于查看帧数据的基本信息
2. style: Frames 里面二进制数据字体加粗

## v2.4.13
1. fix: Express 框架默认添加的 `x-powered-by` 响应头：https://github.com/avwo/whistle/issues/395

## v2.4.12
1. fix: 部分网站可能出现的 `ERR_HTTP2_SESSION_ERROR`

## v2.4.11
1. feat: 支持 post 等包含请求内容的https请求自动降级到http请求（如果不支持https服务的话）

## v2.4.9
1. refactor: 优化远程规则更新机制，防止误判拉取失败，导致远程规则被情况
2. feat: 支持通过 `-M disableUpdateTips` 禁用版本升级通知（一般用于集成 whistle 的第三方应用）

## v2.4.8
1. fix: 本地 hosts 文件没配 `127.0.0.1 localhost` 可能导致https请求失败问题
2. feat: HTTP2 的 `DELETE` 请求如果携带请求内容，则自动降级为 http/1.1，否则会出现 400 或 忽略请求内容

## v2.4.7
1. fix: https://github.com/avwo/whistle/pull/383
2. refactor: HTTP/2 支持 delete 请求携带 body
3. style: `HTTPS > View all custom certificates` 支持高亮显示过期证书，且支持 copy 证书安装路径
3. fix: 设置 `reqBody://(xxxx) method://post` 无法同时生效问题

## v2.4.6
1. fix: https://github.com/avwo/whistle/issues/380

## v2.4.5
1. feat: 添加 `internal-http-proxy` 大致功能与 `internal-proxy` 一致，只是前者针对 websocket 请求使用的是 tunnel 代理，而后者使用直接 upgrade 请求

## v2.4.4
1. refactor: 传给 Composer 的响应数据改成 base64
2. refactor: 支持从请求 headers 里面的规则解析出 pipe 规则

## v2.4.3
1. fix: 使用 `pipe` 时请求异常导致没有捕获问题，及 http 请求 pipe 失效问题
2. style: 支持在 Overview 里显示 HTTPS 自动转 HTTP 所消耗的时间
3. fix: 调整 `includeFilter` 和 `excludeFilter` 匹配方式，需要满足所有 `includeFilter` 中的一个，且不能匹配到任何 `excludeFilter`，即 `excludeFilter://p1 excludeFilter://p2 includeFilter://p3 includeFilter://p4` 相当于 `!(p1 || p2) && (p3 || p4)`

## v2.4.2
1. fix: 启用 `--socksServer port` 后请求出现异常可能导致程序 crash 问题

## v2.4.1
1. refactor: 支持显示saz文件里面的非文本内容
2. feat: 添加启动参数 `-M safe` 开启安全模式，安全模式下会对服务端的证书进行校验，如果本地的根证书链不支持，则请求会报 `unable to verify the first certificate`，参见：https://github.com/avwo/whistle/issues/368
3. fix: Network 搜索过滤可能出现重复数据的问题

## v2.4.0
1. fix: 上个版本引入的配置 host 出错问题

## <del>v2.3.8</del>
> 该版本有bug，请用最新版本

1. refactor: 优化 IPv6 配置
2. refactor: 去掉多余的接口

## v2.3.7
1. style: Network 的 `URL` 支持修改宽度（个人体验考虑其它列暂时不支持修改宽度）
2. refactor: websocket 如果返回非 101 状态，则透传给浏览器

## v2.3.6
1. refactor: 添加 `package-lock.json`
2. perf: 引入 [react-virtualized](https://github.com/bvaughn/react-virtualized) 极大提升列表性能，详见：https://github.com/avwo/whistle/pull/358
3. feat: 调整列表长度，默认支持同时显示 1500 条抓包数据，可以通过 Network > Filter > Max Rows Number 调整大小

## v2.3.5
1. refactor: 在之前版本设置 `log://xxx weinre://xxx` 时，为了防止把注入都js缓存到浏览器，whistle 会自动删除缓存的响应头，即使设置了 `cache://xxx` 也无用，新版以 `cache://xxx` 优先级最高，并支持通过设置 `cache://reserve` 强制保留原来的请求头
2. refactor: 某些 Node 版本会出现某些 socket 没有没有监听 `error` 事件，这里会强制设置一个空的 errorHandler，防止异常抛出
3. fix: 非 SNI 的 https 请求无法解包问题
4. fix: 设置代理重试后重复添加路径问题

## v2.3.4
<del>v2.3.3</del>
1. style: 修复同时安装的插件可能出现排序跳动问题

## v2.3.2
1. fix: WebSocket 请求采用 `internal-proxy://host:port` 时无法准确带上 clientIp 的问题
2. feat: 支持通过设置 `enable://strictHtml` 可以在使用 `htmlXxx, jsXxx, cssXxx` 注入内容到html页面时，会先判断是否第一个非空白字符是 `<` 才会注入
3. feat: 支持通过设置 `enable://safeHtml` 可以在使用 `htmlXxx, jsXxx, cssXxx` 注入内容到html页面时，会先判断是否第一个非空白字符不是是 `{{` 才会注入 （用于统一给某个域名的页面注入脚本等时，防止一些非标准等接口响应类型设置为html，导致误注入的问题）
4. feat: 支持通过启动参数 `-M noGzip` 禁用所有请求的 `gzip` 功能
5. perf: 限制 zlib 的并发量，减少内存泄露（原因参见：	[https://github.com/nodejs/node/issues/8871#issuecomment-250915913](https://github.com/nodejs/node/issues/8871#issuecomment-250915913)）

## v2.3.1
1. fix: 修复 `x-forwarded-for` 混乱问题，直接请求默认不带 `x-forwarded-for`（代理转发会自动带上非本地IP），可以通过 `forwardedFor://ip` 或 `reqHeaders://x-forwarded-for=ip` 自定义 `x-forwarded-for`
2. style: https://github.com/avwo/whistle/issues/354
3. feat: 插件新增方法 `optins.isEnable((enable) => {})` 获取插件是否处于启用状态
4. feat: 插件的 `rules.txt`、`_rules.txt`、`values.txt`、`resRules.txt` 文件支持设置占位符 `{{whistlePluginName}}` 获取插件的短名称（不包含 `whistle.`）, 以及通过 `{{whistlePluginPackage.xx.yy.zzz}}` 获取插件 `package.json` 的值

## v2.3.0
1. feat: `@url` 请求时自动带上 `x-whistle-runtime-id` 便于插件判断请求是否来自宿主代理
2. fix: https://github.com/avwo/whistle/issues/352
3. fix: 修复 HTTP2 模块对http2请求响应格式要求过于严格，导致某些网站http2请求失败问题

## v2.2.4
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

## v2.2.3
1. feat: 部分在响应阶段才会执行的规则放到请求响应后再做匹配
2. style: `Networt > HTTPS > Enable HTTP/2` 去选后接收和发送请求的方式都改用非 H2

## v2.2.2
1. fix: https://github.com/nodejs/node/issues/27384
2. refactor: 优化 H2 session 缓存策略

## v2.2.1
1. refactor: 去掉请求超时设置

## v2.2.0
1. feat: 支持通过 `Network -> HTTPS -> Enable HTTP/2` 关闭或开启 HTTP/2 请求，可以通过 `pattern enable://h2` 局部开启 HTTP/2
2. refactor: 支持自动检测 `xxx.har` 文件是否使用base64编码
3. fix: 修复了内部请求重试可能导致死循环的问题

## v2.1.3
1. style: Composer 里面支持自定义方法
2. perf: 减少h2的session数，每个客户端到h2 session可以完全复用

## v2.1.2
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
	2. feat: 添加在域名中 `.` 匹配方式
		``` txt
		.test.com 表示匹配 x.test.com 与 test.com
		*.test.com 表示匹配 x.test.com，不匹配 test.com
		**.test.com 表示匹配 x.test.com 及其所有子孙代域名
		***.test.com 表示匹配 test.com 及其所有子孙代域名
		上述匹配可以加协议及路径进行更精确代匹配 `http://.test.com/path/to/*`
		```

## v2.1.1
1. fix: 修复自定义插件hint时，如果只有一个补全数据不显示的问题，以及请求和响应内容为空时不显示大小的问题
2. style: Overview 里面支持显示gzip前后的大小
3. feat: 支持通过环境变量 `env.WHISTLE_PLUGIN_EXEC_PATH` 或启动参数 `-M buildIn` 设置 fork whistle 插件进程的 Node 路径 （默认为全局 Node ）

## v2.1.0
1. fix: 修复url替换 `url replacementUrl` path取错问题

## v2.0.0
1. feat: **支持 HTTP2 功能**
	> 请确保运行的 Node 版本为 [LTS(>= 10.16.0) 或 Stable(>= 12.12.0) 的最新版本](https://nodejs.org/en/)，否则可能会出现一些异常，如：[#24037](https://github.com/nodejs/node/issues/24037)、[#24470](https://github.com/nodejs/node/issues/24470)
2. feat: `**/path/to` 如果 `path/to` 里面包含 `*`，如 `*/cgi-*`，则等价与 `^*/cgi-*`

## v1.17.x
1. feat: 浏览器和 whistle 之间支持通过 HTTP2 建立连接，（**需要把 [Node](https://nodejs.org) 更新到 `v10.16.0` 及以上版本**）
2. refactor: 调整连接缓存策略，任何连接不做长缓存，减少内存占用

## v1.16.x
1. feat: 支持插件通过 `options.getRules(cb), options.getValues(cb), options.getCustomCertsInfo(cb)`，分别获取插件 Rules、Values、自定义证书信息
2. feat: HTTPS 菜单的对话框添加 `View Custom Certs` 按钮，用于管理自定义证书
3. feat: 支持通过 `w2 run --inspect` 或 `w2 run --inspectBrk` 开启调试模式
4. feat: 插件列表添加 `Sync` 按钮可用于获取插件的规则或值并设置到界面的Rules或Values
5. feat: 支持通过插件 package.json 配置 `"whistleConfig: { "hintUrl": "/cgi-xxx/xxx" }"`  等方式自定义自动补全列表功能
6. feat: 支持通过 `req.sessionStorage.[get|set|remove]` 实现插件各个server hooks之间的数据传递


## v1.15.x
1. feat: 支持通过命令行参数 `--socksPort 1080` 启动指定监听端口的 SOCKS v5 服务（目前只支持普通 TCP 请求）
2. feat: 插件server添加了 `req.passThrough()`，`req.request(url/options, cb)`，	`req.writeHead(code, message, headers)` 等方法用于将插件里面的请求转发到指定服务
3. feat: 支持通过命令行参数 `-M rules` 启动无抓包页面模式，这种模式下UI将看不到Network，无法抓包且插件无法通过 `req.getSession(cb)` 获取抓包数据
4. feat: 支持通过 `style://color=!xxx&fontStyle=xxxxx&bgColor=red` 设置请求的字体颜色/样式/背景颜色
5. feat: 支持通过 `enable://proxyFirst` 调整 proxy 配置的优先级高于 host （默认：host > proxy）
6. fix: 修复一些运行过程中遇到的问题


## v1.14.x
1. feat: 新增协议 [pipe](https://wproxy.org/docs/rules/pipe.html)、[headerReplace](https://wproxy.org/docs/rules/headerReplace.html)
2. fix: `querystring.parse('+')` 自动转转成空格 ' ' 或 `%2B` 问题
3. refactor: 优化启动参数 [--max-http-header-size=size](https://nodejs.org/dist/latest-v10.x/docs/api/cli.html#cli_max_http_header_size_size) 
4. feat: 新增命令行参数 `--httpPort` 和 `--httpsPort`，分别用于启动普通的 http 和 https server，方便做反向代理，且可用于再启动一个 `http proxy` （跟默认的 http 代理功能一致）和 `https proxy` （可作为https代理服务器） 功能
5. fix: 修复一些运行过程中遇到的问题


## v1.13.x
1. feat: 优化插件功能，支持 `resRules.txt`
2. feat: 新增协议 [excludeFilter](http://wproxy.org/docs/rules/excludeFilter.html) 和 [includeFilter](http://wproxy.org/docs/rules/includeFilter.html)
3. feat: [log](http://wproxy.org/docs/rules/log.html) 支持注入 `whistle.onWhistleLogSend(level, logStr)` 获取页面日志信息自己做上报
4. feat: 插件支持通过 package.json 配置 `"pluginHomepage": "http://xxx.xxx.com/"` 自定义界面 URL
5. feat: 本地替换新增响应 `206` 功能，支持 iOS 播放本地替换的视频文件
6. feat: 命令行添加 `--no-prev-options` 启动选项，支持通过 `w2 restart` 时不复用先前设置的选项

## v1.12.x
1. feat: 支持在 `Rules > Settings > The later rules first` 调整规则的优先顺序，默认从上到下，其中Default里面的规则优先级最低，这个设置只对在 Rules 配置的规则生效，对 [reqScript](https://wproxy.org/docs/rules/reqScript.html) 和插件设置的规则不生效
2. feat: 新增协议 [https-proxy](https://wproxy.org/docs/rules/https-proxy.html)
3. feat: [resCookies](https://wproxy.org/docs/rules/resCookies.html) 支持设置 [SameSite](https://www.owasp.org/index.php/SameSite)
4. feat: 支持通过在 Rules 配置 `@url` 或 `@filepath` 或 `@whistle.xxx/path` 加载远程规则
5. feat: 支持通过命令行 `-r, --shadowRules [shadowRules]` 设置 `shadowRules`
6. feat: 支持内嵌 Values
7. feat: 模板字符串支持 `replace`，且支持子匹配
    ```
    pattern protocol://`${search.replace(pattern1,replacment)}`
    www.test.com file://`${search.replace(/Course_(id)\,?/ig,$1cid)}${test.html}`
    ```
    `pattern1` 为正则或普通字符串(不需要加引号)

## v1.11.x
1. feat: HTTPS 请求自动降级([https://github.com/avwo/whistle/issues/176](https://github.com/avwo/whistle/issues/176))
2. feat: 支持显示HexView（二进制）
3. feat: 新增协议 [xhost](https://wproxy.org/docs/rules/xhost.html)
4. feat: 调整策略，部分协议支持同时匹配多个
5. fix: 修复一些运行过程中遇到的问题

## v1.10.x
1. feat: 完善界面功能
2. feat: 支持端口匹配 `:12345 operation`
3. feat: 支持设置多个访问webui的域名 `-l "webui1.example.com|webui2.example.com"`
4. feat: 支持通过命令行 `w2 add` 获取当前目录 `.whistle.js` 输出的规则配置，具体参见：[命令行参数](https://wproxy.org/docs/cli.html)
5. feat: 通过 `w2 status [-S storage]` 或 `w2 --all` 显示当前whistle运行状态


## v1.9.x
1. feat: 支持通过命令行 `-M network` 设置为抓包模式，该模式只能查看抓包不能设置规则及加载插件
2. feat: 支持通过命令行 `-L "script=a.b.com&vase=x.y.com&nohost=imweb.nohost.pro"` 自定义访问插件的域名
3. feat: Composer 支持设置 Rules

## v1.8.x
1. feat: 新增协议 [htmlPrepend](https://wproxy.org/docs/rules/htmlPrepend.html)、[htmlBody](https://wproxy.org/docs/rules/htmlBody.html)、[htmlAppend](https://wproxy.org/docs/rules/htmlAppend.html)、[cssPrepend](https://wproxy.org/docs/rules/cssPrepend.html)、[cssBody](https://wproxy.org/docs/rules/cssBody.html)、[cssAppend](https://wproxy.org/docs/rules/cssAppend.html)、[jsPrepend](https://wproxy.org/docs/rules/jsPrepend.html)、[jsBody](https://wproxy.org/docs/rules/jsBody.html)、[jsAppend](https://wproxy.org/docs/rules/jsAppend.html)
2. feat: 支持通配符匹配
3. feat: 支持 `Copy As CURL`
4. feat: 支持导入 HAR 文件
5. feat: 支持第三方扩展 Rules 里面的 `@` 符号功能

## v1.7.x
1. feat: 新增协议 [resScript](https://wproxy.org/docs/rules/resScript.html)、 [responseFor](https://wproxy.org/docs/rules/responseFor.html)、 [resforwardedForScript](https://wproxy.org/docs/rules/forwardedFor.html)
2. fix: 修复一些运行过程中遇到的问题

## v1.6.x
1. feat: 支持 WebSocket 请求映射，`ws://www.test.com/xxx https://www.abc.com/a/b`
2. feat: 调整证书策略，防止域名里面有不合规的字符，导致 Chrome 出现证书校验失败
3. fix: 修复一些运行过程中遇到的问题

## v1.5.x
1. feat: Composer 支持构造 WebSocket 和 TCP 请求
2. feat: 支持通过命令行参数 `-P uiPort` 自定义 Whistle 管理界面端口
3. feat: 完善插件功能，支持通过插件的根目录文件 `_values.txt` 设置插件私有的 Values (不支持 `values.txt`)，与私有规则 `_rules.txt` 配套使用
4. feat: 界面支持左侧菜单模式，并支持显示请求客户端的端口号和服务器的端口号
5. fix: 修复一些运行过程中遇到的问题

## v1.4.x
1. feat: 支持通过命令行参数 `-D, -baseDir` 修改 Whistle 存储目录的根路径
2. perf: 优化 `os.networkInterfaces` 的性能
3. fix: 修复一些运行过程中遇到的问题

## v1.3.x
1. feat: pattern 新增支持无 schema 模式 `//xxx`
2. fix: 修复一些运行过程中遇到的问题

## v1.2.x
1. feat: 新增协议 [reqScript](https://wproxy.org/docs/rules/reqScript.html)、[ignore](https://wproxy.org/docs/rules/ignore.html)、[enable](https://wproxy.org/docs/rules/enable.html)
2. feat: 完善插件功能，新增 `statsServer`
3. feat: 新增下载根证书短链接 `http://rootca.pro`

## v1.1.x
1. feat: 新增协议 [pac](https://wproxy.org/docs/rules/pac.html)、[delete](https://wproxy.org/docs/rules/delete.html)、[reqHeaders](https://wproxy.org/docs/rules/reqHeaders.html)、[resHeaders](https://wproxy.org/docs/rules/resHeaders.html)
2. feat: 完善插件功能
3. fix: 修复一些运行过程中遇到的问题

## v1.0.x
1. feat: 完善插件功能，新增 `tunnelServer`、支持新协议 `whistle.xxx://`
2. feat: 完善 `socks`、`proxy` 协议功能
3. feat: 新增命令行参数 `-l, --localUIHost` 支持修改访问配置页面的域名，默认为 `local.whistlejs.com`
4. feat: 代理请求新增 `x-whistle-policy` 用于设置 Whistle 策略
5. fix: 修复一些运行过程中遇到的问题

## 0.x
1. feat: 替换全新的 Logo，感谢部门的视觉设计同事 **[@wjdgh1031(鬼刀)](https://github.com/wjdgh1031)** 帮忙设计了新logo
2. feat: 完善协议功能 [pathReplace](https://wproxy.org/docs/rules/pathReplace.html)、[log](https://wproxy.org/docs/rules/log.html)、[replaceStatus](https://wproxy.org/docs/rules/replaceStatus.html)、[rawfile](https://wproxy.org/docs/rules/rawfile.html)、[xrawfile](https://wproxy.org/docs/rules/xrawfile.html)、[reqAppend](https://wproxy.org/docs/rules/reqAppend.html)、[resAppend](https://wproxy.org/docs/rules/resAppend.html)、[reqType](https://wproxy.org/docs/rules/reqType.html)、[resType](https://wproxy.org/docs/rules/resType.html)、[reqCharset](https://wproxy.org/docs/rules/reqCharset.html)、[ua](https://wproxy.org/docs/rules/ua.html) 、[reqWriter](https://wproxy.org/docs/rules/reqWriter.html) 、[reqWriterRaw](https://wproxy.org/docs/rules/reqWriterRaw.html) 、[reqReplace](https://wproxy.org/docs/rules/reqReplace.html)、[resReplace](https://wproxy.org/docs/rules/resReplace.html) 等
3. feat: 支持导出抓包数据
4. feat: 支持启动多个实例 `w2 start -S newStorageDir -p newPort`
5. feat: 支持自定义插件
6. fix: 修复一些运行过程中遇到的问题
