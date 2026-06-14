# htmlBody

将现有响应内容体t替换成指定内容（仅对响应类型 `content-type` 包含 `html`，且包含响应内容体的状态码（如 `200`/`500` 等）有才效）
> ⚠️ 注意：204、304 等无响应内容体的请求不受影响

## 规则语法
``` txt
pattern htmlBody://value [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 文本或二进制内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 内联方式
``` txt
www.example.com/path htmlBody://(Hello) file://(-test-)
www.example.com/path2 htmlBody://(Hello) file://(-test-) resType://js
```
- 请求 `https://www.example.com/path/to` 响应内容变成 `Hello`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `-test-`

#### 内嵌/Values方式
```` txt
``` body.txt
Hello world.
```
www.example.com/path htmlBody://{body.txt} file://(-test-)
www.example.com/path2 htmlBody://{body.txt} file://(-test-) resType://css
````
- 请求 `https://www.example.com/path/to` 响应内容变成 `Hello world.`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `-test-`

#### 规避不规范的请求
当接口响应类型（`Content-Type`）不规范地返回为 `text/html` 时，可能导致：
- 前端误将接口数据当作 HTML 解析
- 注入内容破坏原始数据结构
- 引发前端解析错误

使用 enable://strictHtml 或 enable://safeHtml 模式保护非 HTML 内容：
``` txt
www.example.com/path1 htmlBody://(test) file://(-test-) enable://strictHtml
www.example.com/path2 htmlBody://(test) file://([-test-])  enable://strictHtml
www.example.com/path3 htmlBody://(test) file://([-test-])  enable://safeHtml
www.example.com/path4 htmlBody://(test) file://(<div>Test</div>) enable://strictHtml
```
- 请求 `https://www.example.com/path1/to` 响应内容变成 `-test-`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `[-test-]`
- 请求 `https://www.example.com/path3/to` 响应内容变成 `[-test-]`
- 请求 `https://www.example.com/path4/to` 响应内容变成 `test`

`safeHtml`/`strictHtml` 功能参考：[enable://safeHtml](./enable)、[lineProps://strictHtml](./lineProps)

#### 本地/远程资源

```` txt
www.example.com/path1 htmlBody:///User/xxx/test.txt
www.example.com/path2 htmlBody://https://www.xxx.com/xxx/params.txt
# 通过编辑临时文件
www.example.com/path3 htmlBody://temp/blank.txt
````

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
16. 校验 HTML 内容格式：[enable://safeHtml](./enable)、[lineProps://strictHtml](./lineProps)

