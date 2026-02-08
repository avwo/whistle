`pattern` 是 Whistle 规则中的第一部分，用于匹配请求 URL，支持域名、路径、通配符、正则表达式等多种匹配方式。

通过 `pattern`，你可以：
- 精确匹配特定域名或路径
- 使用通配符匹配一组相关请求
- 使用正则表达式实现复杂匹配逻辑
- 支持三种不同类型的 URL 匹配

## 请求 URL 类型

Whistle 支持三种请求 URL 类型：

| 类型 | 格式 | 示例 |
| :--- | :--- | :--- |
| **隧道代理** | `tunnel://domain[:port]` | `tunnel://www.test.com:443` |
| **WebSocket** | `ws[s]://domain[:port]/[path/to[?query]]` | `wss://www.test.com/path?a=1&b=2`<br>`ws://www.example.com:8080/path` |
| **普通 HTTP/HTTPS** | `http[s]://domain[:port]/[path/to][?query]` | `https://www.test.com/path`<br>`http://www.example.com/path?a=1&b=2` |

## 域名匹配

### 域名结构
```txt
[[schema]://]domain[:port]
```

**参数说明**：
- `domain`：域名或 IP 地址，支持通配符
- `port`：端口号（可选），支持通配符
- `schema`：协议类型（可选，如 `http`、`https`、`ws`、`wss`、`tunnel`），支持通配符
- `//`：表示使用当前请求的协议（自动适配 HTTP/HTTPS）

### 匹配格式

| 类型 | 格式 | 示例 |
| :--- | :--- | :--- |
| **正常域名**（支持通配符） | `domain`<br>`IP`<br>`//domain`<br>`//IP` | `www.example.com`<br>`1.2.3.4`<br>`*.example.com`<br>`//www.example.com`<br>`//1.2.3.4` |
| **带端口域名**（端口支持通配符） | `domain:port`<br>`//domain:port` | `www.example.com:8080`<br>`//www.ex*le.com:8*` |
| **带协议域名**（协议支持通配符） | `schema://domain[:port]` | `tunnel://www.*amp*.com`<br>`ws*://**.example.com:443`<br>`http*://www.example.com:8*8` |

### 域名的通配符说明

#### 域名通配符
- `*`：相当于正则 `/[^/?.]*/`（即域名里面的 0 或任意多个非 `.` 字符）
- `**`：相当于正则 `/[^/?]*/`（即域名里面的 0 或任意多个字符）
- `***`（及以上）：不推荐使用

**示例**：
- `www.example*.com`：可以匹配 `www.example.com`、`www.examplexxx.com:8080` 等，但不能匹配 `www.example.x.com`
- `*.example.com`：可以匹配 `www.example.com`、`www.example.com:8080`，但不能匹配 `x.www.example.com`
- `**.example.com`：可以匹配 `x.y.z.www.example.com`、`x.y.www.example.com:8080` 等，但不能匹配 `example.com`

#### 端口通配符
- `*`（及以上）：相当于正则 `/\d*/`（即 0 或任意多个数字）

**示例**：
- `http://www.example.com:8*8`：匹配 `http://www.example.com:88`、`http://www.example.com:8888` 等，但不能匹配 `http://www.example.com:8080`

#### 协议通配符
- `*`（及以上）：相当于正则 `/[a-z]*/`（即协议里面的 0 或任意多个字符）

**示例**：
- `http*://www.example.com`：匹配 `http://www.example.com` 和 `https://www.example.com:8080`


## 路径匹配

URL 路径结构：
```txt
[[schema:]//]domain[:port]/path?query
```

**示例**：`https://www.example.com/data/test/result?q=123`

### 匹配格式

#### 1. 无协议路径（可以匹配任何协议）
- `www.example.com[:port]/[path/to[?query]]`
- `//www.example.com[:port]/[path/to[?query]]`

#### 2. 带协议路径（匹配指定协议的请求）
- `ws[s]://www.example.com[:port]/[path/to[?query]]`
- `http[s]://www.example.com[:port]/[path/to[?query]]`

> **注意**：TUNNEL 请求没有路径。

#### 3. 带通配符
- `ws*://*.example.com/path/to`
- `http*[s]*://www.example*.com:8*/path/to`

### 匹配机制
路径匹配方式可以分为两个步骤：**先域名匹配** → **再路径匹配**

#### 域名匹配
规则同上。

#### 路径匹配
**1. 不带 `query` 参数的路径（匹配自身及其子路径）**
```txt
www.example*.com/path/to www.test.com/test
```
- 请求 `https://www.example123.com/path/to?query` 会被映射为 `https://www.test.com/test?query`
- 请求 `https://www.example123.com/path/to/xxx?query` 会被映射为 `https://www.test.com/test/xxx?query`
- 请求 `https://www.example123.com/path/to123` 不能匹配规则

**2. 带 `query` 参数的路径（匹配自身及以 `query` 开头的参数且区分大小写）**
```txt
www.demo*.com/path/to?name= www.test.com/test
```
- 请求 `https://www.demo.com/path/to?name=xxx&abc` 会被映射为 `https://www.test.com/test?xxx&abc`
- 请求 `https://www.demo.com/path/to/xxx?name=xxx&abcy` 不能匹配规则

## 路径通配符匹配

由于 `*` 是合法的 URL 路径字符，当需要将其作为通配符使用时，在表达式前面加 `^` 显式声明：

```txt
^[[schema:]//]domain[:port]/pa**th?qu*ery
```

**示例**：`^http*://**.example.com/data/*/result?q=*23`

Whistle 内部会将通配符路径转换成对应的正则表达式，其转换规则如下：

