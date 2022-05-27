# 设置代理
打开 系统设置 > 无线网络 > 点击你要设置代理的 WiFi > 高级设置 > 手动 > 输入 Whistle 的 `IP` 和 `PORT`
> `IP` 和 `PORT` 可以从 Whistle 管理界面右上角的 Online 过去，如果不确定哪个可以用，每个都试一下，如果设置完所有 IP 还不能访问，看看是不是防火墙问题：https://github.com/avwo/whistle/issues/78

<img width="600" alt="image" src="https://user-images.githubusercontent.com/11450939/170707675-fd04c02c-eea2-4631-9264-fdb078d4b7ad.png">

<img width="800" alt="image" src="https://user-images.githubusercontent.com/11450939/170612428-b2a82a4d-acd8-43a5-9f51-3cedabd73864.png">

# 安装根证书
1. **必须先按上面方法设置好代理**
2. 下载 Chrome 浏览器后在 Chrome 地址栏输入：**rootca.pro** 下载安装证书
    > 如果安装失败可以尝试输入：**rootca.pro/cer** 下载安装 cer 证书，其它情况参考：https://github.com/avwo/whistle/issues/79


