# pathReplace
提供类似 JavaScript 的 String.replace() 方法的能力，通过正则表达式或字符串匹配来动态修改 URL 的路径(`path`) 部分。

> URL 结构：
> ``` txt
>   https://www.example.com:8080/path/to/resource?query=string
>   \___/   \_____________/\____/\____________________________/
>     |           |         |                 |             
>   协议(scheme)  主机(host) 端口(path)       路径(path) 
> ```
>
> **路径部分**指 `path/to/resource?query=string` 即不包含开头的  `/`

## 规则语法
``` txt
pattern pathReplace://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作数据对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
www.example.com/path pathReplace://123=abc
```
访问 `https://www.example.com/path/123?test=123&value=123` 服务器收到的 URL：`https://www.example.com/path/abc?test=abc&value=abc`

#### 替换多个

```` txt
``` test.json
test: name
123: abc
```
www.example.com/path2 pathReplace://{test.json}
````
访问 `https://www.example.com/path2/123?test=123&value=123` 服务器收到的 URL：`https://www.example.com/path2/abc?name=abc&value=abc`

#### 本地/远程资源

```` txt
www.example.com/path1 pathReplace:///User/xxx/test.json
www.example.com/path2 pathReplace://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 pathReplace://temp/blank.json
````

## 注意事项
以下配置旨在删除指定路径片段：
```txt
www.example.com/api/ pathReplace://(/api/=/)
```

**期望效果：**  
将 `https://www.example.com/api/xxx` 中的 `/api/` 替换为 `/`，得到 `https://www.example.com/xxx`

**实际问题：**  
Whistle 会将 `/api/` 识别为正则表达式而非普通字符串，导致替换后产生多余斜杠：  
`https://www.example.com///xxx`

> 即使将 `/api/` 视为字符串，它也无法匹配 `api/xxx/...`，pathReplace 匹配的路径不包含开头的  `/`

**解决方案：**  

``` txt
www.example.com pathReplace://(/^api//=)
```
> Whistle 规则里面的正则不需要对 `/` 进行转义
>
> 新版 Whistle 也可以用 `delete://pathname.0` 删除上面 URL 的 `api/` 路径片段，详见 [delete://pathname.xxx](./delete)

## 关联协议
1. 修改请求参数：[urlParams](./urlParams)
2. 删除路径：[delete://pathname.xxx](./delete)
3. 删除请求参数：[delete://urlParams.xxx](./delete)

