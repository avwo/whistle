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

## 操作协议
每个协议（`protocol`）对应一种特定的操作类型，用于对匹配的请求进行相应处理，协议决定了操作的类型以及操作内容的格式要求，具体用法参考：[协议列表](./protocols)
