中文 · [English](./CHANGELOG-en_US.md)

## v2.10.1
1. fix: https://github.com/avwo/whistle/issues/1296
2. fix: https://github.com/avwo/whistle/issues/1297
2. feat: 支持快速筛选出匹配规则的请求

## v2.10.0
1. feat: Inspectors 的 Raw Tab 放到第一个位置
2. feat: 映射到本地的路径不允许包含 `../` 路径片段
3. feat: 允许禁用或开启自定义证书，无需删除
4. feat: 插件变量 `%plugin-name=xxx` 支持所有插件 hooks
5. refactor: 简化 Whistle 与插件间的代码传递方式，提升效率
6. fix: 完善测试用例，修复隐藏 bug

## v2.9
1. feat: 界面与体验优化：
      - 根据 Dark 模式规范重新优化界面 Dark 模式
      - Network 支持通过类型快速过滤、手动保存抓包数据
      - Composer 支持导入 CURL、显示 SSE/Websocket 内容
      - JSON Viewer 右键支持复制选中文本
      - 支持显示 TTFB、SSE 内容、WebSocket Frames
      - 新增 frameScript 用于通过 JS 修改 WebSocket/TCP 请求内容
2. feat: 规则与配置增强：
     - 支持通过 `~/.whistlerc` 加载默认配置
     - Rules 支持查看 `Enabled Rules`、分组功能
     - 支持设置匹配概率 `includeFilter://chance:0.5`
     - 新增 `delete://` 协议支持删除请求参数、cookie等
     - 支持 `req.passThrough({transformReq, transformRes, ...})`
     - 内嵌值添加作用域（Rules、插件、Header Rules 相互独立）
3. feat: 插件系统改进：
     - 支持通过界面安装/卸载插件
     - 插件列表添加自定义右键菜单
     - 插件支持 `sharedStorage` 在不同实例中共享数据
     - 插件 Option 页面支持设置 favicon、以对话框形式打开
     - 支持通过插件安装插件
4. feat: 网络与代理功能：
     - 默认启用 `localhostCompatible` 模式
     - 支持 IPv6-only 网络
     - 支持 socks 代理、自定义 DNS server
     - 新增 `https-proxy`、`internal-http-proxy` 协议
     - 支持 HTTP2 功能（需 Node 10.16.0+）
5. feat: 证书与安全：
     - 证书默认格式改为 cer 适配更多机型
     - 支持自定义客户端证书和双向认证
     - 根证书过期后可通过 `w2 ca` 更新

## v2.8
1. feat: 多进程支持
      - 新增 `--cluster [workers]` 启动模式，支持多进程运行
      - 修复启动时绑定非本地网卡时插件远程规则访问失败问题
2. feat: 证书管理优化
      - 自动生成的证书过期时自动续期（有效期一年）
      - 禁止通过页面上传根证书文件（`root.key & root.crt`）
      - 支持非 SNI 请求通过插件自定义证书
      - 支持直接上传和删除用户自定义证书
3. feat: 插件系统增强
      - 插件 `server` 钩子支持通过 `req.setReqRules` 和 `req.setResRules` 设置动态规则
      - 插件可获取客户端连接信息（`originalReq.remoteAddress` 与 `originalReq.remotePort`）
      - 修复插件 `sniCallback` 返回 `false` 时请求未重新走 TUNNEL 代理的问题
      - 优化插件规则执行：req 和 res rules 分开执行
4. feat: 代理规则增强
      - 支持通过 `ignore://-*` 过滤 `ignore://*`
      - 支持 `proxy` 和 `pac` 配置 `lineProps://proxyHostOnly`，仅当用户配置了 `host` 时代理生效
      - `--httpsPort` 启动的 HTTPS Server 支持从插件获取证书
5. feat: 过滤规则扩展
      - 支持通过 `excludeFilter://from=httpServer`、`includeFilter://from=httpsServer` 等按来源过滤请求
      - 支持通过 `enable://useLocalHost` 和 `enable://useSafePort` 修改 log 和 weinre 请求的域名或端口
6. feat: 请求头控制
      - 默认不启用 `x-forwarded-host` 和 `x-forwarded-proto`，可通过以下方式启用：
      - 启动参数 `-M x-forwarded-host|x-forwarded-proto`
      - 请求头 `x-whistle-forwarded-props: host,proto,for,clientIp,ip`
7. feat: 自定义界面
      - 支持自定义 `inspectors tab`
      - 界面提供 `api.selectIndex` 方法选中指定下标的抓包数据
8. feat: 数据限制与优化
      - 默认显示的抓包数据不超过 1.5MB，可通过 `enable://bigData` 扩大到 2.5MB
      - 支持通过请求头设置响应规则
      - 优化获取证书逻辑，合并多次相同请求
9. 文件路径处理
      - `reqWrite:///path/to/` 和 `reqWrite:///path/to` 区别处理，前者自动补全为 `index.html`
10. 合并操作增强
      - `resMerge://json1 resMerge://json2` 默认使用浅合并，可通过 `resMerge://true` 启用深合并
11. feat: 强制写入支持
      - 支持通过 `enable://forceReqWrite` 和 `enable://forceResWrite` 强制 `reqWrite`、`reqWriteRaw` 和 `resWrite`、`resWriteRaw`
12. feat: 认证钩子优化
     - 插件的 auth hook 默认对解析后的 HTTPS 请求生效
     - 支持通过 `enable://authCapture` 使 auth hook 对隧道代理请求生效
13. fix: 问题修复
     - 修复可能无法导入 saz 文件的问题
     - 修复 `sniCallback` 内存泄露问题
     - 处理 `unhandledRejection` 事件
