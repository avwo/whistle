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



| 语法                | 用途                  | 示例                          |
| ------------------- | --------------------- | ----------------------------- |
| `b:pattern`         | 匹配请求体内容        | `includeFilter://b:keyword` `excludeFilter://b:/regexp/[i]` |
| `m:pattern`         | 匹配 HTTP 方法        | `includeFilter://m:keyword` `excludeFilter://m:/regexp/[i]` |
| `i:pattern`        | 匹配客户端或服务端 IP | `includeFilter://i:keyword` `excludeFilter://i:/regexp/[i]` |
| `clientIp:pattern`  | 仅匹配客户端 IP       | `includeFilter://clientIp:/regexp/[i]`  `excludeFilter://clientIp:keyword` |
| `serverIp:pattern`  | 仅匹配服务端 IP       | `includeFilter://serverIp:/regexp/[i]`  `excludeFilter://serverIp:keyword` |
| `s:pattern`         | 匹配响应状态码        | `includeFilter://s:/^20/`  `excludeFilter://s:30` |
| `h:name=pattern`    | 匹配请求/响应头       | `includeFilter://h:content-type=json`  `excludeFilter://h:content-type=/regexp/i` |
| `reqH:name=pattern` | 仅匹配请求头          | `includeFilter://reqH:content-type=json`  `excludeFilter://reqH:content-type=/regexp/i` |
| `resH:name=pattern` | 仅匹配响应头          | `includeFilter://resH:content-type=json`  `excludeFilter://resH:content-type=/regexp/i` |
|  其它 `xxxxxx`     | 匹配请求 URL（同 [pattern](./pattern)） | `includeFilter://*/cgi-*` `excludeFilter://www.test.com` `includeFilter://https://www.test.com/path` |



