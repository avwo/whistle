# disable
通过规则禁用 HTTPS、隐藏请求、终止请求等功能。

## 规则语法
``` txt
pattern disable://action1|action2|... [filters...]

# 等效于：
pattern disable://action1 disable://action2 ... [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| action  | 具体动作，详见下面的说明 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |


- `capture` 或 `https`：禁用 `Enable HTTPS`
- `authCapture`：禁用 `authCapture` 功能，详见：[enable](./enable)
- `abort`：禁用 abort 功能，详见：[enable](./enable)
- `abortReq`：禁用 abortReq 功能，详见：[enable](./enable)
- `abortRes`：禁用 abortRes 功能，详见：[enable](./enable)
- `gzip`：禁止压缩响应内容
- `proxyHost`：禁用 proxyHost 功能，详见：[enable](./enable)
- `proxyTunnel`：禁用 proxyTunnel 功能，详见：[enable](./enable)
- - `proxyFirst`：禁用优先使用 [proxy](./proxy) 规则
- `http2`：禁用 http2 功能，详见：[enable](./enable)
- `h2`：禁用 h2 功能，详见：[enable](./enable)
- `httpH2`：禁用 httpH2 功能，详见：[enable](./enable)
- `safeHtml`：禁用 safeHtml 功能，详见：[enable](./enable)
- `strictHtml`：禁用 strictHtml 功能，详见：[enable](./enable)
- `clientIp`：删除请求头 x-forwarded-for
- `bigData`：禁用 bigData 功能，详见：[enable](./enable)
- `forceReqWrite`：禁用 forceReqWrite 功能，详见：[enable](./enable)
- `forceResWrite`： 禁用 forceResWrite 功能，详见：[enable](./enable)
- `auto2http`：禁用 auto2http 功能，详见：[enable](./enable)
- `hide`：禁用 hide 功能，详见：[enable](./enable)
- `useLocalHost`：禁用 useLocalHost 功能，详见：[enable](./enable)
- `useSafePort`：禁用 useSafePort 功能，详见：[enable](./enable)
- `cookies`: 禁用请求和响应的 cookie
- `reqCookies`: 禁用请求的 cookie
- `resCookies`: 禁用响应的 cookie
- `ua`: 禁用 `user-agent` 
- `referer`: 禁用 `referer`
- `csp`: 禁用 CSP
- `cache`: 禁用缓存
- `301`: 禁止 301 跳转，301 强制转 302
- `dnsCache`: 禁止 DNS 缓存
- `ajax`: 删除请求头 `x-requested-with`
- `keepAlive`: 禁止缓存请求连接
- `timeout`：禁用请求超时设置
- `autoCors`：使用 [file](./file) 协议替换请求时，如果 Whistle 检测到该请求属于跨域请求，会自动添加必要的 CORS (跨域资源共享) 头信息，可以通过 `disable://autoCors` 禁用
- `userLogin`：禁用设置 [statusCode://401](./statusCode) 时显示登录框

## 配置示例
``` txt
# 禁用请求的缓存，同时删除请求和响应头的缓存字段
# 跟 cache 协议的区别是，cache 只是用来设置响应的缓存头
wwww.example.com/path disable://cache

# 禁用请求和响应的 cookies
wwww.example.com/path disable://cookies

# 只禁用请求的 cookies
wwww.example.com/path disable://reqCookies

# 只禁用响应的 cookies
wwww.example.com/path disable://resCookies

# 删除 user-agent
wwww.example.com/path disable://ua

# 删除 referer
wwww.test.com/path disable://referer

# 删除csp策略
wwww.test.com/path disable://csp

# 禁用 timeout，默认情况下 Whistle 对每个请求如果 36s 内没有发生数据传输，会认为请求超时
wwww.test.com/path disable://timeout

# 把 301 转成 302，防止 cache
wwww.test.com/path disable://301

# 禁用 HTTPS 拦截
wwww.test.com/path disable://capture

# 不缓存 DNS 结果
wwww.test.com/path disable://dnsCache

# 禁用代理服务器请求链接复用
wwww.test.com/path disable://keepAlive

# 删除请求头 `x-requested-with`
wwww.test.com/path disable://ajax

# 也可以同时禁用多个
www.example.com/path disable://cache|cookies|ua|referer|csp|timeout|301|intercept|dnsCache|keepAlive|autoCors
```

关联操作：[enable](./enable)