14. refactor: 代码优化
     - 插件接收到 HTTPS 请求时，`req.url` 将包含完整路径
     - 优化获取证书逻辑，减少重复请求
     - 支持通过 `disable://abort` 禁用 `enable://abort`

## v2.7

1. feat: HTTP2 功能扩展
      - **HTTP2 非 HTTPS 支持**：HTTP2 协议现在支持非 HTTPS 请求
      - **性能监控**：第三方集成可通过 `proxy.on('perfDataChange')` 获取 CPU、内存、请求量等运行数据
2. feat: 插件系统全面增强
      - **异步支持**：插件 hook 现在支持 `async-await` 语法
      - **认证集成**：插件 `whistleConfig` 支持配置 `inheritAuth` 复用 Whistle 登录账号
      - **插件管理**：支持在插件根目录执行 `w2 run` 时自动加载该插件
      - **配置共享**：插件支持通过 `options.getCert()` 获取指定域名证书
      - **依赖引用**：插件可通过 `options.require` 直接引用 Whistle 内部模块
3. feat: 命令行工具改进
      - **配置管理**：支持通过 `--config localFile` 加载启动配置（优先级高于命令行）
      - **实例管理**：优化 `w2 stop` 命令，找不到实例时显示所有运行实例
      - **Docker 支持**：源码目录添加 Dockerfile
4. feat: DNS 解析增强
      - **自定义 DNS**：支持通过 `--dnsServer` 参数自定义 DNS 服务器
      - **DNS over HTTPS**：支持类似 `http://dns.alidns.com/resolve` 的 DNS-over-HTTPS 服务
      - **IPv6 支持**：可手动指定 IPv6 DNS 服务器地址
5. feat: 代理协议优化
      - **PAC 认证**：`pac` 协议支持设置用户名密码：`pac://user:pass@pacPath`
      - **隧道代理**：支持插件设置 `tunnelKey` 传递隧道代理请求头
      - **代理转发**：优化 `lineProps://proxyHost|proxyTunnel|proxyFirst` 配置
6. feat: 请求头处理
      - **转发控制**：支持通过 `-M disableForwardedHost` 和 `-M disableForwardedProto` 禁用特定转发头
      - **自定义解析**：`pipe://xxx` 支持插件内部获取原始规则值
7. feat: Network 视图升级
      - **Tree View 支持**：Network 支持树形视图展示抓包数据
      - **原始 URL 显示**：支持显示原始 URL（Raw Url）
      - **数据量显示**：Network 的 Body 列显示请求内容大小
      - **列表优化**：修复 Tree View 和 List View 的数据更新和排序问题
8. feat: 界面交互改进
      - **Composer 历史**：优化 Composer 历史记录列表显示
      - **左侧菜单**：优化左侧菜单布局和交互
      - **状态提示**：禁用 Rules 和 Plugins 时显示更明显的提醒
      - **快捷键支持**：Values 右键菜单修复快捷键问题
9. feat: 规则编辑器增强
      - **规则排序**：支持将 Rules 添加到最前面
      - **错误处理**：修复 Rules 编辑器输入 `!` 时报错的问题
      - **智能提示**：`pipe` 协议支持智能提示功能
10. feat: 认证功能扩展
        - **插件认证**：插件 `auth` 方法支持 `req.setRedirect(url)` 重定向
        - **登录框支持**：插件 `auth` 支持设置 `req.showLoginBox` 弹出登录框
        - **内部请求**：插件 `auth` 方法现在支持处理 Whistle 内部请求
11. feat: 证书管理
        - **根证书管理**：支持显示自定义根证书及删除导引
        - **远程证书**：支持通过插件 `sniCallback(req, options)` hook 获取远程证书
12. feat: 自定义解析器
        - **HTTP 解析**：普通 HTTP 请求现在也支持 `customParser`（或 `customFrames`）
        - **数据替换**：修复 `reqReplace` 及 `resReplace` 因拆包导致的匹配不准确问题
13. feat: 协议支持扩展
        - **状态码替换**：WebSocket 和 Tunnel 请求支持 `replaceStatus`
        - **控制台日志**：支持通过 `disable://interceptConsole` 禁止 `log://` 拦截 `console`
        - **CORS 处理**：`resCors://enable` 在请求头不存在 `origin` 时自动忽略
14. feat: 内存优化
        - **空请求处理**：去掉 `Empty Request` 减少内存和 CPU 占用
        - **栈溢出修复**：修复 Maximum call stack size exceeded 错误
        - **存储分离**：插件在不同实例使用不同的存储目录
15. feat: 启动与运行优化
        - **启动速度**：优化 Whistle 启动速度
        - **延迟实现**：优化 `reqDelay` 和 `resDelay` 的实现机制
        - **插件加载**：第三方集成可监听插件加载事件
16. feat: 模板字符串增强
        - **端口变量**：支持在模板字符串中通过 `clientPort` 和 `serverPort` 获取端口信息
        - **插件变量**：支持在规则中同时设置多个 `%plugin-name=xxxx`（最多10个）
17. fix: 问题修复
        - **对话框定制**：`alert`、`confirm`、`prompt` 等浏览器内置窗口改用自定义实现，防止 Chrome 限制
        - **WebSocket 抓包**：修复 WebSocket 无法抓包的问题
        - **插件存储**：修复插件使用 `storage.setProperties` 失效问题
        - **请求暂停**：修复某些情况下响应 stream pause 问题
        - **第三方集成**：修复第三方集成时的内部请求转发问题
18. feat: 功能调整
        - **删除时机**：调整 `delete://reqH.xxxx` 的执行时机
        - **转发逻辑**：优化内部请求转发逻辑的实现方式
19. feat: 其他改进
        - **规则模式**：支持设置 `-M shadowRules`（抓包+设置规则）或 `-M shadowRulesOnly`（仅规则）
        - **UI 请求**：显示 UI 请求情况
        - **错误提示**：优化错误提示信息
        - **协议显示**：显示插件转发的 HTTP 协议类型

