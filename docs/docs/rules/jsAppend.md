# jsAppend
在现有响应内容体后面插入指定内容（仅对响应类型 `content-type` 包含 `javascript`，且包含响应内容体的状态码（如 `200`/`500` 等）有才效）
> ⚠️ 注意：204、304 等无响应内容体的请求不受影响

## 规则语法
``` txt
pattern jsAppend://value [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 文本或二进制内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 内联方式
``` txt
www.example.com/path1 jsAppend://(Hello) file://(-test-)
www.example.com/path2 jsAppend://(Hello) file://(-test-) resType://js
www.example.com/path3 jsAppend://(Hello) file://(-test-) resType://css
```
- 请求 `https://www.example.com/path1/to` 响应内容变成 `-test-<script>Hello</script>`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `-test-Hello`
- 请求 `https://www.example.com/path3/to` 响应内容变成 `-test-`

#### 内嵌/Values方式
```` txt
``` body.txt
Hello world.
```
www.example.com/path1 jsAppend://{body.txt} file://(-test-)
www.example.com/path2 jsAppend://{body.txt} file://(-test-) resType://js
www.example.com/path3 jsAppend://{body.txt}) file://(-test-) resType://css
````
- 请求 `https://www.example.com/path1/to` 响应内容变成 `-test-<script>Hello world.</script>`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `-test-Hello world.`
- 请求 `https://www.example.com/path3/to` 响应内容变成 `-test-`

#### 本地/远程资源

```` txt
www.example.com/path1 jsAppend:///User/xxx/test.js
www.example.com/path2 jsAppend://https://www.xxx.com/xxx/params.js
# 通过编辑临时文件
www.example.com/path3 jsAppend://temp/blank.js
````

## 为注入的脚本设置 `<script>` 标签属性

通过 `jsAppend` 注入到 HTML 页面的脚本，Whistle 会自动为其包裹 `<script>` 标签。若需要为该标签设置额外的属性，如 `nomodule`、`module`、`defer`、`async`、`crossorigin` 等，可以使用 `lineProps` 参数进行配置。

```txt
www.example.com/path1 jsAppend://https://www.xxx.com/xxx/params.js lineProps://nomodule
www.example.com/path2 jsAppend://https://www.xxx.com/xxx/params.js lineProps://module
www.example.com/path3 jsAppend://https://www.xxx.com/xxx/params.js lineProps://defer
www.example.com/path4 jsAppend://https://www.xxx.com/xxx/params.js lineProps://async
www.example.com/path5 jsAppend://https://www.xxx.com/xxx/params.js lineProps://crossorigin
```

### 属性说明与示例
| 属性 | 用途说明 | 配置示例 |
|------|----------|----------|
| `nomodule` | 传统浏览器中执行，不支持 ES 模块的浏览器会运行此脚本 | `lineProps://nomodule` |
| `module` | 声明为 ES 模块，支持模块化导入 | `lineProps://module` |
| `defer` | 异步加载，在文档解析完成后执行 | `lineProps://defer` |
| `async` | 异步加载，下载完成后立即执行 | `lineProps://async` |
| `crossorigin`| 启用跨域资源共享（CORS）模式 | `lineProps://crossorigin` |

## 关联协议 {#related}

1. 在响应内容前注入内容（`Prepend To Body`）：[resPrepend](./resPrepend)
2. 在响应内容前注入 HTML 内容（`Prepend HTML To Body`，响应类型必须为 `text/html`）：[htmlPrepend](./htmlPrepend)
3. 在响应内容前注入 CSS 内容（`Prepend CSS To Body`，响应类型必须为 `text/html` 或 `text/css`）：[cssPrepend](./cssPrepend)
4. 在响应内容前注入 JS 内容（`Prepend JS To Body`，响应类型必须为 `text/html`、`text/css` 或 `application/javascript`）：[jsPrepend](./jsPrepend)
5. 替换响应内容（`Replace Body`）：[resBody](./resBody)
6. 用 HTML 内容替换响应内容（`Replace Body`，响应类型必须为 `text/html`）：[htmlBody](./htmlBody)
7. 用 CSS 内容替换响应内容（`Replace Body`，响应类型必须为 `text/html` 或 `text/css`）：[cssBody](./cssBody)
8. 用 JS 内容替换响应内容（`Replace Body`，响应类型必须为 `text/html`、`text/css` 或 `application/javascript`）：[jsBody](./jsBody)
9. 在响应内容后追加内容（`Append To Body`）：[resAppend](./resAppend)
10. 在响应内容后追加 HTML 内容（`Append HTML To Body`，响应类型必须为 `text/html`）：[htmlAppend](./htmlAppend)
11. 在响应内容后追加 CSS 内容（`Append CSS To Body`，响应类型必须为 `text/html` 或 `text/css`）：[cssAppend](./cssAppend)
12. 在响应内容后追加 JS 内容（`Append JS To Body`，响应类型必须为 `text/html`、`text/css` 或 `application/javascript`）：[jsAppend](./jsAppend)
13. 使用关键字或正则表达式替换响应内容（`Modify Body Text`）：[resReplace](./resReplace)
14. 覆盖响应内容中的 JSON/Form 对象（`Modify Form/JSON`）：[resMerge](./resMerge)
15. 删除响应内容中的 JSON/Form 对象属性（`Delete Form/JSON`）：[delete://resBody.xxx](./delete)

