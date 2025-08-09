# reqType
修改请求头 `content-type` 的 `media-type` 和 `charset` 部分。
> `content-type` 结构：
> ``` txt
> <media-type>; charset=<encoding>
> ```

## 规则语法
``` txt
pattern reqType://type[;charset] [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| type[;charset] | `type` 请求类型，`charset` 编码 <br/>• 内联/内嵌/Values内容<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

`reqType` 主要用来修改请求类型的 `media-type` 部分 ，`charset` 部分可选，如果没有设置 `charset` 部分则会保留请求原始的 `charset` 部分（如果存在）。

## 配置示例

#### 快捷命令（不包含 `/` 的字符串）
- `urlencoded`: `application/x-www-form-urlencoded`
- `form`: `application/x-www-form-urlencoded`
- `json`: `application/json`
- `xml`: `application/xml`
- `text`: `text/plain`
- `upload`: `multipart/form-data`
- `multipart`: `multipart/form-data`
- 其它：[mime](https://github.com/broofa/mime).lookup(type)

``` txt
# 不带编码 请求头的 `content-type` 变成 `application/x-www-form-urlencoded`
www.example.com/path reqType://form

# 带编码，请求头的 `content-type` 变成 `application/json;charset=utf8`
www.example.com/path reqType://json;charset=utf8
```
#### 完整类型
``` txt
# 请求头的 `content-type` 变成 `text/plain`
www.example.com/path reqType://text/plain

# 请求头的 `content-type` 变成 `text/plain;charset=utf8`
www.example.com/path reqType://text/plain;charset=utf8
```

## 关联协议
1. 直接修改请求头：[reqHeaders://content-type=xxx](./reqHeaders)
2. 修改请求内容编码：[reqCharset://encoding](./reqCharset)
