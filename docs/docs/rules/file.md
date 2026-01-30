# file

`file` 协议用于将请求映射到本地文件系统，用本地文件的内容作为响应返回给客户端，适用于以下场景：

- **搭建本地开发环境**：快速搭建本地开发服务器
- **调试本地前端页面**：直接调试本地 HTML、CSS、JavaScript 文件
- **接口 Mock 场景**：使用本地 JSON 文件模拟 API 接口响应
- **静态资源服务**：将本地目录作为静态资源服务器使用

## 规则语法

`file` 协议支持多种方式指定本地文件内容：

### 1. 内联值（直接指定）
直接在规则中写明要返回的内容，适用于简短的文本内容。注意：`value` 不能包含空格和换行符。

```txt
pattern file://(value) [lineProps...] [filters...]
```

**示例：**
```txt
www.example.com/api/data file://({"status":"ok"})
```

**注意：内联值必须用括号 `()` 包裹，否则会被识别为本地文件路径，可能导致 404 错误：**
``` txt
# 正确写法：返回字符串 "success"
pattern file://(success)

# 错误写法：会被当作路径处理，可能导致 404
pattern file://success
```

> **file 协议的内联值语法要点**：
> - 必须使用 `()` 包裹内容
> - 内容不能包含空格和换行符
> - 可以是字符串、JSON、HTML片段等
> - 如果不加 `()`，Whistle 会将其解释为文件路径或 `{key}` 并尝试加载对应文件或 key 值

### 2. 内嵌值（使用代码块）
当需要处理包含空格、换行符的复杂内容，或希望复用某段配置时，推荐使用此方式。

````txt
pattern file://{custom-key.json} [lineProps...] [filters...]

``` custom-key.json
{
  "status": "success",
  "data": {
    "message": "Hello from local file"
  }
}
```
````

**最佳实践**：建议为 `key` 添加响应类型后缀（如 `.json`、`.html`、`.css`），Whistle 会自动根据后缀设置正确的 `Content-Type`。

### 3. 引用 Values 中的值
当内容较大时，可以将其存储在 `Values` 配置区中。

```txt
pattern file://{key-of-values.html} [lineProps...] [filters...]
```

**前提**：在 `Values` 中存在名为 `key-of-values.html` 的键，其值为要返回的内容。

**容量建议**：
- 小于 2KB 的内容：建议使用内联或内嵌方式
- 2KB 至 200KB 的内容：建议存储在 `Values` 中
- 大于 200KB 的内容：建议使用本地文件

### 4. 从临时文件中加载
当需要频繁编辑内容时，可以使用 Whistle 提供的临时文件功能。

```txt
pattern file://temp.html
```

**操作步骤**：
1. 在 Rules 编辑器中，按住 `Command`（Mac）/ `Ctrl`（Windows）
2. 鼠标点击 `file://temp.html`
3. 在弹出的编辑对话框中输入响应内容
4. 点击 `Save` 保存

保存后规则会自动变为类似以下格式：
```txt
https://example.com/report file://temp/11adb9c9e1142df67b30d7646ec59bcd34c855d9011d1a2405c7fc2dfc94568d.html
```

需要再次编辑时，用同样的方式点击该临时文件链接即可。

### 5. 从文件路径或远程 URL 加载
从本地文件系统或远程 URL 加载响应内容。

```txt
# 从本地文件加载
pattern file:///User/xxx/test.html

# 从远程 URL 加载
pattern file://https://example.com/template.html
```



## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **value** | 是 | 要返回的文件内容或路径，支持多种格式：<br>• 本地文件或目录路径<br>• 远程 URL<br>• 内联、内嵌、Values 引用内容 |
| **lineProps** | 否 | 为规则设置附加属性。<br>**示例**：<br>• `lineProps://important`：提升规则优先级<br>• `lineProps://weakRule`：当同时配置 [file](./file) 和 [proxy](./proxy) 规则时，默认 [proxy](./proxy) 会失效。通过此属性可提升 [proxy](./proxy) 规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |



## 配置示例

### 1. 基础文件路径映射
```txt
# 将域名映射到本地目录
www.example.com/path file:///Users/username/projects/my-site

# Windows 系统路径
www.example.com/path file://D:\projects\my-site
```

**特性说明**：
- **自动路径拼接**：访问 `https://www.example.com/path/x/y/z` 会映射到 `/Users/username/projects/my-site/x/y/z`
- **禁用路径拼接**：使用 `< >` 包裹路径可以禁用自动拼接
    ```txt
    www.example.com/path file://</Users/username/projects/my-site/index.html>
    ```
    > 访问 `https://www.example.com/path/x/y/z` 只会返回 `/Users/username/projects/my-site/index.html` 文件

### 2. JSONP 接口 Mock
````txt
# 内联方式
www.example.com/jsonp file://`(${query.callback}({"status":"ok"}))`

# 内嵌方式
``` jsonp-response
${query.callback}({
  "status": "error",
  "message": "Invalid parameter"
})
```
www.example.com/jsonp file://`{jsonp-response}`
````

