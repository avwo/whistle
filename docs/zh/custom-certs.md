# 自定义证书

 whistle会自动生成根证书，并根据根证书对每个请求动态生成https证书，如果需要用自定义的证书，甚至根证书，可以有三种方式(只支持 `.crt` 格式的证书)：

  1. 把普通证书对 (如：`test.crt` 和 `test.key`、`test2.crt` 和 `test2.key` 等等) 或根证书 (名字必须为 `root.crt` 和 `root.key`)，放在系统的某个目录，如 `/data/ssl`，并在启动时添加启动参数 `w2 start -z /data/ssl` ，whistle会自动加里面的证书
  2. 把上述证书或根证书放在固定目录 `~/.WhistleAppData/custom_certs/`里面，whistle会自动加里面的证书
      > 优先级 `-z dir` > `~/.WhistleAppData/custom_certs/` > 自动生成的证书
  3. 普通证书对也可以通过抓包界面上方 `HTTPS` 菜单按钮 > `View all custom certificates` 直接上传

### 查看或删除自定义证书
顶部菜单 `HTTPS` > `View all custom certificates`。

# 自定义客户端证书
有些网站需要客户端和服务端双向验证，可以在 whistle 里面配置:

``` txt
# cert 或 pem 格式证书
pattern @clientCert://key=keypath.key&cert=certpath.crt
# 或
pattern @clientCert://key=keypath.pem&cert=certpath.pem

# pfx 或 p12 格式证书
pattern @clientCert://pwd=passphrase&pfx=pfxfilepagh.pfx
# 或
pattern @clientCert://pwd=passphrase&pfx=p2filepath.p12
```
> pattern 详见 [pattern](./pattern.html)

一般浏览器到 whistle 请求的客户端证书可以忽略，如果某些自定义客户端强制要带上客户端证书，可以采用：

``` txt
ke.qq.com enable://clientCert
# 即: 域名 enable://clientCert
```
# 生成普通证书或根证书
路径：`Network / 右边 Tools > Toolbox > 滚动到下面`

1. 生成普通证书：输入域名（如：`www.test.com`）点击下载
2. 生成根证书：输入 `root:commonName=Whistle&organizationName=DevTools&ou=Software&countryName=CN&st=GD&localityName=SZ`
   > 名称要采用 latin1 字符，如果存在特殊字符可以跟 url 参数一样用 `encodeURIComponent` 转义

   <img width="260" alt="image" src="https://user-images.githubusercontent.com/11450939/203893368-210ff8f8-0826-4712-87a4-a3bd3ce32715.png">

   > commonName、organizationName、ou 分别表示上诉的公用名、组织、组织单位，countryName、st、localityName 分别表示所在国家、省、市即可

<img width="500" alt="image" src="https://user-images.githubusercontent.com/11450939/203893050-1eb39659-5239-4be3-bdec-488acc64adb8.png">

