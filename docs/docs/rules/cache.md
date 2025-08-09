# cache
设置响应的缓存头。

## 规则语法
``` txt
pattern cache://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 缓存的秒数、`no`、`no-cache`、`no-store`<br/>• 内联/内嵌/Values内容<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

影响的响应头：`cache-control`/`expires`/`pragma`

## 配置示例
``` txt
# 设置不缓存的响应头
www.example.com/path cache://no

# 设置缓存 60秒的响应头
www.example.com/path cache://60
```

## 关联协议
1. 禁用缓存：移除请求头中的缓存相关字段，并设置响应头为不缓存。详情参见：[disable://cache](./disable)