> **模板字符串限制**：模板字符串在以下场景无法直接生效：
> - 引用本地文件路径时
> - 引用远程 URL 地址时
> 
> 遇到上述限制时，可以使用 [tpl](./tpl) 协议作为替代方案。

### 3. 配合过滤器使用
```txt
# 排除特定接口
www.example.com/api/path file:///Users/username/mock-data excludeFilter://*/api/auth

# 根据请求体内容匹配
www.example.com/api/search file:///Users/username/search-results.json includeFilter://b:/"type":\s*"advanced"/i

# 仅匹配 POST 请求
www.example.com/api/submit file:///Users/username/success.json includeFilter://m:POST
```

### 4. 多目录搜索
```txt
# 多个文件或目录用 `|` 分隔
www.example.com/static/path file:///path/to/project1|/path/to/project2|/path/to/project3
```

**查找逻辑**：
1. 按顺序检查每个目录
   - `/path/to/project1/static/file.js`
   - `/path/to/project2/static/file.js`
   - `/path/to/project3/static/file.js`
2. 找到第一个存在的文件立即返回
3. 全部未找到时返回 `404 Not Found`

## 高级用法

### 动态路径处理
```txt
# 使用正则表达式捕获组
/^https?://www\.example\.com/user/(\d+)/profile file:///Users/username/mock/profiles/user-$1.json

# 如果不限制数字，可以用通配符
^www.example.com/user/*/profile file:///Users/username/mock/profiles/user-$1.json
```

### 环境特定配置
````txt
``` dev-config
{
  "apiBase": "http://localhost:3000",
  "debugMode": true
}
```

``` prod-config
{
  "apiBase": "https://api.example.com",
  "debugMode": false
}
```

# 通过 cookie：env=dev 判断是否为开发环境
www.example.com/config file://{dev-config} includeFilter://reqH:cookie=/env=dev/
www.example.com/config file://{prod-config} # 默认正式环境
````

### 组合使用其他协议
```txt
# 先使用 file 提供静态文件，再设置响应头
www.example.com file:///Users/username/static-files cache://3600

# 对于不存在的文件，使用 xfile 允许请求继续
www.example.com xfile:///Users/username/static-files
```

## 与 resBody 的区别

`file` 协议与 [`resBody`](./resBody) 协议的主要区别在于请求处理流程和响应机制：

**`file` 协议：***
- **请求流程**：匹配 `file` 协议的请求**不会发送到后台服务器**
- **响应机制**：直接返回指定文件内容，并响应 200 状态码
- **网络开销**：零网络延迟，完全本地处理

**示意图**：
```
客户端请求 → Whistle (匹配file规则) → 读取本地文件 → 返回响应 (200)
                  ↓
            (不发送到服务器)
```

**`resBody` 协议：**
- **请求流程**：请求**会先发送到后台服务器**，获取原始响应
- **响应机制**：收到服务器响应后，用指定内容**替换**原始响应体
- **网络开销**：包含完整的请求-响应网络往返

**示意图**：
```
客户端请求 → Whistle → 发送到服务器 → 收到原始响应 → 替换响应体 → 返回修改后的响应
```

## 关联协议

1. **允许未匹配文件继续访问**：[xfile](./xfile)
   - 当本地文件不存在时，允许请求继续访问原始服务器
   - 适合静态资源服务器的开发场景

2. **使用远程 URL 内容替换**：[https](./https) 或 [http](./http)
   - 使用远程服务器的内容作为响应
   - 注意：不建议使用 `file://https://xxx` 这种形式

3. **域名解析重定向**：[host](./host)
   - 修改域名解析，将请求导向指定 IP

4. **模板渲染**：[tpl](./tpl)
   - 支持更复杂的模板渲染和动态内容生成



## 注意事项

### 路径处理
1. **相对路径**：除了插件内部的规则外，不建议使用相对路径。相对路径相对于 Whistle 配置文件所在目录。
2. **绝对路径**：支持系统绝对路径
3. **用户目录**：支持 `~` 表示用户主目录
4. **Windows 路径**：支持混用 `/` 和 `\` 作为路径分隔符

### 文件编码
1. **文本文件**：默认使用 UTF-8 编码
2. **编码问题**：如遇乱码，请检查文件的实际编码格式


## 故障排除

### Q: 文件未找到（404）
**A:** 检查：
1. 文件路径是否正确
2. 文件是否存在且有读取权限
3. 是否使用了 `< >` 禁用了路径拼接

### Q: 乱码问题
**A:** 检查：
1. 文件的实际编码格式
2. 响应头的 `Content-Type` 是否正确
3. 文件内容是否包含非法字符

### Q: 规则未生效
**A:** 检查：
1. 规则 pattern 是否正确匹配
2. 是否有其他规则覆盖
3. 过滤器条件是否满足

### Q: 模板字符串不生效
**A:** 检查：
1. 是否在文件路径或远程 URL 场景下使用模板字符串
2. 如果是，请改用 [tpl](./tpl) 协议



## 扩展阅读

- [匹配模式文档](./pattern)：详细了解 URL 匹配规则
- [操作指令文档](./operation)：了解内容加载的多种方式
- [附加配置](./lineProps)：详细了解一些特殊功能
- [过滤器](./filters)：了解更多过滤器功能
