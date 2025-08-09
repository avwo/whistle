# resCors
设置响应阶段的跨域资源共享（[CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS))）头部信息，解决跨域请求问题。

## 规则语法
``` txt
pattern resCors://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | CORS 对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容  | [操作指令文档](./operation) |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

CORS 对象结构：
``` text
origin: *
methods: POST
headers: x-test
credentials: true
maxAge: 300000
```

对应响应头：

``` txt
access-control-allow-origin: *
access-control-allow-methods: POST
access-control-allow-headers: x-test
access-control-allow-credentials: true
access-control-max-age: 300000
```
> 请求方法为 `OPTIONS` 时，`access-control-allow-headers` -> `access-control-expose-headers`

## 配置示例
#### 快捷模式
1. 设置响应头 `access-control-allow-origin: *`（不支持带 cookie）
    ``` txt
    www.example.com/path resCors://*
    ```
2. 允许带 cookie
    ``` txt
    # `enable` 表示根据请求头 `origin` 设置 access-control-allow-origin: http://reqOrigin
    # 及设置 access-control-allow-credentials: true
    www.example.com/path2 resCors://enable
    ```

#### 详细配置模式
```` txt
``` cors.json
origin: *
methods: POST
headers: x-test
credentials: true
maxAge: 300000
```
www.example.com/path resCors://{cors.json}

# 对 OPTIONS 请求不处理
www.example.com/path2 resCors://{cors.json} excludeFilter://options
````
设置响应头：
``` txt
access-control-allow-origin: *
access-control-allow-methods: POST
access-control-allow-headers: x-test
access-control-allow-credentials: true
access-control-max-age: 300000
```
#### 本地/远程资源

```` txt
www.example.com/path1 resCors:///User/xxx/test.json
www.example.com/path2 resCors://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 resCors://temp/blank.json
````


## 关联协议
1. 删除响应头字段：[delete://resHeaders.orogin](./delete)
2. 设置请求 CROS：[resCors](./resCors)
