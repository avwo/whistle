# operation

在 Whistle 中，每条规则由 匹配模式（`pattern`） 和 操作（`operation`） 两部分组成，其中 `operation` 的通用语法为：

``` txt
protocol://[value]
```
- **protocol**：指定操作类型（如 `file`、`proxy`、`resReplace` 等）
- **value**：操作内容（支持多种格式，见下文）

## 内联值
``` txt
pattern reqHeaders://x-proxy=Whistle   # 设置请求头
pattern statusCode://404               # 修改状态码
pattern file://({"ec":0})              # 用内联内容（小括号里面的值：`{"ec":0}`）响应请求
```

当操作内容（Value）包含空格、换行符或特殊字符时，无法直接使用内联方式（Inline），需改用以下方法：

## 内嵌值

```` txt
``` ua.txt
Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1
```
pattern ua://{ua.txt}
````

等价于

```` txt
``` headers.json
user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1
```
pattern reqHeaders://{headers.json}
````

## Values 引用

当操作值（Value）需要被多个规则共享时，直接内嵌在规则中会导致无法复用。此时可以将这些值存储在 Whistle 界面的 Values 模块中，并通过键名引用：
1. 在 Values 里面创建一个名为 `result.json` 的 key 后，填入操作内容
2. 在规则里面即可通过 `{result.json}` 的方式引用，如：`www.test.com/cgi-bin/test file://{result.json}`

<img src="/img//values-demo1.png" width="420" />

## 文件/远程资源
``` txt
pattern reqHeaders:///User/xxx/filepath             # 从本地文件加载操作内容
pattern resHeadrs://https://example.com/config.json # 从远处加载 JSON 对象
pattern resHeaders://temp/blank.json                # 通过边境临时文件
```
> ⚠️ 注意：http/https/ws/wss/tunnel/host/enable/cache... 等协议禁止通过文件路径或远程 URL 获取内容，详见各协议文档。

## 临时文件
当需要频繁编辑内容时，可以使用 Whistle 提供的临时文件功能。

```txt
pattern protocol://temp.json
```

**操作步骤**：
1. 在 Rules 编辑器中，按住 `Command`（Mac）/ `Ctrl`（Windows）
2. 鼠标点击 `protocol://temp.json`
3. 在弹出的编辑对话框中输入响应内容
4. 点击 `Save` 保存

## 小括号用途
在 Whistle 规则中，protocol://value 的 value 部分可能有三种间接引用类型：
1. `{key}` - 引用内嵌值
2. `remote-url` - 远程资源地址
3. `localfilepath` - 本地文件路径

当需要直接引用上述内容本身（而非它们间接引用内容）作为操作内容时，可以用小括号包裹：
``` txt
protocol://(value)
```

示例：
1. `reqHeaders:///User/xxx/yyy.txt` - 从本地文件 `/User/xxx/yyy.txt` 加载操作内容
2. `reqHeaders://(/User/xxx/yyy.txt)` - 将 `/User/xxx/yyy.txt` 直接作为操作内容

## 模板字符串
Whistle 提供了类似 ES6 的模板字符串功能，允许您动态引用请求信息并应用到规则配置中。支持以下几种模板字符串：

##### 一般内敛值
``` txt
pattern protocol://`...${version}...`
```

##### 内嵌值或 Values 引用
```` txt

``` test.key
...${reqId}...
...${version}...
```
pattern protocol://`{test.key}`
````

##### 小括号内容
```` txt
pattern protocol://`(...${now}...)`
````

##### 字符串变量