## v2.6

1. feat: 系统监控与状态
      - **在线状态监控**：通过 `Online` 菜单查看当前进程的请求数、CPU、内存状态
      - **API 监控接口**：支持通过 `proxy.getRuntimeInfo()` 获取运行时信息
      - **性能指标**：Online 面板支持显示 QPS 及内存、CPU、QPS 的最大值
2. feat: 数据管理
      - **回收站功能**：删除的 Rules 或 Values 先存放到回收站（最多缓存120条），支持恢复
      - **证书生成工具**：`Network > Tools > ToolBox` 支持通过域名生成对应证书
      - **HAR 文件导出**：支持导出抓包数据为 HAR 格式文件
3. feat: Network 功能增强
      - **高级搜索**：搜索框支持最多3个关键字过滤
      - **源码查看**：右键菜单新增 `Open/Source` 查看抓包数据源码
      - **SVG 预览**：支持预览 SVG 文件
4. feat: 编辑器与规则管理
      - **只读模式**：支持通过 `disabledEditor=1` 参数将 Rules & Values 编辑器设置为只读模式
      - **行号注释**：启用行号显示时，双击行数可注释或取消注释
      - **规则高亮**：优化编辑器对插件规则的高亮显示
5. feat: 交互改进
      - **工具集扩展**：`Network / Tools / Toolbox` 支持将对象转成 Query 参数
      - **快捷操作**：支持扩展 `util.openEditor(value)` 方法
6. feat: 规则导入导出
      - **规则导入**：支持通过 `--shadowRules jsonString` 导入规则到 Rules
      - **命令行输出**：优化命令行启动时的信息显示
7. feat: 模式设置
      - **运行模式**：支持 `-M` 参数设置多种模式：
      - `disabledBackOption|disabledMultipleOption|notAllowDisableRules`
      - `rulesOnly` 及 `pluginsOnly`
8. feat: 内部路径处理
      - **路径灵活性**：内部路径支持设置域名和端口参数，格式：
      - `/...whistle-path.5b6af7b9884e1165...///__domain__port__/path/to`
      - `/...whistle-path.5b6af7b9884e1165...///path/to?_whistleInternalHost_=__domain__port__`
9. 内存与连接管理
      - **连接优化**：确保及时关闭无用连接，减少内存占用
      - **GC 优化**：调整 GC 参数 `--max-semi-space-size=64`
      - **性能监控**：支持通过 CGI 或 API 获取当前处理的请求总数
10. feat: 异常处理
        - **插件异常**：支持通过 `process.on('pforkError')` 获取插件抛出的异常信息
        - **未捕获异常**：优化处理请求过程中无法捕获的异常
        - **超时处理**：`onSocketEnd` 添加 `timeout` 事件，兼容各种异常情况
11. feat: 内部连接
        - **连接管理**：优化内部连接管理机制
12. feat: 过滤规则
        - **规则修复**：修复 `excludeFilter` 和 `includeFilter` 混合配置时结果错乱问题
        - **域名匹配**：域名通配符现在支持获取子匹配内容
13. feat: 代理配置
        - **代理连接头**：支持通过 `disable://proxyConnection` 将代理转发头改为 `Proxy-Connection: close`
        - **客户端过滤**：支持通过 URL 参数的 clientId 过滤抓包数据
14. fix: 主要问题修复
        - **规则文件保存**：修复规则文件名称过长时保存失败的问题
        - **编辑器问题**：修复编辑器高亮显示插件规则的问题
        - **管理界面安全**：修复管理界面 CGI 路径可以随意拼接的问题
        - **Node 版本兼容**：修复特定 Node 版本（v15.5.0）的兼容性问题
        - **pipe 协议**：修复可能导致数据丢失的问题
        - **本地文件替换**：本地文件替换的响应头默认加入 `content-length` 字段
15. perf: 性能问题
        - **卡死问题**：修复部分 Node 版本可能卡死的问题
        - **连接泄漏**：优化连接管理，减少资源占用
16. feat: 响应头处理
        - **内容长度控制**：本地文件替换时自动添加 `content-length` 字段，可通过 `delete://resH.content-length` 禁用
17. 内部请求处理
        - **异步处理**：支持通过 `process.on('pforkError')` 监听插件进程异常

## v2.5

1. feat: 客户端证书支持
      - **自定义客户端证书**：支持配置自定义客户端证书，增强安全认证能力
      - **连接错误处理**：优化建立连接时的错误处理机制
2. feat: 安全协议增强
      - **加密算法扩展**：添加 `cipher` 协议支持自定义兜底加密算法
      - **安全更新**：更新 node-forge 解决已知安全问题
      - **插件安全控制**：启动参数支持通过 `allowPluginList` 和 `blockPluginList` 控制插件加载
3. feat: 认证模式
      - **Proxifier 模式**：支持 `-M proxifier` 开启 proxifier 模式，自动拦截特定请求进行证书判断
4. feat: 隧道代理增强
      - **确认机制**：tunnel 代理支持确认机制，提升代理稳定性
      - **连接恢复**：修复 HTTP 请求走 tunnel 代理未调用 `socket.resume()` 的问题
      - **行级代理配置**：新增 `lineProps://proxyHost|proxyTunnel` 只对当前行生效
5. feat: 多层代理支持
      - **双层代理**：添加 `enable://proxyTunnel` 支持两层 HTTP 代理
      - **内部请求支持**：内部路径请求也支持 `enable://proxyTunnel`
      - **协议转换修复**：解决 `https2http-proxy` 部分请求无法正常转换问题
