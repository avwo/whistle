# replaceStatus
替换 HTTP 状态码，等请求响应后再把原始状态码替换成指定的 HTTP 状态码。

## 规则语法
``` txt
pattern replaceStatus://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 响应状态码，如 `200`/`302`/`404` 等 |    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 访问 `https://www.example.com/path/to` 浏览器提醒输入用户名和密码
www.example.com/path replaceStatus://401

# 可以通过 disable / lineProps 禁用弹登录框
www.example.com/path replaceStatus://401 disable://userLogin
```

## 关联协议
1. 设置状态码直接响应：[statusCode](./statusCode)
2. 禁止弹登录框：[enable](./enable) 或 [lineProps](./lineProps)
