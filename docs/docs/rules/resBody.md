# resBody
替换指定请求的响应内容体（仅对包含响应内容体的状态码有效，如 `200`/`500` 等）
> ⚠️ 注意：204、304 等无响应内容体的请求不受影响

## 规则语法
``` txt
pattern resBody://value [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 文本或二进制内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 内联方式
``` txt
www.example.com/path resBody://(Hello)
```
请求 `https://www.example.com/path/to` 响应内容变成 `Hello`。 

#### 内嵌/Values方式
```` txt
``` body.txt
Hello world.
```
www.example.com/path resBody://{body.txt}
````
请求 `https://www.example.com/path/to` 响应内容变成 `Hello world.`。 

#### 本地/远程资源

```` txt
www.example.com/path1 resBody:///User/xxx/test.txt
www.example.com/path2 resBody://https://www.xxx.com/xxx/params.txt
# 通过编辑临时文件
www.example.com/path3 resBody://temp/blank.txt
````

## 关联协议
1. 在响应内容前面注入内容：[resPrepend](./resPrepend)
2. 在响应内容后面追加内容：[resAppend](./resAppend)
3. 替换请求内容：[reqBody](./reqBody)

