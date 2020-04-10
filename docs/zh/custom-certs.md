# 自定义证书

 whistle会自动生成根证书，并根据根证书对每个请求动态生成https证书，如果需要用自定义的证书，甚至根证书，可以有两种方式(只支持 `.crt` 格式的证书)：

  1. 把普通证书对 (如：`test.crt` 和 `test.key`、`test2.crt` 和 `test2.key` 等等) 或根证书 (名字必须为 `root.crt` 和 `root.key`)，放在系统的某个目录，如 `/data/ssl`，并在启动时添加启动参数 `w2 start -z /data/ssl` ，whistle会自动加里面的证书
  2. (v1.14.8及以上版本支持) 把上述证书或根证书放在固定目录 `~/.WhistleAppData/custom_certs/`里面，whistle会自动加里面的证书
    > 优先级 `-z dir` > `~/.WhistleAppData/custom_certs/` > 自动生成的证书

### 查看自定义证书
顶部菜单 `HTTPS` > `View custom certs info`。

### 删除过期证书
在上述目录删除或替换过期的证书后，需要重启下 whistle 才能生效。

# 自定义客户端证书
有些网站需要客户端和服务端双向验证，可以在 whistle 里面配置:

``` txt

# cert 或 pem 格式证书
pattern @clientCert://key=keypath.key&cert=certpath.crt
# 或
pattern @clientCert://key=keypath.pem&cert=certpath.pem

# pfx 或 p12 格式证书
pattern @clientCert://pwd=passphrase&cert=pfxfilepagh.pfx
# 或
pattern @clientCert://pwd=passphrase&cert=p2filepath.p12
```
> pattern 详见 [pattern](./pattern.html)

一般浏览器到 whistle 请求的客户端证书可以忽略，如果某些自定义客户端强制要带上客户端证书，可以采用：

``` txt
ke.qq.com enable://clientCert
# 即: 域名 enable://clientCert
```

