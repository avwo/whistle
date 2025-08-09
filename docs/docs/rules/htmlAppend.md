# htmlAppend
在现有响应内容体后面插入指定内容（仅对响应类型 `content-type` 包含 `html`，且包含响应内容体的状态码（如 `200`/`500` 等）有才效）
> ⚠️ 注意：204、304 等无响应内容体的请求不受影响

## 规则语法
``` txt
pattern htmlAppend://value [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 文本或二进制内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 内联方式
``` txt
www.example.com/path htmlAppend://(Hello) file://(-test-)
www.example.com/path2 htmlAppend://(Hello) file://(-test-) resType://js
```
- 请求 `https://www.example.com/path/to` 响应内容变成 `-test-Hello`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `-test-`

#### 内嵌/Values方式
```` txt
``` body.txt
Hello world.
```
www.example.com/path htmlAppend://{body.txt} file://(-test-)
www.example.com/path2 htmlAppend://{body.txt} file://(-test-) resType://css
````
- 请求 `https://www.example.com/path/to` 响应内容变成 `-test-Hello world.`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `-test-`

#### 规避不规范的请求
当接口响应类型（`Content-Type`）不规范地返回为 `text/html` 时，可能导致：
- 前端误将接口数据当作 HTML 解析
- 注入内容破坏原始数据结构
- 引发前端解析错误

使用 enable://strictHtml 或 enable://safeHtml 模式保护非 HTML 内容：
``` txt
www.example.com/path1 htmlAppend://(test) file://(-test-) enable://strictHtml
www.example.com/path2 htmlAppend://(test) file://([-test-])  enable://strictHtml
www.example.com/path3 htmlAppend://(test) file://([-test-])  enable://safeHtml
www.example.com/path4 htmlAppend://(test) file://(<div>Test</div>) enable://strictHtml
```
- 请求 `https://www.example.com/path1/to` 响应内容变成 `-test-`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `[-test-]`
- 请求 `https://www.example.com/path3/to` 响应内容变成 `[-test-]`
- 请求 `https://www.example.com/path4/to` 响应内容变成 `<div>Test</div>test`

`safeHtml`/`strictHtml` 功能参考：[enable://safeHtml](./enable)、[lineProps://strictHtml](./lineProps)

#### 本地/远程资源

```` txt
www.example.com/path1 htmlAppend:///User/xxx/test.txt
www.example.com/path2 htmlAppend://https://www.xxx.com/xxx/params.txt
# 通过编辑临时文件
www.example.com/path3 htmlAppend://temp/blank.txt
````

## 关联协议
1. 在响应内容前面注入内容：[reqAppend](./reqAppend)
2. 在 HTML 类型的响应内容前面注入内容：[htmlPrepend](./htmlPrepend)
3. 替换 HTML 类型的响应内容：[htmlBody](./htmlBody)
4. 校验 HTML 内容格式：[enable://safeHtml](./enable)、[lineProps://strictHtml](./lineProps)
