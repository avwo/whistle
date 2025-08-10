# trailers
修改或新增使用 `Transfer-Encoding: chunked` 分块传输编码的响应尾部信息（`Trailers`）。Trailers 是在分块传输的响应主体之后发送的额外 HTTP 头部字段。
> HTTP Tailers 功能：https://http.dev/trailer

## 规则语法
``` txt
pattern trailers://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作数据对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 基础配置
``` txt
# 设置请求头 `x-proxy: Whistle`
www.example.com/path trailers://x-proxy=Whistle
```

#### 设置多个请求头

```` txt
``` test.json
x-test1: 1
x-test2:
x-test3: abc
```
www.example.com/path2 trailers://{test.json}

# 等价于：www.example.com/path2 trailers://x-test1=1&x-test2=&x-test3=abc
````

#### 本地/远程资源

```` txt
www.example.com/path1 trailers:///User/xxx/test.json
www.example.com/path2 trailers://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 trailers://temp/blank.json
````

## 关联协议
1. 删除请求头字段：[delete://trailers.xxx](./delete)



