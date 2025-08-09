# delete
用于删除请求 URL、请求/响应头、请求/响应内容。

## 规则语法
``` txt
pattern delete://prop1|prop2|... [filters...]

# 等效于：
pattern delete://prop1 delete://prop2 ... [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | `urlParams`：删除所有请求参数<br/>`urlParams.xxx`：删除 URL 的 `xxx 参数`<br/>`reqHeaders.xxx`: 删除请求头的 `xxx` 字段<br/>`resHeaders.xxx`: 删除响应头的 `xxx` 字段<br/>`reqBody`: 删除所有请求内容<br/>`resBody`: 删除所有响应内容<br/>`reqBody.xxx.yyy`: 删除请求内容中类型为表单(form)或JSON的 `xxx.yyy` 字段<br/>`resBody.xxx.yyy`:  删除响应类型为 JSONP 或 JSON 的响应内容里的 `xxx.yyy` 字段<br/>`reqType`: 删除请求头 `content-type` 里的类型，不包含可能存在的 charset<br/>`resType`: 删除响应头 `content-type` 里的类型，不包含可能存在的 charset<br/>`reqCharset`: 删除请求头 `content-type` 里可能存在的 charset<br/>`resCharset`: 删除响应头 `content-type` 里可能存在的 charset<br/>`reqCookies.xxx`: 删除请求头的里面名为 `xxx` 的 cookie<br/>`resCookies.xxx`: 删除响应头的里面名为 `xxx` 的 cookie|    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
https://www.example.com/path delete://reqCookies.token|resCookies.token

https://raw.githubusercontent.com/avwo/whistle/refs/heads/master/package.json delete://resBody.name resType://json
```
上述 cookie 删除操作仅作用于请求/响应过程中的 cookie，不会修改浏览器本地存储的 cookie。如需修改浏览器持久化 cookie，可通过以下方式实现：
- 通过 [jsPrepend](./jsPrepend) 等注入 JS 删除
- 通过 [resCookies](./resCookies) 设置 cookie 过期
