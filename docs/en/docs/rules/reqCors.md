# reqCors
设置请求的跨域资源共享（[CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS))）头部信息，解决跨域请求问题。

## 规则语法
``` txt
pattern resCors://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | CORS 对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容  | [操作指令文档](./operation) |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例

#### 快捷模式
``` txt
www.example.com/path reqCors://*
```
设置请求头 `origin: *`

#### 详细配置模式
```` txt
``` cors.json
origin: *
method: POST
headers: x-test
```
www.example.com/path reqCors://{cors.json}
````
设置请求头：
``` txt
origin: *
access-control-request-method: POST
access-control-request-headers: x-test
```
#### 本地/远程资源

```` txt
www.example.com/path1 reqCors:///User/xxx/test.json
www.example.com/path2 reqCors://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 reqCors://temp/blank.json
````

## 关联协议
1. 删除请求头字段：[delete://reqHeaders.orogin](./delete)
2. 设置响应 CROS：[resCors](./resCors)

