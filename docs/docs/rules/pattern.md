# pattern

`pattern` 是 Whistle 规则中匹配请求 URL 的表达式，支持 URL 片段/域名、通配符、正则表达式等多种匹配方式。

## 请求 URL 类型

Whistle 支持三种请求 URL 类型：

| 类型 | 格式 | 示例 |
| :--- | :--- | :--- |
| **隧道代理** | `tunnel://domain:port` | `tunnel://www.test.com:443` |
| **WebSocket** | `ws[s]://domain[:port]/[path/to[?query]]` | `wss://www.test.com/path?a=1&b=2`<br>`ws://www.example.com:8080/path` |
| **普通 HTTP/HTTPS** | `http[s]://domain[:port]/[path/to][?query]` | `https://www.test.com/path`<br>`http://www.example.com/path?a=1&b=2` |

> URL 中的 hash（即 `#` 及之后的内容）不会被发送到后台。Hash 仅在客户端（如浏览器）中生效，后台无法直接获取

## URL 片段 {#url}

URL 片段用于匹配请求的 URL，支持多种灵活的模式。以下按匹配规则分类说明。

### 1. 域名匹配

- **普通域名**：`example.com`  
  匹配该域名下所有端口及协议（http/https）的请求。  
  ✅ `https://example.com/path/to?query`  
  ✅ `https://example.com:9090/path/to?query`

- **带端口的域名**：`example.com:8080`  
  仅匹配指定端口（8080）的请求。  
  ✅ `https://example.com:8080/path/to?query`  
  ❌ `https://example.com:9090/path/to?query`
  ❌ `https://example.com/path/to?query`

### 2. 协议匹配

- **带协议的 URL**：`https://example.com/path/to`  
  仅匹配相同协议的请求。

- **不带协议的 URL**：`example.com/path/to` 或 `//example.com/path/to`  
  匹配任意协议（http、https 等），路径匹配规则与带协议时相同（见下文）。

### 3. 路径与查询参数匹配

#### 3.1 不带查询参数的 URL

模式：`https://example.com/path/to`  
匹配规则：**路径前缀匹配**（以 `/` 为边界）。  
- ✅ `https://example.com/path/to`  
- ✅ `https://example.com/path/to/xxx?query`  
- ❌ `https://example.com/path/toxxx`（`to` 后缺少 `/` 边界）

#### 3.2 带查询参数的 URL

模式：`https://example.com/path/to?xxx`  
匹配规则：**路径必须完全相同**，且查询字符串以 `xxx` 为前缀。  
- ✅ `https://example.com/path/to?xxx`  
- ✅ `https://example.com/path/to?xxxyyy&zzzzz`  
- ❌ `https://example.com/path/to/yyy?xxx`（路径不同）

### 4. 精确匹配

使用 `$` 前缀，提供更严格的匹配。

- `$https://example.com/path/to`  
  匹配**路径精确**（以 `/` 为边界），查询参数可任意。  
  ✅ `https://example.com/path/to`  
  ✅ `https://example.com/path/to?query`  
  ❌ `https://example.com/path/to/xxx`

- `$https://example.com/path/to?query`  
  匹配**路径与查询参数均完全一致**。  
  ✅ `https://example.com/path/to?query`  
  ❌ `https://example.com/path/to?query=1`  
  ❌ `https://example.com/path/to`

- 不带协议的精确匹配：`$example.com/path/to`（效果同上，协议任意）

### 5. 域名通配符{#domain-wildcard}

在`域名:端口`部分使用 `*` 或 `**` 进行模糊匹配。

- `*`：匹配 0 个或多个非 `.` 字符（相当于正则 `/[^/?.]*/`）。  
  示例：`https://*.example.com/path/to`  
  ✅ `https://www.example.com/path/to`  
  ✅ `https://abc.example.com/path/to/xxx?query`
  ❌ `https://a.b.example.com/path/to`

- `**`：匹配 0 个或多个任意字符（除 `/` 和 `?` 外，相当于正则 `/[^/?]*/`）。  
  示例：`https://**.example.com:8*/path/to`  
  ✅ `https://foo-bar.example.com:8080/path/to`
  ✅ `https://a.b.example.com:8888/path/to`

- `***` 及以上：不推荐使用。

