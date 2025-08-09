# forwardedFor
修改请求头 `x-forwarded-for` 字段，自定义客户端 IP。

## 规则语法
``` txt
pattern forwardedFor://ip [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| ip   | 自定义客户端 IP<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 设置固定 IP
www.example.com/path  forwardedFor://1.1.1.1

# 使用真实客户端 IP（透传模式）
www.example.com  forwardedFor://`${clientIp}`
```

## 关联协议
1. 直接修改请求头：[reqHeaders://x-forwarded-for=value](./reqHeaders)（这种方式的 `value` 可以不局限于 IP）
2. 启用自动设置 `x-forwarded-for`：[enable://clientIp](./enable)
