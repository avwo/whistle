# 设置代理
打开 系统设置 > 无线局域网 > 点击 WiFi 右边图标 > 点击底部的配置代理项 > 选择手动代理 > 输入 Whistle 的 `IP` 和 `PORT`
> `IP` 和 `PORT` 可以从 Whistle 管理界面右上角的 Online 过去，如果不确定哪个可以用，每个都试一下，如果设置完所有 IP 还不能访问，看看是不是防火墙问题：https://github.com/avwo/whistle/issues/78

<img width="800" alt="image" src="https://user-images.githubusercontent.com/11450939/170613061-82703fbd-737a-4b11-8662-a4b0ecef9850.png">

<img width="800" alt="image" src="https://user-images.githubusercontent.com/11450939/170612428-b2a82a4d-acd8-43a5-9f51-3cedabd73864.png">

# 安装根证书
1. **必须先按上面方法设置好代理**
2. 打开 iOS 内置浏览器 Safari 并在地址栏输入：**rootca.pro** 下载证书并点击允许
3. 设置 > 通用 > VPN与设置管理 > 点击已下载的描述文件 > 点击右上角安装 > 输入锁屏密码 > 再次点击安装
4. 设置 > 通用 > 关于本机 > 滚动到底部打开证书信任设置 > 信任证书

<img width="600" alt="image" src="https://user-images.githubusercontent.com/11450939/170624035-4ba755ab-5f86-4caf-b28b-3bcde7f6e996.png">

<img width="600" alt="image" src="https://user-images.githubusercontent.com/11450939/170624662-fe5190c7-f068-4c45-aa01-d22220266426.png">

