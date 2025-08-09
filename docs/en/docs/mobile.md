# 移动端抓包

移动端（含手机/平板）抓包调试需完成以下配置：
1. 安装根证书（HTTPS 抓包必需）
2. 设置系统代理

## 安装根证书（HTTPS 抓包必需）

#### 下载根证书：

1. 点击 Whistle 界面顶部点击 HTTPS 按钮，弹出 HTTPS 设置对话框
   
   <img width="320" alt="HTTPS Settings" src="/img/https-settings.png" />
2. 使用手机相机扫描对话框中的二维码 → 点击弹出的链接（下载失败尝试切换其它二维码，直到扫描下载成功为止）
   
   <img width="320" alt="Scan qrcode" src="/img/https-qrcode.png" />

   > 如果 Android 自带浏览器无法下载，可尝试使用 Chrome 浏览器动下载地址：http://[电脑IP]:[Whistle端口]/cgi-bin/rootca，或通过 PC 下载后传输到手机
   > 
   > 如果所有二维码都无法下载：
   > - 检查设备与 Whistle 主机是否在同一局域网
   > - 确认防火墙未拦截代理端口
3. 下载成功后记录二维码地址的 IP 和端口供下面设置系统代理用，并按下面的方法安装和信任根证书

#### 安装根信任证书：

**iOS**

1. 安装描述文件
   - 前往：设置 → 通用 → VPN与设备管理
   - 找到"已下载的描述文件"并安装
2. 启用完全信任（此步骤必不可少）
   - 前往：设置 → 通用 → 关于本机 → 证书信任设置
   - 开启对 Whistle 根证书的完全信任

    <img width="320" alt="证书信任设置" src="/img/https-trust.png" />

**Android**

1. 前往：设置 → 安全 → 加密与凭据 → 安装证书 → CA证书
2. 选择下载的证书文件
3. 输入锁屏密码确认
4. 为证书命名（如 "Whistle"）

> **版本差异说明：**
> 
> Android 12+：需在「更多安全设置」中操作
> 
> 华为EMUI：需先关闭"纯净模式"
> 
> 其他品牌：路径可能略有不同
> 

## 设置系统代理

1. 进入WiFi设置
   - 前往：设置 → Wi-Fi（无线局域网）
   - 点击当前连接网络旁的图标（Android 可能需要长按 Wi-Fi 名称）
2. 配置手动代理
   - 代理类型选择"手动"
   - 服务器：填写上面成功下载证书二维码的 IP
   - 端口：填写面成功下载证书二维码的端口（Whistle 默认端口为 `8899`）
   - 保存设置

<img width="320" alt="设置代理" src="/img/proxy-settings.jpg" />


## 安装根证书和设置代理成功标志

1. 手机访问网页正常
2. Whistle 能捕获 HTTPS 请求
3. 无安全警告提示

## 常见问题

1. 证书不受信任
   - 检查是否完成"完全信任"设置（iOS）
   - 确认证书安装位置正确（Android）
2. 代理不生效
   - 打开看 Whistle 界面右上角 Online 对话框查看 IP 和端口是否有变更
   - 不确定哪个 IP 可用，可以一个个试看看
3. 特定App无法抓包
   - 检查App是否使用自定义证书
   - 尝试在AndroidManifest.xml中添加网络配置，详见：[https://developer.android.com/training/articles/security-config#base-config](https://developer.android.com/training/articles/security-config#base-config)
