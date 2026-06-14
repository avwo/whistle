# resMerge
将指定数据对象智能合并到响应体中，适合修改部分参数而不影响其余内容，支持以下响应类型：
- JSON（响应 `content-type` 包含 `json` 关键字）
- JSONP（响应 `content-type`为空或包含 `html`/`javascript` 关键字）

## 规则语法
``` txt
pattern resMerge://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作数据对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例

#### 内联方式
``` txt
www.example.com/path resMerge://test=123 file://({"name":"avenwu"})
```
访问 `https://www.example.com/path/to` 浏览器收到的内容：
``` js
{"name":"avenwu","test":"123"}
```

#### 内嵌方式
```` txt
``` resMerge.json
a.b.c: 123
c\.d\.e: abc
```
www.example.com/path resMerge://{resMerge.json} file://({"name":"avenwu"})
````
访问 `https://www.example.com/path/to` 浏览器收到的内容：
``` js
{"name":"avenwu","a":{"b":{"c":123}},"c.d.e":"abc"}
```

#### 本地/远程资源
```` txt
www.example.com/path1 resMerge:///User/xxx/test.json
www.example.com/path2 resMerge://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 resMerge://temp/blank.json
````


## 注意事项：响应大小限制
为了保障处理性能，`resMerge` 默认对响应内容大小有限制。
- **限制说明**：自动合并处理仅适用于响应体小于 2MB 的请求。超过此大小的响应将被跳过。
- **如何覆盖**：如果您确认需要处理更大的响应（例如下载文件或处理大数据接口），可以通过在匹配的规则中添加以下指令来显式启用：

``` txt
pattern enable://resMergeBigData

# 或
www.example.com/path1 resMerge:///User/xxx/test.json lineProps://enableBigData
```
启用后，reqMerge 将尝试处理更大体积的响应，请注意这可能增加内存消耗和处理时间。

## 关联协议 {#related}

1. 在响应内容前注入内容（`Prepend To Body`）：[resPrepend](./resPrepend)
2. 在响应内容前注入 HTML 内容（`Prepend HTML To Body`，响应类型必须为 `text/html`）：[htmlPrepend](./htmlPrepend)
3. 在响应内容前注入 CSS 内容（`Prepend CSS To Body`，响应类型必须为 `text/html` 或 `text/css`）：[cssPrepend](./cssPrepend)
4. 在响应内容前注入 JS 内容（`Prepend JS To Body`，响应类型必须为 `text/html`、`text/css` 或 `application/javascript`）：[jsPrepend](./jsPrepend)
5. 替换响应内容（`Replace Body`）：[resBody](./resBody)
6. 用 HTML 内容替换响应内容（`Replace Body`，响应类型必须为 `text/html`）：[htmlBody](./htmlBody)
7. 用 CSS 内容替换响应内容（`Replace Body`，响应类型必须为 `text/html` 或 `text/css`）：[cssBody](./cssBody)
8. 用 JS 内容替换响应内容（`Replace Body`，响应类型必须为 `text/html`、`text/css` 或 `application/javascript`）：[jsBody](./jsBody)
9. 在响应内容后追加内容（`Append To Body`）：[resAppend](./resAppend)
10. 在响应内容后追加 HTML 内容（`Append HTML To Body`，响应类型必须为 `text/html`）：[htmlAppend](./htmlAppend)
11. 在响应内容后追加 CSS 内容（`Append CSS To Body`，响应类型必须为 `text/html` 或 `text/css`）：[cssAppend](./cssAppend)
12. 在响应内容后追加 JS 内容（`Append JS To Body`，响应类型必须为 `text/html`、`text/css` 或 `application/javascript`）：[jsAppend](./jsAppend)
13. 使用关键字或正则表达式替换响应内容（`Modify Body Text`）：[resReplace](./resReplace)
14. 覆盖响应内容中的 JSON/Form 对象（`Modify Form/JSON`）：[resMerge](./resMerge)
15. 删除响应内容中的 JSON/Form 对象属性（`Delete Form/JSON`）：[delete://resBody.xxx](./delete)


