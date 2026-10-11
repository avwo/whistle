# 过滤器

当需要基于请求属性或响应属性（而不仅仅是URL）进行匹配时，可以使用过滤器来实现更精细化的规则控制，语法结构：

``` txt
pattern opertaion includeFilter://pattern1 ... excludeFilter://patternx ...
```
> 多个过滤器间为「或」匹配，只要匹配其中一个过滤条件就成立

## 过滤器类型

| 过滤器类型     | 语法格式                  | 用途                     |
| -------------- | ------------------------- | ------------------------ |
| **包含过滤器** | `includeFilter://pattern` | 只匹配符合指定条件的请求 |
| **排除过滤器** | `excludeFilter://pattern` | 排除符合指定条件的请求   |

## pattern 类型

用于 `includeFilter://<pattern>` 和 `excludeFilter://<pattern>` 的匹配表达式。

> **通用规则**
> - 未指定前缀时，默认匹配请求 URL。
> - 关键字匹配默认不区分大小写。
> - 正则格式为 `/regexp/`，末尾可加 `i` 表示忽略大小写，例如 `/regexp/i`。
> - `chance` 的 `probability` 取值范围为 `0 ~ 1`。

| 语法 | 匹配目标 | 示例 |
| --- | --- | --- |
| `b:pattern` | 请求体内容：关键字（不区分大小写）或正则 | `includeFilter://b:keyword`<br>`excludeFilter://b:/regexp/i` |
| `m:pattern` | HTTP 方法：方法名（不区分大小写）或正则 | `includeFilter://m:get`<br>`excludeFilter://m:/regexp/i` |
| `i:pattern` | 客户端或服务端 IP：IP 或正则 | `includeFilter://i:192.168.1.10`<br>`excludeFilter://i:/regexp/i` |
| `chance:probability` | 按概率随机命中：`Math.random() < probability` | `includeFilter://chance:0.5`<br>`excludeFilter://chance:0.3` |
| `clientIp:pattern` | 客户端 IP：IP 或正则 | `includeFilter://clientIp:192.168.1.10`<br>`excludeFilter://clientIp:/regexp/i` |
| `serverIp:pattern` | 服务端 IP：IP 或正则 | `includeFilter://serverIp:192.168.1.10`<br>`excludeFilter://serverIp:/regexp/i` |
| `s:pattern` | 响应状态码：状态码或正则 | `includeFilter://s:/^20/`<br>`excludeFilter://s:200` |
| `reqH.header-key:pattern` | 请求头：关键字（不区分大小写）或正则 | `includeFilter://reqH.content-type:json`<br>`excludeFilter://reqH.content-type:/regexp/i` |
| `resH.header-key:pattern` | 响应头：关键字（不区分大小写）或正则 | `includeFilter://resH.content-type:json`<br>`excludeFilter://resH.content-type:/regexp/i` |
| 无前缀 `pattern`（其它 `xxxxxx`） | 请求 URL，同 [pattern](./pattern) | `includeFilter://*/cgi-*`<br>`excludeFilter://www.test.com`<br>`includeFilter://https://www.test.com/path` |
