# resBody

`resBody` 协议用于替换指定请求的响应内容体，仅对包含响应内容体的状态码（如 `200`、`500` 等）有效。

> **生效条件**：仅对有响应内容体的状态码生效
> ⚠️ 注意：`204`、`304` 等无响应内容体的请求不受影响

## 规则语法

`resBody` 支持多种方式指定要替换的响应内容：

### 1. 内联值（直接指定）
直接在规则中写明要替换的内容，适用于简短的文本内容。

```txt
pattern resBody://(value) [lineProps...] [filters...]
```
**示例：**
```txt
www.example.com/api/data resBody://({"status":"modified"})
```

### 2. 内嵌值（使用代码块）
当需要处理包含空格、换行符的复杂内容，或希望复用某段配置时，推荐使用此方式。

````txt
pattern resBody://{custom-key.json} [lineProps...] [filters...]

``` custom-key.json
{
  "status": "success",
  "data": {
    "message": "This response was modified by resBody"
  }
}
```
````

### 3. 引用 Values 中的值
当内容较大时，可以将其存储在 `Values` 配置区中。

```txt
pattern resBody://{key-of-values.html} [lineProps...] [filters...]
```
**前提**：在 `Values` 中存在名为 `key-of-values.html` 的键，其值为要替换的内容。

### 4. 从文件路径或远程 URL 加载
从本地文件或远程 URL 加载要替换的响应内容。

```txt
# 从本地文件加载
pattern resBody:///User/xxx/test.txt

# 从远程 URL 加载
pattern resBody://https://www.example.com/override-content.txt
```

### 5. 从临时文件中加载
当需要频繁编辑内容时，可以使用 Whistle 提供的临时文件功能。

```txt
pattern resBody://temp/blank.txt
```
**操作步骤**：
1. 在 Rules 编辑器中，按住 `Command`（Mac）/ `Ctrl`（Windows）
2. 鼠标点击 `resBody://temp/blank.txt`
3. 在弹出的编辑对话框中输入替换内容
4. 点击 `Save` 保存

## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **value** | 是 | 要替换的响应内容，支持多种格式：<br>• 本地文件路径<br>• 远程 URL<br>• 内联、内嵌、Values 引用内容 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |

## 配置示例

### 基础示例
```txt
# 替换 API 响应内容
www.example.com/api/data resBody://({"status":"custom","data":"modifiedContent"})
```

### 使用内嵌值
````txt
``` error-response
{
  "error": {
    "code": 1001,
    "message": "Custom error message for testing"
  }
}
```

www.example.com/api resBody://{error-response} includeFilter://s:500
````

### 从文件加载
```txt
# 从本地文件加载替换内容
www.example.com/api/config resBody:///Users/username/mock/config.json

# 从远程 URL 加载替换内容
www.example.com/api/data resBody://https://raw.githubusercontent.com/user/repo/main/mock-data.json
```

### 使用临时文件
```txt
www.example.com/api/user resBody://temp/blank.json
```
> 在 Rules 编辑器中，按住 `Command`（Mac）/ `Ctrl`（Windows）并用鼠标点击 `resBody://temp/blank.json` 进行编辑

### 配合过滤器使用
```txt
# 仅替换特定状态码的响应
www.example.com/api resBody://({"error":"ServiceUnavailable"}) includeFilter://s:503

# 根据请求方法决定替换内容
www.example.com/api/users resBody://({"method":"GEToverride"}) includeFilter://m:GET
www.example.com/api/users resBody://({"method":"POSToverride"}) includeFilter://m:POST
```

## 高级用法

### 动态内容替换
使用正则表达式进行动态内容构造：
```txt
# 将原始响应中的时间戳替换为当前时间
www.example.com/api/time resBody://`({"timestamp":${now}})`
```

### 环境特定替换
```txt
# 开发环境：使用模拟数据
dev-api.example.com resBody://{"env":"development","data":"mock"}
```

### 错误场景测试
```txt
# 模拟各种错误响应
www.example.com/api resBody://{"error":"RateLimitExceeded"} includeFilter://s:429
www.example.com/api resBody://{"error":"InternalServerError"} includeFilter://s:500
www.example.com/api resBody://{"error":"ServiceUnavailable"} includeFilter://s:503
```

## 与 file 协议的区别

`resBody` 协议与 [`file`](./file) 协议的主要区别在于请求处理流程：

### 处理流程对比
- **`resBody` 协议**：请求**先发送到后台服务器**获取原始响应，然后用指定内容**替换**原始响应体
- **`file` 协议**：请求**不会发送到后台服务器**，直接返回指定的文件内容

### 使用场景对比
- **`resBody`**：适用于修改真实接口的返回内容，保持请求-响应的完整流程
- **`file`**：适用于完全本地模拟，不依赖真实后端服务

## 注意事项

### 响应类型保持
- `resBody` 替换的是响应体内容，不会自动修改 `Content-Type` 响应头
- 如果需要修改响应类型，请配合使用 [`resType`](./resType) 协议

## 常见问题

### Q: resBody 规则没有生效
**A:** 检查：
1. 响应状态码是否有响应体（排除 204、304 等）
2. 规则 pattern 是否正确匹配请求 URL
3. 过滤器条件是否满足
4. 是否有更高优先级的规则覆盖


### Q: 能否仅替换特定类型的响应
**A:** 可以，使用过滤器：
```txt
# 仅替换 JSON 响应
pattern resBody://content includeFilter://resH:content-type=json

# 仅替换特定路径的响应
pattern resBody://content includeFilter://*/api/v1/
```


## 关联协议

1. **在响应内容前面注入内容**：[resPrepend](./resPrepend)
   - 在原始响应内容的前面插入内容

2. **在响应内容后面追加内容**：[resAppend](./resAppend)
   - 在原始响应内容的后面追加内容

3. **替换请求内容**：[reqBody](./reqBody)
   - 替换发送到服务器的请求体内容

4. **直接返回本地文件**：[file](./file)
   - 不请求服务器，直接返回本地文件内容

5. **修改响应头**：[resHeaders](./resHeaders)
   - 修改响应头部信息，如 `Content-Type`

## 扩展阅读

- [匹配模式文档](./pattern)：详细了解 URL 匹配规则
- [操作指令文档](./operation)：了解内容加载的多种方式
- [过滤器文档](./filters)：了解更多过滤器功能
