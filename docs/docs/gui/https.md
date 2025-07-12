# HTTPS 对话框

HTTPS 设置对话框用于配置 HTTPS 抓包和证书管理，界面如下：

<img src="/img/https.png" alt="HTTPS 对话框" width="1000" />

| 功能/选项                                 | 说明                                 | 备注                                         |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| **Download RootCA**                       | 下载 Whistle 根证书到本地            | 首次安装或证书过期时使用                          |
| **rootCA.xxx 选择框**                     | 切换证书格式：`.crt`、`.cer`、`.pem` | 当某种格式证书安装失败时，尝试其他格式            |
| **二维码地址选择框**                      | 切换移动端证书下载地址               | 方便手机扫码下载证书，详见[移动端抓包](../mobile) |
| **Enable HTTPS (Capture Tunnel Traffic)** | 开启 HTTPS 流量解密（需安装根证书）  | 也可以通过规则控制： `enable://https` `disable://https` |
| **Enable HTTP/2**                         | 启用 HTTP/2 协议支持（默认开启）     | 也可以通过规则控制： `enable://http2` `disable://http2` |