| 变量名称              | 取值                                                         |
| --------------------- | ------------------------------------------------------------ |
| `${now}`                 | Date.now()                                                   |
| `${random}`              | Math.random()                                                |
| `${randomUUID}`          | crypto.randomUUID()                      |
| `${randomInt(n)}` 或 `${randomInt(n1-n2)}` | 从 [0, n] 或 [n1, n2] 取一个随机正整数 (Added in: v2.9.104)|
| `${reqId}`               | Whistle 给每个请求分配的 ID                                  |
| `${url.protocol}`        | url.parse(fullUrl).protocol                                  |
| `${url.hostname}`        | url.parse(fullUrl).hostname                                  |
| `${url.host}`            | url.parse(fullUrl).host                                      |
| `${url.port}`            | url.parse(fullUrl).port                                      |
| `${url.path}`            | url.parse(fullUrl).path                                      |
| `${url.pathname}`        | url.parse(fullUrl).pathname                                  |
| `${url.search}`          | url.parse(fullUrl).search                                    |
| `${query.xxx}`           | 请求参数 `xxx` 的值                                          |
| `${url}`                 | 请求完整 URL                                                 |
| `${querystring}`         | url.parse(fullUrl).search \|\| '?'（不为空）                 |
| `${searchstring}`        | url.parse(fullUrl).search \|\| '?'（不为空）                 |
| `${method}`              | 请求方法                                                     |
| `${reqHeaders.xxx}`      | 请求头字段 `xxx` 的值                                        |
| `${resHeaders.xxx}`      | 响应头字段 `xxx` 的值                                        |
| `${version}`             | Whistle 版本号                                               |
| `${port}`                | Whitle 端口号                                                |
| `${host}`                | Whistle 启动时监听的网卡 IP（默认为空）                      |
| `${realPort}`            | Whistle 界面 Online 对话框显示的 port（一般为 Whistle 端口号） |
| `${realHost}`            | Whistle 界面 Online 对话框显示的 host（一般为 Whistle 监听的网卡 IP） |
| `${clientIp}`            | 客户端 IP                                                    |
| `${clientPort}`          | 客户端端口                                                   |
| `${serverIp}`            | 服务端 IP                                                    |
| `${serverPort}`          | 服务端端口                                                   |
| `${reqCookies.xxx}`      | 请求 cookie `xxx` 的值                                       |
| `${resCookies.xxx}`      | 响应 cookie  `xxx` 的值                                      |
| `${statusCode}`          | 响应状态码                                                   |
| `${env.xxx}`             | process.env.xxx                                              |
| `${whistle.plugin-name}` | `whistle.plugin-name://value`  或 `plugin-name://value` 的 `value` |

> `${whistle.plugin-name}` 只在插件的内部规则才可能有值

##### 示例

````txt
``` test.txt
now: ${now}
random: ${random}
randomUUID: ${randomUUID}
reqId: ${reqId}
url.protocol: ${url.protocol}
url.hostname: ${url.hostname}
url.host: ${url.host}
url.port: ${url.port}
url.path: ${url.path}
url.pathname: ${url.pathname}
url.search; ${url.search}
query: ${query.name}
url: ${url}
querystring: ${querystring}
searchstring: ${searchstring}
method: ${method}
reqHeaders.accept: ${reqHeaders.accept}
resHeaders.content-type: ${resHeaders.content-type}
version: ${version}
port: ${port}
host: ${host}
realPort: ${realPort}
realHost: ${realHost}
clientIp: ${clientIp}
clientPort: ${clientPort}
serverIp: ${serverIp}
serverPort: ${serverPort}
reqCookies.test: ${reqCookies.test}
resCookies.test: ${resCookies.test}
statusCode: ${statusCode}
env.USER: ${env.USER}
```

www.test.com/index.html file://`{test.txt}`
````

访问 `https://www.test.com/index.html?name=avenwu` 则返回响应内容：

``` txt
now: 1752301623295
random: 0.6819241513880432
randomUUID: e917b9fc-e2ef-4255-9209-11eb417235c5
reqId: 1752301623294-339
url.protocol: https:
url.hostname: www.test.com
url.host: www.test.com
url.port: 
url.path: /index.html?name=avenwu
url.pathname: /index.html
url.search; ?name=avenwu
query: avenwu
url: https://www.test.com/index.html?name=avenwu
querystring: ?name=avenwu
searchstring: ?name=avenwu
method: GET
reqHeaders.accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
resHeaders.content-type: 
version: 2.9.100
port: 8899
host: 
realPort: 8899
realHost: 
clientIp: 127.0.0.1
clientPort: 60582
serverIp: 
serverPort: 
reqCookies.test: 
resCookies.test: 
statusCode: 
env.USER: av
```

## 数据对象
操作内容除了文本或二进制内容，还有可能是 JSON 对象，Whistle 支持以下 3 种数据对象格式：

#### JSON 格式
``` js
{
  "key1": value1,
  "key2": value2,
  "keyN": valueN
}
```

