# enable
通过规则启用 HTTPS、隐藏请求、终止请求等功能。

## 规则语法
``` txt
pattern enable://action1|action2|... [filters...]

# 等效于：
pattern enable://action1 enable://action2 ... [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| action  | 具体动作，详见下面的说明 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

- `abort`：请求或响应阶段中断请求（根据匹配阶段）
- `abortReq`：请求阶段中断请求
- `abortRes`：响应阶段中断请求
- `authCapture`：强制在转成 HTTPS 之前执行 [auth hook](../extensions/dev#auth)（默认是转成 HTTPS 请求后再执行插件的 auth hook）
- `auto2http`：开启 HTTPS 请求报 TLS 错误自动转成 HTTP 请求，默认情况下如果 serverIP 是本地 IP 会自动启用
- `bigData`：扩大抓包数据显示限制(2M→16M)
- `br`：启用 BR 压缩响应内容
- `gzip`：启用 GZIP 压缩响应内容
- `deflate`：启用 Deflate 压缩响应内容
- `capture` 或 `https`：Enable HTTPS（同 [HTTPS菜单功能](../gui/https.html)）
- `captureIp` ：域名为 IP 的请求，默认不解密 HTTPS 请求，可以通过 `enable://captureIp` 启用解析 HTTPS 请求
- `captureStream`：将抓取到的请求与响应内容以数据流的形式，实时输出到抓包界面并动态追加显示
- `clientCert`：启用客户端与服务器之间的双向认证 (mTLS)
- `clientId`：请求头带上 `x-whistle-client-id: Whistle本地生成的唯一ID`
- `clientIp`：为匹配的非本地请求设置 `x-forwarded-for` 请求头，将客户端的真实IP地址透传给上游服务
- `customParser`：自定义抓包界面显示内容，用法参考插件：https://github.com/whistle-plugins/whistle.custom-parser
- `flushHeaders`：`response.writeHead(...)` 后调用 [response.flushHeaders](https://nodejs.org/docs/latest/api/http.html#responseflushheaders)（默认执行）
- `forHttp`：让 `capture` 功能只对 HTTP 请求生效
- `forHttps`：让 `capture` 功能只对 HTTPS 请求生效
- `forceReqWrite`：使用 [reqWrite](./reqWrite)、[reqWriteRaw](./reqWriteRaw) 将请求数据写入本地文件时，如果对应的文件已存在，默认跳过写入操作以保护现有文件，可以通过 `enable://forceReqWrite` 强制覆盖
- `forceResWrite`： 使用 [resWrite](./resWrite)、[reqWriteRaw](./reqWriteRaw) 将响应数据写入本地文件时，如果对应的文件已存在，默认跳过写入操作以保护现有文件，可以通过 `enable://forceResWrite` 强制覆盖
- `h2`：Whistle 代理 -> 服务器启用 HTTP2
- `http2`：浏览器 -> Whistle 代理 -> 服务器全部启用 HTTP2
- `httpH2`：Whistle 代理 -> 服务器的 HTTP 请求启用 HTTP2
- `hide`：在界面上隐藏抓包数据（不包括 `captureError` 和 Composer 发出的请求）
- `hideComposer`：隐藏 Composer 发出的请求
- `hideCaptureError`：隐藏 `captureError` 请求
- `showHost`：将服务器 IP 设置到响应头 `x-host-ip`
- `ignoreSend`：WebSocket 和 TUNNEL 请求时忽略发送数据帧（TUNNEL 请求要启用 `inspect`）
- `ignoreReceive`：WebSocket 和 TUNNEL 请求时忽略接收数据帧（TUNNEL 请求要启用 `inspect`）
- `pauseSend`：WebSocket 和 TUNNEL 请求时暂停发送数据帧（TUNNEL 请求要启用 `inspect`）
- `pauseReceive`：WebSocket 和 TUNNEL 请求时暂停接收数据帧（TUNNEL 请求要启用 `inspect`）
- `inspect`：使的在 Inspectors / Frames 看到 TUNNEL 请求的内容
- `interceptConsole`：截获 `console.xxx` 的请求并显示在 Whistle 管理界面的 Log 面板（默认开启）
- `internalProxy`：利用 `proxy`、`socks` 等代理协议将请求转发至其他代理服务器（如另一 Whistle 实例）。启用此功能后，已在第一层代理解密的 HTTPS 请求将以明文形式在代理链中传输，从而上游代理可以直接获取明文数据
- `proxyFirst`：优先使用 [proxy](./proxy) 规则（默认情况下，同时匹配 `host` 和 `proxy`，只有 `host` 生效）
- `proxyHost`：[proxy](./proxy) 和 [host](./host) 同时生效
- `proxyTunnel`：跟 `proxyHost` 一同使用，让上游代理再次通过隧道代理到上上游的 HTTP 代理，详见下面的示例
- `keepCSP`：通过 `htmlXxx`/`jsXxx`/`cssXxx` 注入内容时会自动删除响应头大 `csp` 字段，如果想保留这些字段可以用 `enable://keepCSP`
- `keepAllCSP`：通过 `htmlXxx`/`jsXxx`/`cssXxx`/`weinre`/`log` 注入内容时会自动删除响应头的 `csp` 字段，如果想保留这些字段可以用 `enable://keepAllCSP`
- `keepCache`：通过 `htmlXxx`/`jsXxx`/`cssXxx` 注入内容时会自动删除响应头的缓存字段，如果想保留原有的缓存头可以用 `enable://keepCache`
- `keepAllCache`：通过 `htmlXxx`/`jsXxx`/`cssXxx`/`weinre`/`log` 注入内容时会自动删除响应头的缓存字段，如果想保留原有的缓存头可以用 `enable://keepAllCache`
- `keepClientId`：保留请求原有的 `x-whistle-client-id` 请求头（默认会删除请求带过来的  `x-whistle-client-id`）
- `safeHtml`：是一种安全防护机制，当使用 `htmlXxx`/`jsXxx`/`cssXxx` 向 HTML 页面注入内容时，会先检查响应内容的第一个非空白字符是否为 `{` 和 `[`（JSON 对象开头字符），如果不是才会执行注入操作。这可以有效防止对非标准 HTML 响应（如 JSON 接口）的误注入
- `strictHtml`：是一种安全防护机制，当使用 `htmlXxx`/`jsXxx`/`cssXxx` 向 HTML 页面注入内容时，会先检查响应内容的第一个非空白字符是否为 `<`，如果不是才会执行注入操作。这可以有效防止对非标准 HTML 响应（如 JSON 接口）的误注入
- `multiClient`：Whistle 作为公共代理且启用 `enable://clientId` 时会为所有请求添加一个固定的 `x-whistle-client-id` 请求头，这导致上游服务无法区分不同客户端。启用 `enable://multiClient` 后，将为每个客户端连接生成并维持一个唯一且不变的标识符，确保上游服务能准确识别请求来源
- `requestWithMatchedRules`：在请求头带上当前匹配的规则
- `responseWithMatchedRules`：在响应头带上当前匹配的规则
- `tunnelHeadersFirst`：用于控制请求头合并的优先级。插件可通过 [tunnelKey](../extensions/dev) 将隧道（TUNNEL）请求头传递至后续阶段。默认的合并规则是：若隧道头与解析后的普通请求头存在同名键，则保留普通请求头的值。启用 `enable://tunnelHeadersFirst` 可改变这一行为，确保隧道请求头优先，从而强制覆盖任何冲突的普通头
- `useLocalHost`：修改 `log` 和 `weinre` 请求 `URL` 的域名，使用内置域名
- `useSafePort`：修改 `log` 和 `weinre` 请求 `URL` 的端口，使用内置端口
- `userLogin`：设置 [statusCode://401](./statusCode) 是否显示登录框（默认显示）
- `weakRule`：默认情况下，当配置了 [file](./file) 等协议时，[proxy](./proxy) 规则会自动失效。通过设置 `weakRule` 属性，可以提升 [proxy](./proxy) 规则的优先级，使其在上述场景中仍然生效
- `socket`：在启用 HTTPS 解析（`Enable HTTPS` 或 `enable://https`）后，发往 `80/443` 端口的 TUNNEL 请求会被强制尝试解析为 HTTP/HTTPS 流量。默认情况下，若解析失败，该连接将被销毁；而其他端口的请求解析失败则会继续以 TUNNEL 方式传输。通过设置 `enable://socket`，可让发往 `80/443` 端口的请求在解析失败时同样降级为 TUNNEL 连接，避免连接被销毁
- `websocket`：用于处理非标准 WebSocket 连接。某些请求虽使用 WebSocket 协议传输，但其 Upgrade 请求头并非标准值（如 `Upgrade: websocket`）。默认情况下，Whistle 会将其视为普通 TCP 连接而不解析数据。启用 `enable://websocket` 可强制 Whistle 识别此类连接为 WebSocket 协议并进行数据解析


## 配置示例
``` txt
# Enable HTTPS
www.example.com enale://https

# 延迟 3000毫秒终止请求
www.example.com/path reqDelay://3000 enable://abortReq

# 延迟 5000毫米终止响应
www.example.com/path resDelay://5000 enable://abortRes

# 本地替换的内容开启 GZIP
www.example.com/path file:///User/xxx/test enable://gzip

# 给上游代理设置 hosts (10.10.10.20:8888)
www.example.com/path proxy://10.1.1.1:8080 10.10.10.20:8888 enable://proxyHost

# 通过上游 HTTP 代理 (10.1.1.1:8080) 将请求通过隧道代理到指定的 HTTP 代理(10.10.10.20:8080)
www.example.com proxy://10.1.1.1:8080 10.10.10.20:8080 enable://proxyHost|proxyTunnel

# 启用浏览器 -> Whistle 代理 -> 服务器整个链路的 HTTP2 功能
www.example.com enable://http2

# 启用 Whistle 代理 -> 服务器的 HTTP2 功能
www.example.com enable://h2

# 强制 Whistle 代理 -> 服务器的 HTTP 请求使用 HTTP2 传输
www.example.com enable://httpH2

# 安全注入模式：当使用 htmlXxx/jsXxx/cssXxx 注入指令时，检测响应首字符不是 `{` 才注入
www.example.com/path enable://safeHtml

# 严格HTML注入模式：当使用 htmlXxx/jsXxx/cssXxx 注入指令时，检测响应首字符不是 `<` 才注入
www.example.com/path enable://strictHtml

# 自动添加 x-forwarded-for 请求头传递客户端真实 IP
www.example.com enable://clientIp

# 扩大抓包数据显示限制(2M→16M)
www.example.com/path enable://bigData

# 修改 log/weinre 请求 `URL` 的域名或端口
www.example.com/path enable://useLocalHost|useSafePort

# 强制 reqWrite/reqWriteRaw/resWrite/resWriteRaw 覆盖已有的文件
www.example.com/path enable://forceReqWrite|forceResWrite

# 强制 HTTPS 请求被解析前也走 `auth hook`（默认是转成 HTTPS 请求后再执行插件的 auth hook）
www.example.com enable://authCapture
```

关联操作：[disable](./disable)
