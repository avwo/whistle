# tlsOptions
配置 HTTPS/TLS 连接的安全参数，用于建立加密通信通道和服务器身份验证。
> 仅 Whistle 最新版本（≥ v2.9.101）支持此功能

## 规则语法
``` txt
pattern tlsOptions://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作数据对象或加密算法套件名称，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

tlsOptions 操作对象结构：
1. 加密算法套件名称
    ``` txt
    ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384
    ```
    > 多个套件用 `:` 分隔
2. `tls.connect(options)` 参数
    ``` js
    {
      ciphers: string
      secureProtocol: string
      maxVersion: string
      minVersion: string
      honorCipherOrder: boolean
      ca: string
      allowPartialTrustChain: string
      sessionIdContext: string
      sigalgs: string
      dhparam: string
      ecdhCurve: string
      secureOptions: number
      sessionTimeout: number
      base: 证书公共路径
      passphrase: pfx 类型证书的密钥内容
      pfx: 证书内容或本地u家
    }
    ```
    > 详见：https://nodejs.org/docs/latest/api/tls.html#tlscreatesecurecontextoptions

## 自定义加密套件
``` txt
www.example.com/path tlsOptions://ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384
```
> 一般手动设置，用途参考：https://github.com/avwo/whistle/issues/963

## 配置客户端证书
为双向认证(mTLS)请求指定客户端证书。

1. cert 格式证书
    ``` txt
    www.exaple.com/path tlsOptions://key=/User/xxx/test.key&cert=/User/xxx/test.crt
    ```
2. pem 格式证书
    ``` txt
    www.exaple.com/path tlsOptions://key=E:\test.pem&cert=E:\test.pem
    ```
3. pfx 格式证书
    ``` txt
    www.exaple.com/path tlsOptions://passphrase=123456&pfx=/User/xxx/test.pfx
    ```
4. p12 格式证书
    ``` txt
   www.exaple.com/path tlsOptions://passphrase=123456&pfx=E:/test.p12
    ```
> Windows 路径可混用 `/` 和 `\`

## 内嵌证书内容
```` txt
# 其它格式的证书同理
``` test.json
{
  key: '----xxx----- ... ----xxx-----',
  cert: '----yyy----- ... ----yyy-----'
}

www.exaple.com/path tlsOptions://{test.json}
````

## 本地/远程资源

```` txt
www.example.com/path1 tlsOptions:///User/xxx/test.json
www.example.com/path2 tlsOptions://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 tlsOptions://temp/blank.json
````