6. feat: WebSocket 处理
      - **自动转换**：配置 hosts 的 WebSocket HTTPS 请求支持自动转 HTTP
      - **Origin 修复**：修复自动修改 WebSocket origin 问题
      - **数据保留**：拦截 HTTPS 请求后保留 tunnel 代理请求头数据
7. feat: 插件管理
      - **状态显示**：插件禁用后在页面标签显示 `Disabled` 标识
      - **命令自定义**：支持自定义 plugins 列表的卸载及安装命令名称
      - **规则数据获取**：插件可通过 `req.originalReq.ruleUrl` 获取规则匹配结果
8. feat: 插件功能增强
      - **Trailer 支持**：插件自动添加 trailers，可通过 `res.disableTrailer` 禁用
      - **事件监听优化**：优化监听 `res.on('end', cb)` 事件，确保事件触发
9. feat: 数据删除与清空
      - **内容删除**：支持通过 `delete://body` 删除请求及响应内容
      - **选择性删除**：支持 `delete://req.body` 和 `delete://res.body` 分别删除
      - **内容清空**：支持通过 `reqBody://()` 或 `resBody://()` 清空请求或响应内容
10. feat: Trailer 操作
      - **Trailer 传递**：支持传递 `trailers`
      - **Trailer 删除**：支持通过 `delete://trailer.xxx|trailer.yyy` 删除指定 trailer
      - **Trailer 修改**：支持通过 `headerReplace://trailer.key:pattern=value` 及 `trailers://json` 修改
11. feat: 协议优化
      - **SNI 控制**：`enable://servername` 删除 HTTPS 请求的 SNI
      - **状态码调整**：`statusCode` 移入 `rule` 里面跟 `file` 等协议同级
      - **CORS 优化**：`resCors://enable` 自动设置 OPTIONS 请求的跨域字段
12. feat: 界面布局
      - **左侧菜单控制**：支持通过请求参数 `hideLeftMenu=true` 隐藏左菜单
      - **规则开关**：左侧菜单新增 checkbox 快速禁用或启用 Rules/Plugins
      - **系统 hosts**：去掉同步系统 hosts 设置
13. feat: 数据显示
      - **时间精度**：页面时间支持显示毫秒
      - **编码显示**：修复页面 Content Encoding 显示错误问题
      - **响应头大小**：修复 h2 请求转成 https 请求时界面显示响应头大小问题
14. feat: 快捷键优化
      - **通用重放**：添加快捷键 `ctrl[cmd] + r` 或 `ctrl[cmd] + shift + r` 重放请求
      - **Frames 重放**：Frames 支持快捷键 `Ctrl/Cmd + R` 重放请求
15. feat: 交互增强
      - **请求头显示**：加粗 Composer 里面的 whistle 自定义请求头
      - **Network 字体**：调整 Network 字体加粗效果
      - **数据标记**：Network 右键菜单添加 `Actions>Mark` 标记抓包数据
16. feat: 命令行工具
      - **Docker 部署**：支持 `w2 run -M prod` 方便 Docker 部署
      - **多规则模式**：支持通过 `-M useMultipleRules` 启用多选
      - **插件路径**：修复 `--addon "path1,path2"` 无法填多个路径问题
17. feat: 开发配置
      - **JSON5 配置**：支持 json5 配置文件
      - **节点要求**：Node13~14 开启 http2 功能，Node 版本最低要求改为 6
      - **模板变量**：模板字符串支持通过 `${hostname}` 获取系统的 `os.hostname()`
18. feat: HTTP2 支持
      - **HTTP2 兼容性**：修复 `Node >= 14.1` 无法使用 http2 问题
      - **协议检测**：自动检测请求或响应内容是否支持 gzip
19. feat: 数据压缩
      - **Gzip 优化**：gzip 返回抓包数据的 CGI
      - **性能提示**：Composer 输入的文本长度现在防止浏览器卡死
20. feat: 过滤规则
      - **规则修复**：还原匹配顺序，修复规则覆盖问题
      - **响应头过滤**：修复 `includeFilter://h:key=pattern` 无法匹配响应头问题
21. fix: 问题修复
      - **代理请求头**：修复代理请求头 `Host` 错乱问题
      - **规则冲突**：修复 `reqHeaders://cookie=xxx` 和 `reqCookies://test=123` 无法同时生效问题
      - **路径处理**：修复通过 `urlParams` 和 `pathReplace` 修改请求 URL 参数的问题
      - **Composer 构造**：修复 Composer 构造没有 body 的请求不设置 `content-length: 0` 问题
22. fix: 界面修复
      - **Overview 显示**：修复请求包含匹配的插件规则时 Overview 界面脚本报错问题
      - **插件排序**：修复同时安装的插件可能出现排序跳动问题
      - **Frames 显示**：Frames 页面二进制数据字体加粗
23. feat: 功能增强
      - **JSON 操作**：JSON Tree 支持复制子节点数据，JSONView 右键菜单新增 `Collapse Parent`
      - **数据拷贝**：支持将请求头以 JSON 文本拷贝
      - **WebSocket 状态**：支持显示 WebSocket 关闭的错误码
24. feat: 搜索与帮助
      - **搜索历史**：Network 搜索框添加历史记录功能
      - **规则帮助**：Overview 规则列表 hover 可点击查看帮助文档
      - **插件安装**：Plugins 添加 `ReinstallAll` 按钮，可复制插件安装命令
25. feat: 文件处理
      - **Composer 文件上传**：支持上传本地文件
      - **代理标准**：修复某些服务未按 HTTP 标准执行导致的 pending 问题
26. feat: 接口访问
      - **访客模式**：新增访客模式可以访问的接口
      - **接口安全**：减少暴露无登录态的接口

## v2.4

