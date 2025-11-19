# 规则语法

Whistle 通过简单的规则配置修改请求/响应，基本语法结构如下：

``` txt
pattern operation [includeFilter://pattern1 ... excludeFilter://patternN ...]
```

## 规则组成

每条规则由三个核心部分组成：

1. **匹配模式** (`pattern`)，匹配请求 URL 的表达式，支持多种格式：
   - 域名匹配：`www.test.com`（匹配该域名所有请求，含端口）
   - 路径匹配：`www.test.com/path`
   - 正则表达式：`/^https?://test\.com//i`
   - 通配符：`*.test.com`、`**.test.com/path`
    > Whistle 有三种 URL 类型：
    > 1. **隧道代理：**`tunnel://domain[:port]`
    > 2. **WebSocket：**`ws[s]://domain[:port]/path/to`
    > 3. **普通 HTTP/HTTPS：**`http[s]://domain[:port]/path/to`
    >
2. **操作指令** (`operation`)，格式：`protocol://value`
   - `protocol`：操作类型，如：
     - `reqHeaders`：修改请求头
     - `resHeaders`：修改响应头
   - `value`：操作内容，支持多种数据源：
     - 内联值：`reqHeaders://x-proxy-by=whistle`（直接添加请求头）
     - 本地文件：`file://path/to/file`
     - 远程资源：`https://example.com/data.json`
     - 预设变量：`{key}`（从 Rules 里面的内嵌值 或 Values 读取）
    > **operation** 里面的 `protocol://` 在以下两种场景时可以省略：
    > - `ip` 或 `ip:port`：等价于 `host://ip` 或 `host://ip:port`
    > - `D:\path\to`、`/path/to` 或 `{key}`：等价于 `file://D:\path\to`、`file:///path/to` 或 `file://{key}`
    >
3. **过滤条件（可选）** (`includeFilter/excludeFilter`)
   - 逻辑关系：多条件间为「或」匹配，只要匹配其中一个过滤条件就成立
   - 匹配范围：
     - 请求：URL、方法（GET/POST等）、头部字段、内容、客户端 IP
     - 响应：状态码、头部字段、内容、服务端 IP

## 详细内容
1. 匹配模式（匹配请求 URL 的表达式）详解：[Pattern](./pattern)
2. 操作指令详解：[Operation](./operation)
3. 过滤器详解：[Filters](./filters)
