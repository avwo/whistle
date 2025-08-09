# reqDelay

设置延迟请求的时间(单位：毫秒)。

## 规则语法
``` txt
pattern reqDelay://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 时间数值（单位：毫秒）<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 延迟 3000 毫秒（即 3 秒）请求
www.example.com/path reqDelay://3000

# 延迟 5000 秒（即 5 秒）后 abort 请求
www.example.com/path2 reqDelay://5000 enable://abort
```
