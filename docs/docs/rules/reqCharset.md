# reqCharset
修改请求头 `content-type` 的 `charset` 部分，设置请求内容的编码。
> `content-type` 结构：
> ``` txt
> <media-type>; charset=<encoding>
> ```

## 规则语法
``` txt
pattern reqCharset://encoding [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| encoding | 编码名称，如 `utf8` <br/>• 内联/内嵌/Values内容<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 设置请求编码，请求头 `content-type` 空字段被改成 `; charset=utf8`
www.example.com/path reqCharset://utf8

# 设置请求编码，请求头 `content-type` 空字段被改成 `text/html; charset=utf8`
www.example.com/path resType://json reqCharset://utf8
```

## 关联协议
1. 直接修改请求头：[reqHeaders://content-type=xxx](./reqHeaders)
2. 修改请求内容编码：[reqType://media-type](./reqCharset)