1. feat: 双向认证支持
      - **客户端服务端双向认证**：支持自定义客户端证书，实现客户端与服务端双向认证
      - **安全模式**：新增启动参数 `-M safe` 开启安全模式，严格校验服务端证书
      - **证书管理**：`HTTPS > View all custom certificates` 支持高亮显示过期证书，并支持复制证书安装路径
2. feat: 证书与主机配置
      - **本地主机配置**：修复本地 hosts 文件未配置 `127.0.0.1 localhost` 可能导致 HTTPS 请求失败问题
      - **Express 框架修复**：修复 Express 框架默认添加的 `x-powered-by` 响应头问题
3. feat: HTTP2 优化
      - **Node 版本要求**：鉴于低版本 Node 的 HTTP/2 模块 bug 较多，统一调整为 Node v12.12.0 及以上版本才支持 HTTP/2
      - **HTTP2 会话错误**：修复部分网站可能出现的 `ERR_HTTP2_SESSION_ERROR`
      - **DELETE 请求优化**：HTTP2 的 `DELETE` 请求如果携带请求内容，则自动降级为 HTTP/1.1
      - **HTTP/2 兼容性**：HTTP/2 支持 delete 请求携带 body
3. feat: 代理功能扩展
      - **内部 HTTP 代理**：新增 `internal-http-proxy` 协议，功能与 `internal-proxy` 类似，但对 WebSocket 请求使用 tunnel 代理
      - **SOCKS 代理稳定性**：修复启用 `--socksServer port` 后请求异常可能导致程序 crash 问题
      - **HTTPS 降级**：支持 post 等包含请求内容的 HTTPS 请求自动降级到 HTTP 请求
4. feat: 协议处理改进
      - **pipe 协议修复**：修复使用 `pipe` 时请求异常导致没有捕获问题，以及 HTTP 请求 pipe 失效问题
      - **规则解析增强**：支持从请求 headers 里面的规则解析出 pipe 规则
5. feat: Network 自定义化
      - **自定义列**：支持在 Network 中自定义列显示，通过 `style` 协议配置
      - **Frames 页面增强**：
        - 新增 Overview Tab 用于查看帧数据的基本信息
        - 二进制数据字体加粗显示
      - **搜索过滤**：修复 Network 搜索过滤可能出现重复数据的问题
6. feat: 数据展示优化
      - **Composer 响应数据**：传给 Composer 的响应数据改成 base64 格式
      - **Saz 文件支持**：支持显示 saz 文件里面的非文本内容
      - **Overview 面板**：在 Overview 里面显示匹配的 `includeFilter`
      - **时间显示**：支持在 Overview 里显示 HTTPS 自动转 HTTP 所消耗的时间
7. feat: 规则匹配显示
      - **过滤规则显示**：在 Overview 面板中显示匹配的 `includeFilter` 规则
8. feat: 过滤规则优化
      - **includeFilter 修复**：修复 `includeFilter://b:pattern` 失效问题
      - **匹配逻辑调整**：调整 `includeFilter` 和 `excludeFilter` 匹配方式
        - 需要满足所有 `includeFilter` 中的一个
        - 不能匹配到任何 `excludeFilter`
        - 即 `excludeFilter://p1 excludeFilter://p2 includeFilter://p3 includeFilter://p4` 相当于 `!(p1 || p2) && (p3 || p4)`
9. feat: 远程规则管理
      - **更新机制优化**：优化远程规则更新机制，防止误判拉取失败导致远程规则被清空
      - **规则冲突修复**：修复设置 `reqBody://(xxxx) method://post` 无法同时生效问题
10. feat: 启动参数增强
      - **版本通知控制**：支持通过 `-M disableUpdateTips` 禁用版本升级通知（适用于第三方应用集成）
      - **安装过程优化**：去掉安装过程中的 warning 提示
      - **配置修复**：修复上一个版本引入的配置 host 出错问题
11. feat: 网络配置
      - **IPv6 优化**：优化 IPv6 配置
      - **接口精简**：去掉多余的接口
12. fix: 问题修复
      - **主机配置**：修复本地 hosts 文件配置问题导致的 HTTPS 失败
      - **Express 响应头**：修复 Express 框架默认添加的 `x-powered-by` 响应头问题
      - **HTTP2 错误**：修复部分网站可能出现的 `ERR_HTTP2_SESSION_ERROR`
      - **规则匹配**：修复 `includeFilter://b:pattern` 失效问题
      - **代理异常**：修复启用 `--socksServer` 后请求异常导致程序 crash 问题
      - **规则冲突**：修复设置 `reqBody://(xxxx) method://post` 无法同时生效问题

## v2.3

1. feat: 列表性能显著提升
      - **虚拟列表技术**：引入 `react-virtualized` 库，极大提升 Network 列表渲染性能
      - **默认数据量**：默认支持同时显示 1500 条抓包数据
      - **自定义数量**：可通过 `Network > Filter > Max Rows Number` 调整显示数量
      - **内存管理**：限制 zlib 的并发量，减少内存泄露风险
2. feat: 依赖管理与构建
      - **锁定依赖版本**：添加 `package-lock.json` 确保依赖一致性
      - **构建稳定性**：提升项目构建和部署的稳定性
3. feat: 请求头安全控制
      - **x-forwarded-for 修复**：修复 `x-forwarded-for` 混乱问题
      - **自定义转发头**：支持通过 `forwardedFor://ip` 或 `reqHeaders://x-forwarded-for=ip` 自定义转发地址
      - **代理转发逻辑**：直接请求默认不带 `x-forwarded-for`，代理转发自动带上非本地 IP
4. feat: HTTPS 与证书处理
      - **非 SNI 请求支持**：修复非 SNI 的 HTTPS 请求无法解包问题
      - **HTTP2 兼容性**：修复 HTTP2 模块对请求响应格式要求过于严格的问题