> 注意：`*` 也是 URL 路径中的合法字符。若需在路径部分使用通配符，请参阅 [通配符匹配](#wildcard)。

### 要点总结

| 模式示例 | 匹配协议 | 匹配端口 | 路径匹配规则 | 查询参数匹配规则 |
|---------|---------|---------|-------------|----------------|
| `example.com` | 任意 | 任意 | - | - |
| `example.com:8080` | 任意 | 8080 | - | - |
| `https://example.com/path/to` | https | 任意 | 前缀（`/`边界） | 任意 |
| `https://example.com/path/to?xxx` | https | 任意 | 精确 | 前缀 |
| `$https://example.com/path/to` | https | 任意 | 精确 | 任意 |
| `$https://example.com/path/to?xxx` | https | 任意 | 精确 | 精确 |
| `example.com/path/to` <br/> 或 `//example.com/path/to` | 任意 | 任意 | 前缀（`/`边界） | 任意 |

## 通配符匹配 {#wildcard}

在 [URL 片段匹配](#url) 中，由于 `*` 本身是 URL 路径中的合法字符，因此无法直接在路径或查询参数中使用通配符。  
若需在 **路径** 或 **查询参数** 中使用通配符，请在 URL 前加上 `^` 符号。此时 `*`、`**`、`***` 将作为通配符解析。

### 1. 域名通配符

语法与 [URL 片段中的域名通配符](#domain-wildcard) 完全一致：

- `*`：匹配 0 个或多个非 `.` 字符（正则 `/[^/?.]*/`）
- `**`：匹配 0 个或多个任意字符（除 `/` 和 `?` 外，正则 `/[^/?]*/`）

**示例**：`^wss://*.example.com/path/to`

✅ 匹配：
- `wss://a.example.com/path/to`
- `wss://b.example.com/path/to/xxx?query`

❌ 不匹配：
- `wss://a.example.com/path/toxxx`（路径缺少 `/` 边界）
- `wss://a.b.example.com/path/to`（`*` 不匹配点号）

### 2. 路径通配符

作用于 URL 的 **路径部分**（域名后、`?` 之前）。支持三种级别：

| 通配符 | 匹配规则（正则） | 说明 |
|--------|----------------|------|
| `*`    | `/[^?/]*/`      | 匹配当前路径段内的任意字符（不含 `/` 和 `?`） |
| `**`   | `/[^?]*/`       | 匹配任意字符（不含 `?`），可跨路径段 |
| `***`  | `/.*/`          | 匹配剩余所有字符（含 `/` 和 `?`），通常用于路径末尾 |

**示例 1：`*`**  
模式：`^https://example.com/path/to/a*b`  
✅ 匹配：`https://example.com/path/to/axxxb/...?query`  
❌ 不匹配：`https://example.com/path/to/a/b`（`*` 不能匹配 `/`）

**示例 2：`**`**  
模式：`^https://example.com/path/to/a**b`  
✅ 匹配：
- `https://example.com/path/to/axxxb/...?query`
- `https://example.com/path/to/a/b`  
❌ 不匹配：`https://example.com/path/to/a/xxxx?query=b`（`?` 后不属于路径）

**示例 3：`***`**  
模式：`^https://www.example*.com:8*/path/to/a***b`  
✅ 匹配：
- `https://example.com/path/to/axxxb/...?query`
- `https://example.com/path/to/a/b`
- `https://example.com/path/to/a/xxxx?query=b`（`***` 会匹配到 `?` 及之后）

> `***` 会“吞掉”包括 `?` 在内的剩余字符，一般仅建议在路径末尾使用。


### 3. 查询参数通配符

作用于 URL 的 **查询字符串**（`?` 之后）。支持两种：

| 通配符 | 匹配规则（正则） | 说明 |
|--------|----------------|------|
| `*`    | `/[^&]*/`       | 匹配单个参数值内的任意字符（不含 `&`） |
| `**`   | `/.*/`          | 匹配剩余所有字符（含 `&`），即从当前位置到末尾 |

**示例 1：`*`**  
模式：`^https://example.com/path/to?query=a*b`  
✅ 匹配：`https://example.com/path/to?query=ab&q2=xxx`  
❌ 不匹配：`https://example.com/path/to?query=a&q2=b`（`b` 前无额外字符）

**示例 2：`**`**  
模式：`^https://example.com/path/to?query=a**b`  
✅ 匹配：
- `https://example.com/path/to?query=axxxb&q2=xxx`
- `https://example.com/path/to?query=a&q2=b`（`**` 匹配了 `&q2=`）

### 4. 不带协议的精确匹配

在 `^` 后直接写域名和路径，协议任意。

**示例**：`^example*.com/path*/to`  
效果与带协议相同，但可匹配 `http://`、`https://`、`wss://` 等任意协议。

### 5. 精确匹配（边界控制）

在模式末尾使用 `$`，表示匹配必须到此结束（之后不能再有额外字符）。

**示例**：`^https://*.example.com/path/*/to$`  
✅ 匹配：`https://a.example.com/path/xxx/to`  
❌ 不匹配：`https://b.example.com/path/xxx/to?query`（`$` 禁止 `?query`）

> 若不加 `$`，模式默认允许路径之后继续存在 `/`、`?` 等字符。

### 使用总结

| 使用场景 | 前缀 | 通配符类型 | 支持的通配符 | 示例 |
|---------|------|-----------|-------------|------|
| 普通 URL 匹配（无通配符） | 无 | — | — | `https://example.com/path` |
| 含通配符的路径/参数 | `^` | 域名、路径、查询 | `*` `**` `***` | `^https://*.example.com/path/*?a**b` |
| 精确匹配（尾部边界） | `^` + `$` | 同上 | 同上 | `^https://example.com/path/*/to$` |

> **注意**：一旦使用 `^`，URL 中的 `*` 不再作为普通字符，而是通配符。如需匹配字面意义上的 `*`，请勿使用 `^`。

## 正则匹配 {#regexp}

除了前面介绍的 URL 片段匹配和通配符匹配外，Whistle 还提供了完整的正则表达式支持。  
正则匹配的语法与 JavaScript 正则表达式完全兼容：

```txt
/pattern/[i]
```

### 参数说明

- **`pattern`**：正则表达式主体
- **`i`**（可选）：忽略大小写 

### 使用示例

```txt
/\.test\./              # 匹配字符串中的 ".test."
/key=value/i            # 忽略大小写匹配 "key=value" 或 "KEY=VALUE"
```


## 子匹配传值

在 Whistle 规则中，可以通过 `$0`、`$1` … `$9` 引用通配符或正则表达式捕获的子匹配内容，并将其传递到目标操作值中。

```txt
pattern protocol://$0_$1_$2_..._$9
```

**捕获变量说明**：

| 变量 | 含义 |
|------|------|
| `$0` | 完整匹配的内容 |
| `$1` ~ `$9` | 第 1 至第 9 个捕获组匹配的内容 |

### 通配符匹配传值

使用 `^` 前缀的通配符模式（`*`、`**` 等）会自动按顺序捕获匹配段，分别赋给 `$1`、`$2`……。

**示例**：
```txt
^http://*.example.com/v0/users/** file:///User/xxx/$1/$2
```

- 请求 URL：`http://www.example.com/v2/users/alice/test.html?q=1`
- 匹配过程：
  - `$1` = `www`（匹配第一个 `*`）
  - `$2` = `users/alice`（匹配 `**` 捕获的路径段）
- 最终效果：返回本地文件 `/User/xxx/www/alice/test.html` 的内容

> 通配符捕获规则：
> - `*` 捕获单个路径段（不含 `/`）
> - `**` 捕获剩余路径（可含 `/`）
> - 按从左到右顺序依次对应 `$1`、`$2`……

### 正则匹配传值

使用 `/pattern/flags` 正则表达式时，捕获组 `( )` 中的内容会按顺序赋给 `$1`、`$2`……

**示例**：
```txt
/regexp\/(user|admin)\/(\d+)/ reqHeaders://X-Type=$1&X-ID=$2
```

- 请求 URL：`.../regexp/admin/123`
- 捕获结果：
  - `$1` = `admin`
  - `$2` = `123`
- 最终效果：为请求添加请求头 `X-Type: admin` 和 `X-ID: 123`

---

## 路径自动拼接规则

当使用 **域名匹配** 或 **路径匹配** 映射到本地文件/目录或远程 URL 时，Whistle 会自动拼接原请求的剩余路径。

**规则**：
```txt
https://*.example.com/path/to https://www.test.com/test
www.example.com file:///Usr/test
```

**效果说明**：

| 请求 URL | 映射后目标 |
|----------|------------|
| `https://abc.example.com/path/to/x/y/z?query` | `https://www.test.com/test/x/y/z?query` |
| `https://www.example.com/path/to/index.html?query` | 本地文件 `/Usr/test/path/to/index.html`（自动去除 query） |

> 注意：查询参数 `?query` 在映射到本地文件时会被自动忽略（文件系统路径不支持），但映射到远程 URL 时会保留。

---

## 配置示例

### 基础匹配

```txt
# 精确域名匹配
api.example.com proxy://127.0.0.1:3000

# 指定端口的域名匹配
www.example.com:8080 file:///local/dev

# 路径匹配（映射到本地 JSON 数据）
www.example.com/api/users file://{user-data}
```

### 通配符匹配

```txt
# 匹配所有子域名
**.example.com proxy://127.0.0.1:8080

# 匹配特定前缀的子域名
dev-**.example.com file:///(dev-mock)
```

### 正则匹配

```txt
# 匹配数字 ID 的用户页面
/^https?://www\.example\.com/user/(\d+)/ file://(user-$1)

# 忽略大小写匹配特定路径
/\/api\/v1\/data/i resBody://({"version":"v1"})

# 匹配静态资源文件并设置缓存
/\.(jpg|png|gif|css|js)$/i cache://86400
```

### 复杂匹配

```txt
# 通配符 + 路径捕获传值
^https://**.example.com/api/*/v*/users reqHeaders://x-api-version=$3

# 按请求方法区分处理
www.example.com/api file://({"status":"ok"}) includeFilter://m:GET
www.example.com/api file://({"status":"created"}) includeFilter://m:POST
```

---

## 故障排除

### Q：规则没有匹配到请求

**可能原因及解决方案**：

1. **URL 格式不正确**  
   → 确保规则中的协议（http/https/ws/wss）与请求一致，或使用不带协议的写法（`example.com/path`）。

2. **端口号不匹配**  
   → 如果请求使用非标准端口，需要在规则中明确指定端口（如 `example.com:8080`）。

3. **通配符或正则表达式有误**  
   → 使用 [Whistle 在线调试工具](https://github.com/avwo/whistle) 或本地日志验证匹配情况。

4. **规则优先级问题**  
   → 更具体的规则应写在前面，或使用 `$` 精确匹配提高优先级。

### Q：正则表达式不生效

**检查清单**：

- [ ] 正则表达式是否以 `/` 开头和结尾，如 `/pattern/`？
- [ ] 特殊字符是否已转义（如 `.` 需写成 `\.`，`/` 需写成 `\/`）？
- [ ] 标志（`i` 等）是否正确添加？
- [ ] 正则是否匹配完整的 URL？可以在控制台用 `new RegExp('pattern', 'flags').test(url)` 验证。

### Q：子匹配传值不正确

**常见问题**：

1. **捕获组编号错误**  
   → `$1` 对应第一个 `( )`，`$2` 对应第二个，依次类推。注意嵌套捕获组的顺序。

2. **通配符捕获不符合预期**  
   → `*` 不匹配点号（`.`）和斜杠（`/`），`**` 匹配任意字符（除 `?` 外）。  
   → 示例：`*.example.com` 无法匹配 `a.b.example.com`，需改用 `**.example.com`。

3. **正则捕获组未按预期工作**  
   → 使用 `(?:)` 表示非捕获组，避免干扰编号。  
   → 使用在线正则测试工具（如 regex101.com）验证捕获内容。

### Q：映射到本地文件时路径错误

- 使用 `file://` 协议时，确保路径是绝对路径（如 `file:///User/xxx`）。
- 路径拼接遵循自动拼接规则，请求的剩余路径会追加到目标路径后。
- 查询参数会被自动忽略，不影响文件读取。

---

## 扩展阅读

- [规则语法文档](./rule)：了解完整的规则语法结构
- [操作指令文档](./operation)：学习如何配置操作指令
- [过滤器文档](./filters)：了解如何精确控制规则生效条件
