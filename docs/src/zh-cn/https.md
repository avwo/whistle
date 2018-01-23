# 安装证书

> 建议使用 `Node v6` 或以上版本，否则性能及在 Chrome 或 APP 上 [抓包 HTTPS 请求](https://avwo.github.io/whistle/webui/https.html) 会有问题。

> 如果出现 HTTPS 的问题 ([#44](https://github.com/avwo/whistle/issues/44))，升级 Node 到 `v6` 及以上版本，[更新 whistle](https://avwo.github.io/whistle/update.html) 到最新版本，通过 `w2 restart -A` (注意后面加 `-A`)启动生成新的更证书，再 [安装下根证书](https://avwo.github.io/whistle/webui/https.html) 即可。

> ** 在 iOS 上安装根证书时，需要先关闭[https 拦截](https://avwo.github.io/whistle/webui/https.html)，否则将显示安装失败。**

用来下载根证书、隐藏 `connect` 类型的请求、开启 Https 拦截功能。

![Https](https://avwo.github.io/whistle/img/https.gif)


### 安装根证书

如上图下载完根证书后点击 rootCA.crt 文件，弹出根证书安装对话框。

1. Windows：[http://program.most.gov.cn/cert/ca.htm](http://program.most.gov.cn/cert/ca.htm)
2. Mac：[mac 根证书怎么安装](http://zhidao.baidu.com/link?url=bQ8ZnDTxUIlqruQ56NYjBmwztWPlZtv9AIRazkoKeMsdpAq7mcwXOHQduRwmHV1M2hf143vqBxHzKb1tg0L03DJoj6XS109P8zBNF1E9uU_)

  Mac 安装证书后，需要手动信任证书，步骤如下：

  打开证书管理界面，找到带有 `whistle` 的字样的证书，如果有多个又不确定最新安装的是哪个，可以全部删除后重新安装

  ![img](https://ae01.alicdn.com/kf/HTB1ZtoBdYsTMeJjSszh763GCFXai.png)

  双击证书后，点击 `Trust` 左边展开选项，红色部分选择 `Always Trust` （总是信任），点击左上角关闭当前界面会要求输入密码；输入密码后可以看到证书上面红色的图标 `x` 不见了，到这一步说明完成证书安装。

  ![img](https://ae01.alicdn.com/kf/HTB1UWItd8USMeJjy1zk761WmpXaT.png)

3. **Firefox：菜单 > 首选项 > 高级 > 证书 > 证书机构 > 导入 -> 选中所有 checkbox -> 确定 **
4. Linux Chrome(Chromium): 参照这个[教程](http://www.richud.com/wiki/Ubuntu_chrome_browser_import_self_signed_certificate)
  * 地址栏输入 `chrome://chrome/settings/`
  * Show advanced Settings > Manage certificates > Authorities > Import
  * 选择证书后确认，重启浏览器
  * done

  ![ubuntu Chromium](https://cloud.githubusercontent.com/assets/16034964/20553721/9c3d1bda-b191-11e6-880f-9fd6976b95cc.png)
5. 手机

  **iOS**
  * 手机设置代理后，Safari 地址栏输入 `rootca.pro`，按提示安装证书（或者通过 `whistle` 控制台的二维码扫码安装，iOS 安装根证书需要到连接远程服务器进行验证，需要暂时把 **Https 拦截功能关掉 **）
  * iOS 10.3 之后需要手动信任自定义根证书，设置路径：`Settings > General > About > Certificate Trust Testings`

  [具体可以看这里](http://www.neglectedpotential.com/2017/04/trusting-custom-root-certificates-on-ios-10-3/)

  <img src="https://avwo.github.io/whistle/img/ios10.3_ca.PNG" width="320">

  **Android**
  * `whistle` 控制台二维码扫码安装，或者浏览器地址栏 `rootca.pro` 按提示安装
  * 部分浏览器不会自动识别 ca 证书，可以通过 Android Chrome 来完成安装

### 开启拦截 Https

图中的打开的对话框有两个 checkbox(** 在 iOS 安装根证书的时候，记得不要开启 ` Intercept HTTPS CONNECTs`，否则将无法安装成功 **)：

1. ` Hide HTTPS CONNECTs`：隐藏 `connect` 类型的请求
2. ` Intercept HTTPS CONNECTs`：开启 Https 拦截功能，只有勾上这个 checkbox 及装好根证书，whistle 才能看到 HTTPS、Websocket 的请求
3. 也可以通过配置来开启对部分请求的 Https 拦截功能

   www.test.com filter://intercept
   /alibaba-inc/ filter://intercept
   ​
4. 如果想过滤部分请求不启用 Https 拦截功能

  ```
  # 指定域名
  www.baidu.com  disable://intercept
  # 通过正则
  /baidu/ disable://intercept
  # 不支持通过路径的方式设置
  ```
