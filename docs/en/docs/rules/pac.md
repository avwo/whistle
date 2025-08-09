# pac

PAC（Proxy Auto-Config）是一种通过 JavaScript 脚本自动决定请求代理规则的机制，允许您基于 URL、域名、IP 等条件动态选择代理或直连。

## 规则语法
``` txt
pattern pac://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
```` txt
# 内嵌 PAC 脚本
``` test.pac
function FindProxyForURL(url, host) {
  // ...
}
```
www.example.com/path pac://{test.pac}

# Values
www.example.com/path1 pac://{test2.pac}

# 本地文件
www.example.com/path3 pac:///User/xxx/test.pac

# 远程 PAC 脚本
* pac://https://raw.githubusercontent.com/imweb/node-pac/master/test/scripts/normal.pac
````

## 高级用法
将请求代理到上游代理后，默认情况下上游代理会根据请求的域名通过 DNS 获取服务器 IP 再继续请求，如果想让上游代理根据指定 IP及端口继续请求，可以这么处理：
``` txt
www.example.com pac://https://xxx/path/normal.pac 1.1.1.1 enable://proxyHost
www.example.com pac:///User/xxx/test.pac 1.1.1.1:8080 enable://proxyHost
````
> `1.1.1.1` 等价于 `host://1.1.1.1`
