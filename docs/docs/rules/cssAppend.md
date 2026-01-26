# cssAppend

`cssAppend` 协议用于在现有的 CSS 类型响应内容体后面插入指定内容。

> **生效条件**：仅对响应类型 `content-type` 包含 `html` 或 `css`，且包含响应内容体的状态码（如 `200`/`500` 等）才生效
> ⚠️ 注意：`204`、`304` 等无响应内容体的请求不受影响
> html 页面会自动包裹 `<style>...</style>`

通过 `cssAppend` 协议，你可以：
- 在现有 CSS 文件的末尾追加新的样式规则
- 动态添加 CSS 覆盖规则
- 为特定页面注入自定义样式
- 在不修改源文件的情况下扩展样式功能

## 规则语法

`cssAppend` 支持多种方式指定要追加的内容：

### 1. 内联值（直接指定）
直接在规则中写明要追加的 CSS 内容。
```txt
# `value` 小括号内不能用空格或换行符
pattern cssAppend://(value) [lineProps...] [filters...]
```

**示例：**
```txt
www.example.com/index.html cssAppend://(.custom-btn{background:red;})
```

### 2. 内嵌值（使用代码块）
当要追加的 CSS 内容有空格或换行符或需要复用时可使用此方式。
````txt
pattern cssAppend://{custom-key} [lineProps...] [filters...]

``` custom-key
.dark-mode {
  background: #333;
  color: #fff;
}
```
````

### 3. 引用 Values 中的值
引用在界面 `Values`（中央配置区）中预先定义好的 CSS 内容。
```txt
pattern cssAppend://{key-of-values} [lineProps...] [filters...]
```
**前提：** 在 `Values` 中存在一个名为 `key-of-values` 的键，其值为 CSS 内容。

### 4. 从临时文件中加载
当需要频繁编辑内容时，可以使用 Whistle 提供的临时文件功能。

```txt
pattern cssAppend://temp.css
```

**操作步骤**：
1. 在 Rules 编辑器中，按住 `Command`（Mac）/ `Ctrl`（Windows）
2. 鼠标点击 `cssAppend://temp.css`
3. 在弹出的编辑对话框中输入响应内容
4. 点击 `Save` 保存

保存后规则会自动变为类似以下格式：
```txt
https://example.com/test.css cssAppend://temp/11adb9c9e1142df67b30d7646ec59bcd34c855d9011d1a2405c7fc2dfc94568d.css
```

需要再次编辑时，用同样的方式点击该临时文件链接即可。

### 5. 从文件或远程 URL 加载
从本地文件或远程 URL 加载要追加的 CSS 内容。
```txt
# 从本地文件加载
pattern cssAppend:///User/xxx/custom.css

# 从远程 URL 加载（支持 http 和 https）
pattern cssAppend://https://cdn.example.com/styles/override.css
```
# 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **value** | 是 | 要追加的 CSS 内容，支持多种格式：<br>• 纯 CSS 代码文本<br>• 支持从本地文件、远程 URL、内联、内嵌、Values 引用 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |

**特殊说明：**
- 仅对 `content-type` 响应头包含 `css` 的请求生效
- 对 `204`、`304` 等无响应体的状态码不生效
- 追加的内容会直接拼接到原 CSS 文件的末尾


## 配置示例

#### 场景 1：添加响应式断点
```` txt
www.example.com/responsive.css cssAppend://{test.css}

``` test.css
@media (max-width: 768px) {
  .sidebar { display: none; }
  .main-content { width: 100%; }
}
```

````

#### 场景 2：覆盖第三方库样式
```` txt
cdn.example.com/bootstrap.min.css cssAppend://{test2.css}

``` test2.css
/* 覆盖 Bootstrap 默认样式 */
.btn-primary { background-color: #007bff !important; }
.container { max-width: 1400px; }
```
````

#### 场景 3：添加打印样式
````txt
www.example.com/print.css cssAppend://{test3.css}

``` test3.css
@media print {
  .no-print { display: none; }
  a::after { content: " (" attr(href) ")"; }
}`
```
````

## 关联协议

1. **在响应内容前面注入内容**：[reqAppend](./reqAppend)
   - 在所有类型响应内容的前面插入内容

2. **在 CSS 响应内容前面注入内容**：[cssPrepend](./cssPrepend)
   - 在 CSS 响应内容的前面插入内容（与 `cssAppend` 相反）

3. **替换 CSS 响应内容**：[cssBody](./cssBody)
   - 完全替换 CSS 响应内容（而非追加）

4. **其他内容类型操作**：
   - [jsAppend](./jsAppend)：在 JavaScript 响应内容后追加
   - [htmlAppend](./htmlAppend)：在 HTML 响应内容后追加
