# resPrepend

`resPrepend` 协议用于在现有响应内容体的开头插入指定内容，仅对包含响应内容体的状态码（如 `200`、`500` 等）有效，通过 `resPrepend` 协议，你可以：
- 在响应内容的开头添加自定义内容
- 插入调试信息或时间戳
- 添加脚本、样式表或其他资源的引用
- 注入环境标记或版本信息
- 保持原始响应内容完整，仅在开头添加额外内容

> **生效条件**：仅对有响应内容体的状态码生效
> 
> ⚠️ 注意：`204`、`304` 等无响应内容体的请求不受影响

## 规则语法

`resPrepend` 支持多种方式指定要插入的内容：

### 1. 内联值（直接指定）
直接在规则中写明要插入的内容，适用于简短文本（不能包含空格和换行符）。

```txt
pattern resPrepend://(value) [lineProps...] [filters...]
```
**示例：**
```txt
www.example.com/page resPrepend://(<!--页面开始-->)
```

### 2. 内嵌值（使用代码块）
当需要处理包含空格、换行符的复杂内容，或希望复用某段配置时，推荐使用此方式。

````txt
pattern resPrepend://{custom-key} [lineProps...] [filters...]

``` custom-key
<!-- 调试信息 -->
<script>
  console.log('页面加载时间:', new Date().toISOString());
</script>
```
````

### 3. 引用 Values 中的值
当内容较大时，可以将其存储在 `Values` 配置区中。

```txt
pattern resPrepend://{key-of-values} [lineProps...] [filters...]
```
**前提**：在 `Values` 中存在名为 `key-of-values` 的键，其值为要插入的内容。

### 4. 从文件路径或远程 URL 加载
从本地文件或远程 URL 加载要插入的响应内容。

```txt
# 从本地文件加载
pattern resPrepend:///User/xxx/header.html

# 从远程 URL 加载
pattern resPrepend://https://cdn.example.com/analytics-script.js
```

### 5. 从临时文件中加载
当需要频繁编辑内容时，可以使用 Whistle 提供的临时文件功能。

```txt
pattern resPrepend://temp/blank.txt
```
**操作步骤**：
1. 在 Rules 编辑器中，按住 `Command`（Mac）/ `Ctrl`（Windows）
2. 鼠标点击 `resPrepend://temp/blank.txt`
3. 在弹出的编辑对话框中输入要插入的内容
4. 点击 `Save` 保存


## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **value** | 是 | 要插入的响应内容，支持多种格式：<br>• 本地文件路径<br>• 远程 URL<br>• 内联、内嵌、Values 引用内容 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |



## 配置示例

### 基础示例
```txt
# 在 HTML 页面开头添加注释
www.example.com/index.html resPrepend://(<!--页面开始时间:-->)

# 在 JSON 响应前添加时间戳
api.example.com/data.json resPrepend://({"timestamp":"2024-01-01T00:00:00Z"})
```

### 示例场景分析

#### 场景 1：插入调试信息
````txt
``` debug-header
<!-- 
  调试信息：
  - URL: ${url}
  - 时间: ${now}
  - 用户代理: ${reqHeaders.user-agent}
-->
```

www.example.com resPrepend://`{debug-header}`
````

#### 场景 2：添加页面头部内容
```` txt
# 添加公共头部
^www.example.com/*.html resPrepend://{custom-html}

``` custom-html
<div class="site-header">网站头部</div>
```
````

#### 场景 3：注入分析脚本
```` txt
# 添加 Google Analytics 脚本
www.example.com resPrepend://{google-analytics}
``` google-analytics
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXX');
</script>
```
````

### 配合其他协议使用
```txt
# 先添加头部内容，再添加尾部内容
www.example.com/page resPrepend://(<header>) resAppend://(</footer>)

# 配合 file 协议使用
www.example.com/path resPrepend://(Hello) file://(-test-)
```
**响应结果：**
```
Hello-test-
```

### 使用内嵌值
````txt
``` body.txt
Hello world.
```

www.example.com/path resPrepend://{body.txt} file://(-test-)
````
**响应结果：**
```
Hello world.-test-
```

### 从文件或远程 URL 加载
```txt
# 从本地文件加载
www.example.com/path1 resPrepend:///User/xxx/test.txt

# 从远程 URL 加载
www.example.com/path2 resPrepend://https://www.xxx.com/xxx/params.txt

# 使用临时文件
www.example.com/path3 resPrepend://temp/blank.txt
```

### 配合过滤器使用
```` txt
# 仅为开发环境添加调试信息
www.example.com resPrepend://(<!--开发环境-->) includeFilter://reqH:host=/dev\./

# 仅对 HTML 页面添加头部
www.example.com resPrepend://{header} resType://html

``` header
<div class="header" />
```

# 根据响应状态码决定是否添加内容
www.example.com/api resPrepend://({"debug":true}) includeFilter://s:200
````


## 高级用法

### 动态内容插入
使用模板字符串实现动态内容：
```` txt
# 插入当前时间戳
www.example.com/api resPrepend://`({"timestamp":"${now}"})`

# 插入请求信息
www.example.com/debug resPrepend://`{req-info}`

``` req-info
<!-- 请求方法: ${method}, 路径: ${path} -->
```
````

### 组合多个插入内容
```` txt
# 插入多个内容片段
www.example.com/page resPrepend://{header1} resPrepend://{header2}

``` header1
<div id="header1" />
```
``` header2
<div id="header2" />
```
# 最终结果: <div id="header2" /><div id="header1" />[原始内容]
````

### 条件插入
`````txt
# 仅在特定条件下插入内容
www.example.com/admin resPrepend://{log.js} includeFilter://reqH:cookie=/admin=true/

```` log.js
<script>console.log('管理员页面')</script>
````
`````


## 常见问题

### Q: resPrepend 规则没有生效
**A:** 检查：
1. 响应状态码是否有响应体（排除 204、304 等）
2. 规则 pattern 是否正确匹配请求 URL
3. 过滤器条件是否满足
4. 是否有其他规则干扰

### Q: 如何确保插入内容在特定位置
**A:** 
- `resPrepend` 始终在响应内容的最前面插入
- 如果需要在其他位置插入，请考虑使用 `resReplace` 配合正则表达式替换

### Q: 能否删除原始响应的部分内容
**A:** 不能。`resPrepend` 只负责添加内容，不删除或修改原始内容。如需删除内容，请使用 `resBody` 协议。

## 与 resBody 的区别

`resPrepend` 协议与 [`resBody`](./resBody) 协议的主要区别在于处理方式：
- **`resPrepend`**：在原始响应内容**前面**插入指定内容，保留原始内容
- **`resBody`**：**替换**整个响应内容，不保留原始内容

## 关联协议

1. **替换响应内容**：[resBody](./resBody)
   - 完全替换响应内容，不保留原始内容

2. **在响应内容后面追加内容**：[resAppend](./resAppend)
   - 在响应内容的末尾添加内容

3. **替换请求内容**：[reqBody](./reqBody)
   - 替换发送到服务器的请求体内容

4. **在请求内容前面插入内容**：[reqPrepend](./reqPrepend)
   - 在请求体内容的前面插入内容

5. **在请求内容后面追加内容**：[reqAppend](./reqAppend)
   - 在请求体内容的末尾添加内容

## 扩展阅读

- [匹配模式文档](./pattern)：详细了解 URL 匹配规则
- [操作指令文档](./operation)：了解内容加载的多种方式
- [过滤器文档](./filters)：了解更多过滤器功能
