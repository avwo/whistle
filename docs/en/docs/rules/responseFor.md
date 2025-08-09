# responseFor
通过设置响应头 `x-whistle-response-for` 字段，自定义在 Whistle Network 面板上显示的 `ServerIP`。
> 等价于：[resHeaders://x-whistle-response-for=xxx](./resHeaders)

# 规则语法
``` txt
pattern responseFor://ip [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| ip   | 自定义客户端 IP<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
www.example.com/path  responseFor://1.1.1.1,2.2.2.2
```
<img src="/img/response-for.png" width="800" />

## 关联协议
1. 自定义响应头：[resHeaders://x-whistle-response-for=xxx](./resHeaders)
