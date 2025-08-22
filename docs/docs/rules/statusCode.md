# statusCode
立即中断请求并返回指定的 HTTP 状态码，不会将请求转发到后端服务器。

## 规则语法
``` txt
pattern statusCode://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 响应状态码，如 `200`/`302`/`404` 等 |    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 访问 `https://www.example.com/path/to` 浏览器提醒输入用户名和密码
www.example.com/path statusCode://401

# 可以通过 disable / lineProps 禁用弹登录框
www.example.com/path statusCode://401 disable://userLogin
```
> 设置 `statusCode` 的请求，响应内容为空，可以通过 [resBody](./resBody) 自定义响应内容

## 注意事项

`statusCode://value` 仅在请求阶段生效。匹配的请求将不会被转发至后端服务器。如需替换后端响应的 `statusCode`，请使用 [replaceStatus](./replaceStatus) 协议。

## 关联协议
1. 替换响应状态码：[replaceStatus](./replaceStatus)
2. 禁止弹登录框：[enable](./enable) 或 [lineProps](./lineProps)
3. 设置响应内容：[resBody](./resBody)
