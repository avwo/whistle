# includeFilter
在匹配 [pattern](./pattern) 的基础上，进一步筛选符合指定条件的请求（满足任一条件即可保留）。

## 语法规则
``` txt
pattern operation includeFilter://p1 includeFilter://p2 ...
```
> 请求要匹配 `pattern` 及 `p1`、`p2`、... 中的一个条件才能生效

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| operation   | 操作指令 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |


## 配置示例
``` txt
# 仅对 GET 或 POST 请求生效  
www.example.com/api/data proxy://127.0.0.1:8080 includeFilter://m:GET includeFilter://m:POST
```

可以跟 [excludeFilter](./excludeFilter) 一起使用，详细用法参考：[过滤器文档](./filters)
