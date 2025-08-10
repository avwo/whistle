# sniCallback
通过插件机制动态定制 HTTPS 请求的 TLS 证书。

## 规则语法
``` txt
pattern sniCallback://plugin-name(sniValue) [filters...]
```
> `(sniValue)` 可选，在插件 Hook 可以通过 `req.originalReq.sniValue` 获取

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| plugin-name(sniValue)   | 插件名称 + 可选参数 |    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
wwww.example.com sniCallback://test
wwww.example.com sniCallback://test-sni(abc)
```

在插件中通过以下属性访问 SNI 信息：
``` js
exports.auth = (req) => {
  const { sniValue, servername } = req.originalReq; // 获取配置参数及 servername

  return {
    cert: /* 证书内容 */,
    key:  /* 私钥内容 */
  }
};
```

具体用法参考：[插件开发文档](../extensions/dev.md#snicallback)