#### 行格式
``` txt
key1: value1
key2:value2
keyN: valueN
```
> 以 `冒号+空格` 分隔，如果没有 `冒号+空格` ，则以第一个冒号分隔，如果没有冒号，则 `value` 为空字符串

**多级嵌套：**
``` txt
a.b.c: 123
c\.d\.e: abc
```
等价于：
``` json
{
  "a": {
    "b": {
      "c": 123
    }
  },
  "c.d.e": "abc"
}
```

#### 内联格式（请求参数格式）

``` txt
key1=value1&key2=value2&keyN=valueN
```
> `key` 和 `value` 最好都 `encodeURIComponent`


## 常见操作指令速查手册 {operation-manual}
- [修改请求内容](#request)
  - [修改请求方法](#method)
  - [修改请求 URL](#url)
  - [修改 HTTP 版本](#http-version)
  - [修改请求头](#req-headers)
  - [修改请求体](#req-body)
- [修改响应内容](#response)
  - [修改状态码](#status-code)
  - [修改响应头](#res-headers)
  - [修改响应体](#res-body)
  - [修改尾部响应头](#trailers)
- [修改连接过程](#connect)
  - [修改 DNS](#dns)
  - [设置代理](#proxy)
  - [代理和 DNS 同时生效](#proxy-host)
- [页面调试工具](#tools)
  - [查看页面 DOM 结构](#weinre)
  - [查看页面日志及错误信息](#log)

---

## 一、修改请求内容 {#request}

### 1.1 修改请求方法 {#method}
```txt
# 基础语法
pattern method://新方法

# 示例
www.example.com/path method://post
```

**数据来源支持：**
- 直接指定：`method://get`
- 内嵌值：`method://{keyOfEmbedded}`
- Values配置：`method://{keyOfValues}`

**注意事项：**
- 方法名不区分大小写
- 不支持从本地文件或远程URL获取

**实用示例：**
```txt
# 示例1：将所有请求方法改为POST
www.example.com/path method://post

# 示例2：仅将PUT请求改为POST
www.example.com/path method://post includeFilter://m:put

# 示例3：根据请求体内容修改方法
www.example.com/api method://put includeFilter://b:cmdname=test
```

### 1.2 修改请求 URL {#url}
#### URL映射
```txt
www.example.com/path/to www.test.com/test
```
**映射效果：**
- `https://www.example.com/path/to?query=abc` → `https://www.test.com/test?query=abc`
- `https://www.example.com/path/to/subpage` → `https://www.test.com/test/subpage`
- `wss://www.example.com/path/to/api` → `wss://www.test.com/test/api`

#### 修改请求参数
```txt
# 新增/替换参数
pattern urlParams://({"key":"value"})

# 删除参数
pattern delete://urlParams.paramName

# 示例：修改参数并删除指定参数
www.example.com/api urlParams://({"cmdname":"Test"}) delete://urlParams.oldParam
```

#### 修改Path路径
```txt
# 正则替换
pattern pathReplace://({"/old/ig":"new"})

# 关键字替换
pattern pathReplace://({"old":"new"})
```

**数据来源支持：**
- 内联JSON
- 内嵌值
- Values配置
- 本地文件
- 远程URL

### 1.3 修改 HTTP 版本 {#http-version}
```txt
# 强制使用普通HTTPS（禁用HTTP/2）
pattern disable://h2
```
> 默认会尝试使用HTTP/2建立连接，不支持时自动降级为HTTPS

### 1.4 修改请求头 {#req-headers}
```txt
# 新增/替换请求头
pattern reqHeaders://({"Header-Name":"value"})

# 删除请求头
pattern delete://reqHeaders.headerName

# 示例
www.example.com reqHeaders://({"X-Custom-Header":"test"})
```

### 1.5 修改请求体 {#req-body}
#### 合并修改（JSON/表单）
```txt
pattern reqMerge://({"newField":"value"})
```

#### 文本替换
```txt
# 正则替换
pattern reqReplace://({"/search/ig":"replace"})

# 关键字替换
pattern reqReplace://({"search":"replace"})
```

#### 完全替换
```txt
pattern reqBody://(新内容)
```

#### 删除操作
```txt
# 删除特定字段
pattern delete://reqBody.fieldName

# 删除整个请求体
pattern delete://reqBody
```

**数据来源支持：**
- 内联值
- 内嵌值
- Values配置
- 本地文件
- 远程URL

---

## 二、修改响应内容 {#response}

### 2.1 修改状态码 {#status-code}
```txt
# 替换现有响应状态码（请求会到达服务器）
pattern replaceStatus://500

# 直接响应状态码（请求不发送到服务器）
pattern statusCode://500
```

### 2.2 修改响应头 {#res-headers}
```txt
# 新增/替换响应头
pattern resHeaders://({"Header-Name":"value"})

# 删除响应头
pattern delete://resHeaders.headerName
```

### 2.3 修改响应体 {#res-body}
#### 合并修改（JSON/JSONP）
```txt
pattern resMerge://({"newData":"value"})
```

#### 文本替换
```txt
pattern resReplace://({"/old/ig":"new"})
```

#### 替换响应体
```txt
# 替换服务器返回的内容
pattern resBody://(新内容)
```

#### 直接响应内容
```txt
# 请求不发送到服务器
pattern file://(直接返回的内容) resType://html
```

#### 删除操作
```txt
# 删除响应体字段
pattern delete://resBody.fieldName

# 清空响应体
pattern delete://resBody
```

### 2.4 修改尾部响应头 {#trailers}
> Trailers是在分块传输响应后发送的额外头部字段

```txt
# 新增/替换Trailers
pattern trailers://({"Trailer-Name":"value"})

# 删除Trailers
pattern delete://trailers.trailerName
```

---

## 三、修改连接过程 {#connect}

### 3.1 修改 DNS {#dns}
```txt
# 设置IP地址
pattern 127.0.0.1

# 设置IP和端口
pattern 127.0.0.1:8080

# CNAME效果（指向其他主机）
pattern host://www.target.com:8080
```

### 3.2 设置代理 {#proxy}
```txt
# HTTP代理
pattern proxy://127.0.0.1:8080

# SOCKS5代理
pattern socks://127.0.0.1:1080

# 支持域名
pattern proxy://proxy.example.com:8080
```

### 3.3 代理和 DNS 同时生效 {#proxy-host}
**优先级说明：**
- 默认：host配置优先于proxy
- 可调整：通过`lineProps://proxyHost`让两者同时生效

```txt
# 示例1：只生效host配置
pattern 127.0.0.1:8080 socks://10.1.1.1:1080

# 示例2：只生效proxy配置
pattern 127.0.0.1:8080 socks://10.1.1.1:1080 ignore://host

# 示例3：host和proxy同时生效
pattern 127.0.0.1:8080 socks://10.1.1.1:1080 lineProps://proxyHost
```

---

## 四、页面调试工具 {#tools}

### 4.1 查看页面 DOM 结构 {#weinre}
```txt
pattern weinre://调试会话名称
```
> 详细用法参考：[weinre文档](./weinre)

### 4.2 查看页面日志及错误信息 {#log}
```txt
pattern log://日志会话名称
```
> 详细用法参考：[log文档](./log)

---

## 数据来源速查表

| 操作类型 | 直接内联 | 内嵌值 | Values | 本地文件 | 远程URL |
|---------|---------|--------|--------|----------|---------|
| 请求方法 | ✓ | ✓ | ✓ | ✗ | ✗ |
| URL参数 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 请求头 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 请求体 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 响应头 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 响应体 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Trailers | ✓ | ✓ | ✓ | ✓ | ✓ |

**语法示例：**
```txt
# 直接内联
protocol://({"key":"value"})

# 内嵌值
protocol://{embeddedKey}

# Values配置
protocol://{valuesKey}

# 本地文件
protocol:///path/to/file.json

# 远程URL
protocol://https://example.com/data.json
```

---

## 常用过滤条件

| 过滤器 | 说明 | 示例 |
|--------|------|------|
| `includeFilter://m:方法` | 按请求方法过滤 | `includeFilter://m:put` |
| `includeFilter://b:内容` | 按请求体内容过滤 | `includeFilter://b:cmdname=test` |
| 正则表达式 | 区分大小写匹配 | `/Test/` |

> **提示：** 更多协议和高级用法请参考[完整协议列表](./protocols)