5. feat: 内容注入安全
      - **严格 HTML 检查**：`enable://strictHtml` 确保仅当第一个非空白字符是 `<` 时才注入内容
      - **安全 HTML 检查**：`enable://safeHtml` 防止误注入到非标准接口（检查非 `{{` 开头）
      - **误注入防护**：统一给域名注入脚本时，防止非 HTML 响应类型被误注入
6. feat: 插件开发体验
      - **运行时标识**：`@url` 请求自动带上 `x-whistle-runtime-id`，便于插件判断请求来源
      - **插件状态查询**：新增 `options.isEnable()` 方法获取插件启用状态
      - **模板变量支持**：插件配置文件支持占位符：
        - `{{whistlePluginName}}` - 获取插件短名称（不包含 `whistle.`）
        - `{{whistlePluginPackage.xx.yy.zzz}}` - 获取插件 `package.json` 的值
      - **插件排序**：修复同时安装的插件可能出现的排序跳动问题
7. feat: WebSocket 处理
      - **状态码透传**：WebSocket 返回非 101 状态时，透传给浏览器
      - **代理客户端 IP**：修复 WebSocket 使用 `internal-proxy` 时无法准确带上 clientIp 的问题
8. 代理与连接管理
      - **代理重试修复**：修复设置代理重试后重复添加路径问题
      - **Socket 错误处理**：强制为所有 socket 设置空的 errorHandler，防止未捕获异常
      - **压缩控制**：支持通过启动参数 `-M noGzip` 禁用所有请求的 `gzip` 功能
9. 缓存策略调整
      - **缓存优先级**：`cache://xxx` 现在拥有最高优先级
      - **响应头保留**：支持通过 `cache://reserve` 强制保留原始请求头
      - **注入与缓存协调**：修复 `log://xxx` 和 `weinre://xxx` 注入时与缓存的冲突问题
10. feat: Network 界面优化
      - **列宽调整**：Network 的 `URL` 列支持修改宽度
      - **布局改进**：优化界面布局和交互体验

## v2.2

1. feat: 全局 HTTP2 开关
      - **界面控制**：支持通过 `Network -> HTTPS -> Enable HTTP/2` 关闭或开启 HTTP2 请求
      - **局部启用**：可以通过 `pattern enable://h2` 为特定请求局部开启 HTTP2
      - **模式切换**：取消选择 HTTP2 后，接收和发送请求的方式都改用非 HTTP2
2. feat: HTTP2 性能优化
      - **Session 缓存**：优化 H2 session 缓存策略，提升连接复用效率
      - **Node.js 兼容性**：修复 Node.js 版本兼容性问题（issue #27384）
      - **超时设置优化**：去掉请求超时设置，改进连接管理
3. feat: 命令行规则配置
      - **远程规则加载**：支持通过 `w2 start -r "@https://xxx"` 从远程 URL 加载规则
      - **本地规则文件**：支持通过 `w2 start -r "@filepath"` 从本地文件加载规则
      - **直接规则设置**：支持通过 `w2 start -r "www.test.com/path/to reqHeaders://x-test=1"` 直接设置规则
      - **组合配置**：支持 JSON.stringify 格式组合多个规则源
4. feat: 规则执行优化
      - **响应阶段规则**：部分在响应阶段才会执行的规则放到请求响应后再做匹配
      - **性能改进**：优化规则匹配时机，提高执行效率
5. feat: HAR 文件支持
      - **编码检测**：支持自动检测 `xxx.har` 文件是否使用 base64 编码
      - **数据兼容性**：改进 HAR 文件导入的兼容性和准确性
6. feat: 内部请求处理
      - **重试机制修复**：修复内部请求重试可能导致死循环的问题
      - **连接稳定性**：改进内部请求处理逻辑，避免无限重试
8. feat: 整体优化
      - **代码重构**：优化 H2 session 管理逻辑
      - **配置简化**：去掉不必要的请求超时设置

## v2.1
1. feat: JSON 对象处理
      - **数组与嵌套支持**：多行形式的 JSON 对象现在支持设置数组及多层嵌套的值
      - **智能转换规则**：
        - 以前版本：`[1]: "test"` 转换为 `{ "[1]": "test" }`
        - 现在版本：`[1]: "test"` 转换为 `var arr = []; arr[1] = 'test';`
      - **复杂结构支持**：支持类似 `[a.b[3].c]: abc` 的复杂嵌套结构
      - **转义控制**：使用双引号 `"[xxx.yyy[n]]"` 可以避免自动转义
2. feat: 域名匹配扩展
      - **灵活匹配语法**：
        - `.test.com` - 匹配 `x.test.com` 与 `test.com`
        - `*.test.com` - 匹配 `x.test.com`，不匹配 `test.com`
        - `**.test.com` - 匹配 `x.test.com` 及其所有子孙代域名
        - `***.test.com` - 匹配 `test.com` 及其所有子孙代域名
      - **精确控制**：支持添加协议及路径进行更精确匹配，如 `http://.test.com/path/to/*`
3. feat: 自定义方法支持
      - **方法扩展**：Composer 界面支持自定义请求方法
      - **灵活构造**：用户可以更灵活地构造和发送各种类型的请求
4. feat: HTTP2 性能优化
      - **Session 复用**：减少 HTTP2 的 session 数，每个客户端到 HTTP2 session 可以完全复用
      - **连接效率**：提升 HTTP2 连接的复用效率，减少资源占用
5. feat: 插件开发体验
      - **提示优化**：修复自定义插件 hint 只有一个补全数据不显示的问题
      - **环境变量支持**：支持通过环境变量 `env.WHISTLE_PLUGIN_EXEC_PATH` 或启动参数 `-M buildIn` 设置 fork 插件进程的 Node 路径
      - **路径控制**：默认为全局 Node，可根据需要指定特定 Node 路径
