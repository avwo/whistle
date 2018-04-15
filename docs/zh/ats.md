# 关于iOS的ATS
自iOS9、OS X 10.11开始，苹果在APP中用到的WebView新增App Transport Security（简称ATS）特性，默认情况下苹果自带的WebView无法加载非HTTPs的网页，且HTTPs证书的密钥长度不能小于2048位，当前开发人员可以在 `Info.plist` 中添加 `NSAppTransportSecurity` 字典并且将 `NSAllowsArbitraryLoads` 设置为 `YES` 来禁用 ATS，但后续苹果很可能禁止APP绕过ATS。

推出whistle的时候，Node稳定版本还是 `v0.10.x`，whistle使用的生成根证书的第三方模块在 `v0.10.x` 上生成2048位的密钥的速度很慢，折中采用了生成1024位的密钥，导致后续苹果强制开启ATS后，原有的whistle根证书将在iOS上失效，解决该问题可以按以下步骤：

1. 确保机器上的Node版本在 `v6.0.0` 以上(执行 `node -v` 查看当前Node版本)，推荐使用最新的稳定版本(LTS及新特性版本都可以，可以通过[官网下载安装](https://nodejs.org/))。
2. 把whistle升级到 `v1.3.5` 或更高版本(参考： [更新whistle](update.html)) ，第一次启动时加上 `-A`： `w2 start -A` 或 `w2 restart -A`，这样会重新生成一个2048位的根证书(如果该机器是第一次安装使用whistle，则无需加该选项 `-A`)。
3. 最后，需要重新[下载安装根证书](webui/https.html)


*Note：只需在第一次启动或重启的时候加 `-A` 生成新的根证书(即：`w2 start -A` 或 `w2 restart -A`)，后续的启动后重启都不需要加该选项了，可以跟原来一样直接：`w2 start` 或 `w2 restart` (加 `-A` 和不加的效果一样)*
