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
| value   | `pathname`：删除请求路径（不包含请求参数）<br/>`pathname.index`：`index` 为路径分段序号 `...、-1、0、1、...` 或关键字 `last` 详见下面说明<br/>`urlParams`：删除所有请求参数<br/>`urlParams.xxx`：删除 URL 的 `xxx 参数`<br/>`reqHeaders.xxx`: 删除请求头的 `xxx` 字段<br/>`resHeaders.xxx`: 删除响应头的 `xxx` 字段<br/>`reqBody`: 删除所有请求内容<br/>`resBody`: 删除所有响应内容<br/>`reqBody.xxx.yyy`: 删除请求内容中类型为表单(form)或JSON的 `xxx.yyy` 字段<br/>`resBody.xxx.yyy`:  删除响应类型为 JSONP 或 JSON 的响应内容里的 `xxx.yyy` 字段<br/>`reqType`: 删除请求头 `content-type` 里的类型，不包含可能存在的 charset<br/>`resType`: 删除响应头 `content-type` 里的类型，不包含可能存在的 charset<br/>`reqCharset`: 删除请求头 `content-type` 里可能存在的 charset<br/>`resCharset`: 删除响应头 `content-type` 里可能存在的 charset<br/>`reqCookies.xxx`: 删除请求头的里面名为 `xxx` 的 cookie<br/>`resCookies.xxx`: 删除响应头的里面名为 `xxx` 的 cookie|    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
https://www.example.com/path delete://reqCookies.token|resCookies.token

https://raw.githubusercontent.com/avwo/whistle/refs/heads/master/package.json delete://resBody.name resType://json
```
上述 cookie 删除操作仅作用于请求/响应过程中的 cookie，不会修改浏览器本地存储的 cookie。如需修改浏览器持久化 cookie，可通过以下方式实现：
- 通过 [jsPrepend](./jsPrepend) 等注入 JS 删除
- 通过 [resCookies](./resCookies) 设置 cookie 过期

## 删除路径
> 支持版本：v2.9.102 及以上

### 规则语法
```
# 基本格式
目标域名 delete://pathname.索引号

# 示例
www.example.com/api/path/to delete://pathname.0 delete://pathname.1 delete://pathname.-1
```

### 规则说明
该规则用于删除请求 URL 中路径的特定分段。Whistle 会提取不包含查询参数的请求路径，并通过 `/` 分割成数组后进行删除操作。

**示例解析：**
- 请求URL：`https://www.example.com/api/path/to/xxx?query`
- 提取路径：`api/path/to/xxx`
- 分割数组：`['api', 'path', 'to', 'xxx']`
- 应用规则：
  - `delete://pathname.0` → 删除 'api'
  - `delete://pathname.1` → 删除 'path' 
  - `delete://pathname.-1` → 删除 'xxx'
- 最终路径：`/to`
- 完整结果：`https://www.example.com/to?query`

### 索引规则
- **正数索引**：从 0 开始，表示从前往后的顺序
- **负数索引**：从 -1 开始，表示从后往前的位置（-1 = 最后一段，-2 = 倒数第二段，以此类推）
- **特殊值**：使用 `last` 可删除最后一段路径但保留末尾斜杠
- **边界情况**：超出数组范围的索引将被忽略

### 重要说明
当路径以 `/` 结尾时，分割后的数组最后会包含一个空字符串项：
- 路径：`/api/path/to/xxx/`
- 分割结果：`['api', 'path', 'to', 'xxx', '']`

### 使用建议
- 使用 `pathname.-1` 删除最后一段且不保留末尾斜杠
- 使用 `pathname.last` 删除最后一段但保留末尾斜杠

**对比示例：**
```
www.example.com/api/path/to delete://pathname.0 delete://pathname.1 delete://pathname.last
```
- 请求：`https://www.example.com/api/path/to/xxx?query`
- 结果：`https://www.example.com/to/?query` (保留末尾斜杠)
