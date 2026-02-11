# reqBody
替换指定请求的内容体（仅对包含内容体的请求有效，如 `POST`、`PUT` 等）
> ⚠️ 注意：GET、HEAD 等无内容体的请求不受影响

## 规则语法
``` txt
pattern reqBody://value [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 文本或二进制内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 内联方式
``` txt
www.example.com/path reqBody://(Hello) method://post
```
请求 `https://www.example.com/path/to` 请求内容变成 `Hello`。 

#### 内嵌/Values方式
```` txt
``` body.txt
Hello world.
```
www.example.com/path reqBody://{body.txt} method://post
````
请求 `https://www.example.com/path/to` 请求内容变成 `Hello world.`。 

#### 本地/远程资源

```` txt
www.example.com/path1 reqBody:///User/xxx/test.txt
# 在 Windows 中，路径分隔符通常为 `\`，但同时它也接受 `/`
www.example.com/path1 reqBody://D:\test.txt
www.example.com/path2 reqBody://https://www.xxx.com/xxx/params.txt
# 通过编辑临时文件
www.example.com/path3 reqBody://temp/blank.txt
````

## 关联协议
1. 在请求内容前面注入内容：[reqPrepend](./reqPrepend)
2. 在请求内容后面追加内容：[reqAppend](./reqAppend)
3. 替换响应内容：[reqBody](./reqBody)
