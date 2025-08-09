# resCharset
修改响应头 `content-type` 的 `charset` 部分，设置响应内容的编码。
> `content-type` 结构：
> ``` txt
> <media-type>; charset=<encoding>
> ```

## 规则语法
``` txt
pattern resCharset://encoding [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| encoding | 编码名称，如 `utf8` <br/>• 内联/内嵌/Values内容<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 设置响应编码，响应头 `content-type` 空字段被改成 `; charset=utf8`
www.example.com/path resCharset://utf8

# 设置响应编码，响应头 `content-type` 空字段被改成 `text/html; charset=utf8`
www.example.com/path resType://json resCharset://utf8
```

## 关联协议
1. 直接修改响应头：[resHeaders://content-type=xxx](./reqHeaders)
2. 修改响应内容编码：[resType://media-type](./resCharset)
