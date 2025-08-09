# ignore
用于忽略指定协议的匹配规则，也可以忽略当前配置的匹配规则。

## 规则语法
``` txt
pattern ignore://p1|p2|... [filters...]
# 等效于：
pattern ignore://p1 ignore://p2 ... [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作协议（`protocol`）名称<br/>`*` 表示所以协议<br/>`-p` 表示排除 `p`<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作协议列表](./protocols)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 忽略所有规则，只保留 `file` 协议的规则
www.example.com/path ignore://*|-file

# 忽略指定协议：file、host
www.example.com/path2 ignore://file|host
```

## 常见问题
`ignore` 是根据指定协议忽略已匹配的规则，用这种方式忽略的规则不会继续匹配同类型的其他规则，如果想让请求忽略某个规则后再继续尝试匹配剩余的同类型规则可以采用 [skip](./skip)。

