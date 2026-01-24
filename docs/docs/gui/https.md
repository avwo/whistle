# HTTPS 对话框

HTTPS 设置对话框用于配置 HTTPS 抓包和证书管理，界面如下：

<img src="/img/https.png" alt="HTTPS 对话框" width="380" />

| 功能/选项                                 | 说明                                 | 备注                                         |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| **Download RootCA**                       | 下载 Whistle 根证书到本地            | 首次安装或证书过期时使用                          |
| **rootCA.xxx 选择框**                     | 切换证书格式：`.crt`、`.cer`、`.pem` | 当某种格式证书安装失败时，尝试其他格式            |
| **二维码地址选择框**                      | 切换移动端证书下载地址               | 方便手机扫码下载证书，详见[移动端抓包](../mobile) |
| **Enable HTTPS (Capture Tunnel Traffic)** | 开启 HTTPS 流量解密（需安装根证书）  | 也可以通过规则控制： `enable://https` `disable://https` |
| **Enable HTTP/2**                         | 启用 HTTP/2 协议支持（默认开启）     | 也可以通过规则控制： `enable://http2` `disable://http2` |
| **Custom Certs Settings**                 | 查看、上传或删除用户自定义证书    | 不支持直接上传根证书，如果需要自定义根证书，需放到自定义证书目录并重启 Whistle 才能生效 |


## Custom Certs Settings {#custom-certs}
点击 **Custom Certs Settings** 按钮，即可打开自定义证书管理面板。在此面板中，您可以上传自己正式业务使用的服务器证书（常用于解决 SSL Pinning 检测问题）。

证书文件必须**成对上传**，即每次上传需包含一个密钥文件和一个证书文件。支持的文件配对格式如下（实际文件名可自定义，但扩展名需符合要求）：

1. `.key` 文件 + `.cer` 文件  
2. `.key` 文件 + `.crt` 文件  
3. `.key` 文件 + `.pem` 文件

例如：
- `server.key` 与 `server.cer`
- `mycert.key` 与 `mycert.crt`
- `cert.key` 与 `cert.pem`

请确保每一对证书与密钥文件在内容上相匹配，否则可能导致证书配置失败。
