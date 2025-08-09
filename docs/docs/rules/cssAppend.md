# cssAppend
在现有响应内容体后面插入指定内容（仅对响应类型 `content-type` 包含 `css`，且包含响应内容体的状态码（如 `200`/`500` 等）有才效）
> ⚠️ 注意：204、304 等无响应内容体的请求不受影响

## 规则语法
``` txt
pattern cssAppend://value [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 文本或二进制内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 内联方式
``` txt
www.example.com/path1 cssAppend://(Hello) file://(-test-)
www.example.com/path2 cssAppend://(Hello) file://(-test-) resType://js
www.example.com/path3 cssAppend://(Hello) file://(-test-) resType://css
```
- 请求 `https://www.example.com/path1/to` 响应内容变成 `-test-<style>Hello</style>`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `-test-`
- 请求 `https://www.example.com/path3/to` 响应内容变成 `-test-Hello`

#### 内嵌/Values方式
```` txt
``` body.txt
Hello world.
```
www.example.com/path1 cssAppend://{body.txt} file://(-test-)
www.example.com/path2 cssAppend://{body.txt} file://(-test-) resType://js
www.example.com/path3 cssAppend://{body.txt} file://(-test-) resType://css
````
- 请求 `https://www.example.com/path1/to` 响应内容变成 `-test-<style>Hello world.</style>`
- 请求 `https://www.example.com/path2/to` 响应内容变成 `-test-`
- 请求 `https://www.example.com/path3/to` 响应内容变成 `-test-Hello world.`

#### 本地/远程资源

```` txt
www.example.com/path1 cssAppend:///User/xxx/test.css
www.example.com/path2 cssAppend://https://www.xxx.com/xxx/params.css
# 通过编辑临时文件
www.example.com/path3 cssAppend://temp/blank.css
````

## 关联协议
1. 在响应内容前面注入内容：[reqAppend](./reqAppend)
2. 在 CSS 类型的响应内容前面注入内容：[jsPrepend](./cssPrepend)
3. 替换 CSS 类型的响应内容：[jsBody](./cssBody)