6. feat: Overview 面板增强
      - **压缩信息显示**：Overview 面板支持显示请求的 gzip 前后大小对比
      - **数据大小展示**：修复请求和响应内容为空时不显示大小的问题
7. fix: URL 替换修复
      - **路径处理**：修复 URL 替换 `url replacementUrl` 时路径取错的问题
      - **替换准确性**：确保 URL 替换操作准确处理路径参数
8. perf: 性能优化
      - **HTTP2 连接**：优化 HTTP2 session 管理，减少连接创建开销
      - **数据展示**：改进空内容的数据显示逻辑

## v2.0.0
1. feat: **支持 HTTP2 功能**
	> 请确保运行的 Node 版本为 [LTS(>= 10.16.0) 或 Stable(>= 12.12.0) 的最新版本](https://nodejs.org/en/)，否则可能会出现一些异常，如：[#24037](https://github.com/nodejs/node/issues/24037)、[#24470](https://github.com/nodejs/node/issues/24470)
2. feat: `**/path/to` 如果 `path/to` 里面包含 `*`，如 `*/cgi-*`，则等价与 `^*/cgi-*`

## v1.17
1. feat: 浏览器和 whistle 之间支持通过 HTTP2 建立连接，（**需要把 [Node](https://nodejs.org) 更新到 `v10.16.0` 及以上版本**）
2. refactor: 调整连接缓存策略，任何连接不做长缓存，减少内存占用

## v1.16
1. feat: 支持插件通过 `options.getRules(cb), options.getValues(cb), options.getCustomCertsInfo(cb)`，分别获取插件 Rules、Values、自定义证书信息
2. feat: HTTPS 菜单的对话框添加 `View Custom Certs` 按钮，用于管理自定义证书
3. feat: 支持通过 `w2 run --inspect` 或 `w2 run --inspectBrk` 开启调试模式
4. feat: 插件列表添加 `Sync` 按钮可用于获取插件的规则或值并设置到界面的Rules或Values
5. feat: 支持通过插件 package.json 配置 `"whistleConfig: { "hintUrl": "/cgi-xxx/xxx" }"`  等方式自定义自动补全列表功能
6. feat: 支持通过 `req.sessionStorage.[get|set|remove]` 实现插件各个server hooks之间的数据传递


## v1.15
1. feat: 支持通过命令行参数 `--socksPort 1080` 启动指定监听端口的 SOCKS v5 服务（目前只支持普通 TCP 请求）
2. feat: 插件server添加了 `req.passThrough()`，`req.request(url/options, cb)`，	`req.writeHead(code, message, headers)` 等方法用于将插件里面的请求转发到指定服务
3. feat: 支持通过命令行参数 `-M rules` 启动无抓包页面模式，这种模式下UI将看不到Network，无法抓包且插件无法通过 `req.getSession(cb)` 获取抓包数据
4. feat: 支持通过 `style://color=!xxx&fontStyle=xxxxx&bgColor=red` 设置请求的字体颜色/样式/背景颜色
5. feat: 支持通过 `enable://proxyFirst` 调整 proxy 配置的优先级高于 host （默认：host > proxy）
6. fix: 修复一些运行过程中遇到的问题


## v1.14
1. feat: 新增协议 [pipe](https://wproxy.org/docs/rules/pipe.html)、[headerReplace](https://wproxy.org/docs/rules/headerReplace.html)
2. fix: `querystring.parse('+')` 自动转转成空格 ' ' 或 `%2B` 问题
3. refactor: 优化启动参数 [--max-http-header-size=size](https://nodejs.org/dist/latest-v10/docs/api/cli.html#cli_max_http_header_size_size) 
4. feat: 新增命令行参数 `--httpPort` 和 `--httpsPort`，分别用于启动普通的 http 和 https server，方便做反向代理，且可用于再启动一个 `http proxy` （跟默认的 http 代理功能一致）和 `https proxy` （可作为https代理服务器） 功能
5. fix: 修复一些运行过程中遇到的问题


## v1.13
1. feat: 优化插件功能，支持 `resRules.txt`
2. feat: 新增协议 [excludeFilter](http://wproxy.org/docs/rules/excludeFilter.html) 和 [includeFilter](http://wproxy.org/docs/rules/includeFilter.html)
3. feat: [log](http://wproxy.org/docs/rules/log.html) 支持注入 `whistle.onWhistleLogSend(level, logStr)` 获取页面日志信息自己做上报
4. feat: 插件支持通过 package.json 配置 `"pluginHomepage": "http://xxx.xxx.com/"` 自定义界面 URL
5. feat: 本地替换新增响应 `206` 功能，支持 iOS 播放本地替换的视频文件
6. feat: 命令行添加 `--no-prev-options` 启动选项，支持通过 `w2 restart` 时不复用先前设置的选项

## v1.12
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

## v1.11
1. feat: HTTPS 请求自动降级([https://github.com/avwo/whistle/issues/176](https://github.com/avwo/whistle/issues/176))
2. feat: 支持显示HexView（二进制）
3. feat: 新增协议 [xhost](https://wproxy.org/docs/rules/xhost.html)
4. feat: 调整策略，部分协议支持同时匹配多个
5. fix: 修复一些运行过程中遇到的问题

## v1.10
1. feat: 完善界面功能
2. feat: 支持端口匹配 `:12345 operation`
3. feat: 支持设置多个访问webui的域名 `-l "webui1.example.com|webui2.example.com"`
4. feat: 支持通过命令行 `w2 add` 获取当前目录 `.whistle.js` 输出的规则配置，具体参见：[命令行参数](https://wproxy.org/docs/cli.html)
5. feat: 通过 `w2 status [-S storage]` 或 `w2 --all` 显示当前whistle运行状态


## v1.9
1. feat: 支持通过命令行 `-M network` 设置为抓包模式，该模式只能查看抓包不能设置规则及加载插件
2. feat: 支持通过命令行 `-L "script=a.b.com&vase=x.y.com&nohost=imweb.nohost.pro"` 自定义访问插件的域名
3. feat: Composer 支持设置 Rules

## v1.8
1. feat: 新增协议 [htmlPrepend](https://wproxy.org/docs/rules/htmlPrepend.html)、[htmlBody](https://wproxy.org/docs/rules/htmlBody.html)、[htmlAppend](https://wproxy.org/docs/rules/htmlAppend.html)、[cssPrepend](https://wproxy.org/docs/rules/cssPrepend.html)、[cssBody](https://wproxy.org/docs/rules/cssBody.html)、[cssAppend](https://wproxy.org/docs/rules/cssAppend.html)、[jsPrepend](https://wproxy.org/docs/rules/jsPrepend.html)、[jsBody](https://wproxy.org/docs/rules/jsBody.html)、[jsAppend](https://wproxy.org/docs/rules/jsAppend.html)
2. feat: 支持通配符匹配
3. feat: 支持 `Copy As CURL`
4. feat: 支持导入 HAR 文件
5. feat: 支持第三方扩展 Rules 里面的 `@` 符号功能

## v1.7
1. feat: 新增协议 [resScript](https://wproxy.org/docs/rules/resScript.html)、 [responseFor](https://wproxy.org/docs/rules/responseFor.html)、 [resforwardedForScript](https://wproxy.org/docs/rules/forwardedFor.html)
2. fix: 修复一些运行过程中遇到的问题

## v1.6
1. feat: 支持 WebSocket 请求映射，`ws://www.test.com/xxx https://www.abc.com/a/b`
2. feat: 调整证书策略，防止域名里面有不合规的字符，导致 Chrome 出现证书校验失败
3. fix: 修复一些运行过程中遇到的问题

## v1.5
1. feat: Composer 支持构造 WebSocket 和 TCP 请求
2. feat: 支持通过命令行参数 `-P uiPort` 自定义 Whistle 管理界面端口
3. feat: 完善插件功能，支持通过插件的根目录文件 `_values.txt` 设置插件私有的 Values (不支持 `values.txt`)，与私有规则 `_rules.txt` 配套使用
4. feat: 界面支持左侧菜单模式，并支持显示请求客户端的端口号和服务器的端口号
5. fix: 修复一些运行过程中遇到的问题

## v1.4
1. feat: 支持通过命令行参数 `-D, -baseDir` 修改 Whistle 存储目录的根路径
2. perf: 优化 `os.networkInterfaces` 的性能
3. fix: 修复一些运行过程中遇到的问题

## v1.3
1. feat: pattern 新增支持无 schema 模式 `//xxx`
2. fix: 修复一些运行过程中遇到的问题

## v1.2
1. feat: 新增协议 [reqScript](https://wproxy.org/docs/rules/reqScript.html)、[ignore](https://wproxy.org/docs/rules/ignore.html)、[enable](https://wproxy.org/docs/rules/enable.html)
2. feat: 完善插件功能，新增 `statsServer`
3. feat: 新增下载根证书短链接 `http://rootca.pro`

## v1.1
1. feat: 新增协议 [pac](https://wproxy.org/docs/rules/pac.html)、[delete](https://wproxy.org/docs/rules/delete.html)、[reqHeaders](https://wproxy.org/docs/rules/reqHeaders.html)、[resHeaders](https://wproxy.org/docs/rules/resHeaders.html)
2. feat: 完善插件功能
3. fix: 修复一些运行过程中遇到的问题

## v1.0
1. feat: 完善插件功能，新增 `tunnelServer`、支持新协议 `whistle.xxx://`
2. feat: 完善 `socks`、`proxy` 协议功能
3. feat: 新增命令行参数 `-l, --localUIHost` 支持修改访问配置页面的域名，默认为 `local.whistlejs.com`
4. feat: 代理请求新增 `x-whistle-policy` 用于设置 Whistle 策略
5. fix: 修复一些运行过程中遇到的问题
6. feat: 替换全新的 Logo，感谢部门的视觉设计同事 **[@wjdgh1031(鬼刀)](https://github.com/wjdgh1031)** 帮忙设计了新logo
7. feat: 完善协议功能 [pathReplace](https://wproxy.org/docs/rules/pathReplace.html)、[log](https://wproxy.org/docs/rules/log.html)、[replaceStatus](https://wproxy.org/docs/rules/replaceStatus.html)、[rawfile](https://wproxy.org/docs/rules/rawfile.html)、[xrawfile](https://wproxy.org/docs/rules/xrawfile.html)、[reqAppend](https://wproxy.org/docs/rules/reqAppend.html)、[resAppend](https://wproxy.org/docs/rules/resAppend.html)、[reqType](https://wproxy.org/docs/rules/reqType.html)、[resType](https://wproxy.org/docs/rules/resType.html)、[reqCharset](https://wproxy.org/docs/rules/reqCharset.html)、[ua](https://wproxy.org/docs/rules/ua.html) 、[reqWriter](https://wproxy.org/docs/rules/reqWriter.html) 、[reqWriterRaw](https://wproxy.org/docs/rules/reqWriterRaw.html) 、[reqReplace](https://wproxy.org/docs/rules/reqReplace.html)、[resReplace](https://wproxy.org/docs/rules/resReplace.html) 等
8. feat: 支持导出抓包数据
9. feat: 支持启动多个实例 `w2 start -S newStorageDir -p newPort`
10. feat: 支持自定义插件
11. fix: 修复一些运行过程中遇到的问题