### 1. 协议、域名、端口部分通配符规则
同上面的域名匹配。

### 2. 路径部分通配符规则

| 通配符 | 正则等价 | 匹配范围 | 示例 |
| :--- | :--- | :--- | :--- |
| `*` | `/[^?/]*/` | 单级路径（不含 `/` 和 `?`） | `^.../*/*.js` → `.../a/b.js` |
| `**` | `/[^?]*/` | 多级路径（不含 `?`） | `^.../**file` → `.../a/b/c/test-file` |
| `***` | `/.*/` | 任意字符（含 `/` 和 `?`） | `^.../data/***file` → `.../a/b/c?test=file` |

### 3. 查询参数通配符规则

| 通配符 | 正则等价 | 匹配范围 | 示例 |
| :--- | :--- | :--- | :--- |
| `*` | `/[^&]*/` | 单参数值（不含 `&`） | `^...?q=*123` → `...?q=abc123` |
| `**` | `/.*/` | 任意字符（含 `&`） | `^...?q=**123` → `...?q=abc&test=123` |

> **记忆要点**：主要记住 `*`、`**`、`***` 三种通配符的匹配范围。


## 正则匹配

除简单匹配规则外，Whistle 提供完整的正则表达式支持，语法与 JavaScript 正则完全兼容：

```txt
/pattern/[flags]
```

**参数说明**：
- `pattern`：正则表达式主体
- `flags`：匹配模式修饰符（可选），支持：
  - `i`：忽略大小写，如 `/abc/i` 匹配 "AbC"
  - `u`：启用 Unicode 支持，如 `/\p{Emoji}/u` 匹配 "😀"

**示例**：
```txt
/\.test\./          # 匹配 ".test."
/key=value/i        # 忽略大小写匹配 "key=value"
/\/statics\//ui     # Unicode 模式匹配 "/statics/"
```

## 子匹配传值

在 Whistle 的规则配置中，可以通过 `$0`、`$1` 至 `$9` 引用通配符或正则表达式匹配的子匹配内容，并将其传递到操作值中：

```txt
pattern protocol://$0_$1_$2_..._$1
```

**参数说明**：
- **$0**：完整匹配结果
- **$1 - $9**：对应捕获组的内容

### 通配符匹配传值
```txt
^http://*.example.com/v0/users/** file:///User/xxx/$1/$2
```

**匹配示例**：
- 请求 URL：`http://www.example.com/v2/users/alice/test.html?q=1`
- 传值结果：
  - `$1` = `www`
  - `$2` = `users/alice`
- 最终替换：本地文件 `/User/xxx/www/alice/test.html` 的内容

### 正则匹配传值
```txt
/regexp\/(user|admin)\/(\d+)/ reqHeaders://X-Type=$1&X-ID=$2
```

**匹配示例**：
- 请求 URL：`.../regexp/admin/123`
- 传值结果：
  - `$1` = `admin`
  - `$2` = `123`
- 最终效果：添加请求头 `X-Type: admin` 和 `X-ID: 123`

## 特殊说明

域名匹配和路径匹配在映射本地文件/目录路径或远程新 URL 时会自动拼接路径，即：

```txt
https://*.example.com/path/to https://www.test.com/test

www.example.com file:///Usr/test
```

**示例**：
- 访问 `https://abc.example.com/path/to/x/y/z?query` 会自动替换成新 URL：`https://www.test.com/test/x/y/z?query`
- 访问 `https://wwww.example.com/path/to/index.html?query` 会自动替换成本地文件：`https://www.test.com/path/to/index.html`（自动去掉 `query`）

## 配置示例

### 基础匹配
```txt
# 精确域名匹配
api.example.com proxy://127.0.0.1:3000

# 端口特定匹配
www.example.com:8080 file:///local/dev

# 路径匹配
www.example.com/api/users file://{user-data}
```

### 通配符匹配
```txt
# 匹配所有子域名
**.example.com proxy://127.0.0.1:8080

# 匹配特定前缀的子域名
dev-**.example.com file:///(dev-mock)

# 匹配所有 HTTP/HTTPS 请求
http*://www.example.com  cache://3600
```

### 正则匹配
```txt
# 匹配数字 ID 的用户页面
/^https?://www\.example\.com/user/(\d+)/ file://(user-$1)

# 忽略大小写匹配特定路径
/\/api\/v1\/data/i resBody://({"version":"v1"})

# 匹配静态资源文件
/\.(jpg|png|gif|css|js)$/i cache://86400
```

### 复杂匹配
```txt
# 组合通配符和路径
^https://**.example.com/api/*/v*/users reqHeaders://x-api-version=$3

# 多条件匹配
www.example.com/api file://({"status":"ok"}) includeFilter://m:GET
www.example.com/api file://({"status":"created"}) includeFilter://m:POST
```

## 故障排除

### Q: 规则没有匹配到请求
**A:** 检查：
1. URL 格式是否正确
2. 是否包含正确的协议和端口
3. 通配符或正则表达式是否正确
4. 是否有更高优先级的规则覆盖

### Q: 正则表达式不生效
**A:** 检查：
1. 正则表达式语法是否正确
2. 是否需要对特殊字符进行转义
3. 匹配模式标志是否正确设置

### Q: 子匹配传值错误
**A:** 检查：
1. 捕获组编号是否正确
2. 通配符匹配是否正确捕获了预期内容
3. 正则表达式捕获组是否按预期工作


## 扩展阅读

- [规则语法文档](./rule)：了解完整的规则语法结构
- [操作指令文档](./operation)：学习如何配置操作指令
- [过滤器文档](./filters)：了解如何精确控制规则生效条件
