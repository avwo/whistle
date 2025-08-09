# cipher
当 TLS 版本与加密算法不匹配导致 Node.js 请求异常时，自动启用自定义的兜底加密算法套件，确保 HTTPS 连接正常建立。

## 规则语法
``` txt
pattern cipher://value [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 加密算法（见下方列表）<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

**部分可选加密算法列表**
- `ECDHE-ECDSA-AES256-GCM-SHA384`
- `NULL-SHA256`, `AES128-SHA256`, 
- `AES256-SHA256`
- `AES128-GCM-SHA256`
- `AES256-GCM-SHA384`
- `DH-RSA-AES128-SHA256`
- `DH-RSA-AES256-SHA256`
- `DH-RSA-AES128-GCM-SHA256`
- `DH-RSA-AES256-GCM-SHA384`
- `DH-DSS-AES128-SHA256`
- `DH-DSS-AES256-SHA256`
- `DH-DSS-AES128-GCM-SHA256`
- `DH-DSS-AES256-GCM-SHA384`
- `DHE-RSA-AES128-SHA256`
- `DHE-RSA-AES256-SHA256`
- `DHE-RSA-AES128-GCM-SHA256`
- `DHE-RSA-AES256-GCM-SHA384`
- `DHE-DSS-AES128-SHA256`
- `DHE-DSS-AES256-SHA256`
- `DHE-DSS-AES128-GCM-SHA256`
- `DHE-DSS-AES256-GCM-SHA384`
- `ECDHE-RSA-AES128-SHA256`
- `ECDHE-RSA-AES256-SHA384`
- `ECDHE-RSA-AES128-GCM-SHA256`
- `ECDHE-RSA-AES256-GCM-SHA384`
- `ECDHE-ECDSA-AES128-SHA256`
- `ECDHE-ECDSA-AES256-SHA384`
- `ECDHE-ECDSA-AES128-GCM-SHA256`
- `ECDHE-ECDSA-AES256-GCM-SHA384`
- `ADH-AES128-SHA256`
- `ADH-AES256-SHA256`
- `ADH-AES128-GCM-SHA256`
- `ADH-AES256-GCM-SHA384`
- `AES128-CCM`
- `AES256-CCM`
- `DHE-RSA-AES128-CCM`
- `DHE-RSA-AES256-CCM`
- `AES128-CCM8`
- `AES256-CCM8`
- `DHE-RSA-AES128-CCM8`
- `DHE-RSA-AES256-CCM8`
- `ECDHE-ECDSA-AES128-CCM`
- `ECDHE-ECDSA-AES256-CCM`
- `ECDHE-ECDSA-AES128-CCM8`
- `ECDHE-ECDSA-AES256-CCM8`

## 配置示例
``` txt
www.example.com cipher://DH-RSA-AES256-GCM-SHA384
```

用途参考：https://github.com/avwo/whistle/issues/963
