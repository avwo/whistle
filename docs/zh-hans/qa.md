# 常见问题

问题或建议请提 [issue](https://github.com/avwo/whistle/issues/new)

## Q：抓包列表中出现 `captureError` 的原因？
1. 发出请求的客户端没有安装根证书，安装方法参考：
   - PC 端：[安装根证书](/zh-hans/installation)
   - 移动端：[安装根证书](/zh-hans/mobile)
2. `ssl pinning` 问题
   - 对该域名的 HTTPS 请求不解密：`域名 disable://capture` 或只针对指定客户端的请求 `域名 disable://capture includeFilter://reqH.user-agent=/xiaomi/i`
   - 使用可以规避 `ssl pinning` 的系统或模拟器运行客户端
   - 寻找其它规避措施 https://blog.csdn.net/chiehfeng/article/details/134033846
3. 系统信任的根证书默认对 Firefox 无效，需要单独为 Firefox 配置证书
  > **方案1：为 Firefox 单独安装证书**
  >
  > 在 Firefox 设置中：
  > - 进入 选项 > 隐私与安全 > 证书
  > - 点击 "查看证书" → "证书机构"
  > - 导入下载的 .cer 文件
  > - 勾选 "信任此CA" 所有选项
  >
  > **方案2：强制 Firefox 使用系统证书（推荐）**
  >
  > - 搜索首选项：security.enterprise_roots.enabled
  > - 将值改为 true
  > - 重启浏览器生效

## Q：如何查看 Whistle 运行过程中的日志？
1. 界面 Network > Tools > Server 查看错误日志
2. 导致进程 Crash 的异常日志文件：`~/.WhistleAppData/whistle.log`
 
## Q：如何同时启多个 Whistle 实例？
多实例运行时需满足：
- 每个实例使用独立目录
- 配置不同监听端口
``` sh
w2 start
2 start -p 8100 -S storageName2
```

## Q：普通请求如何不通过代理直接访问 Whistle 不被当成内部请求？
Whistle 默认会将所有发往代理端口（如 127.0.0.1:8899）的请求视为内部管理请求，可以使用 `/-/` 路径前缀绕过内部请求识别，如：
1. `http://127.0.0.1:8899/-/xxx`：Whistle 自动转成普通请求 `http://127.0.0.1:8899/xxx`
2. 通过配置规则将该请求转发到目标 URL：
    ``` txt
    http://127.0.0.1:8899/xxx https://www.test.com/xxx
    ```

## Q：Rules 如何支持多选？

在 Rules 界面中打开 Settings 对话框，勾选 `Use multiple rules` 即可

## Q：如何根据请求内容匹配规则？

利用过滤器：
- [includeFilter](/zh-hans/rules/includeFilter)
- [excludeFilter](/zh-hans/rules/excludeFilter)

## Q：iOS 安装完根证书还是无法打开 HTTPS 页面的可能原因？

检查是否完成"完全信任"设置：设置 → 通用 → 关于本机 → 证书信任设置

## Q：Android 安装完根证书还是无法打开 HTTPS 页面的可能原因？
1. `ssl pinning` 问题
   - 对该域名的 HTTPS 请求不解密：`域名 disable://capture` 或只针对指定客户端的请求 `域名 disable://capture includeFilter://reqH.user-agent=/xiaomi/i`
   - 使用可以规避 `ssl pinning` 的系统或模拟器运行客户端
   - 寻找其它规避措施 https://blog.csdn.net/chiehfeng/article/details/134033846
2. 如果是自己公司的 APP，可以参考[Android 开发文档](https://developer.android.com/training/articles/security-config#base-config) 开启信任用户自定义根证书

## Q：如何对 Whistle 转发的请求设置用户名和密码？
1. Whistle 内部请求认证：`w2 start -n 用户名 -w 密码` 或自己[开发插件](/zh-hans/extensions/dev)，防止未授权操作规则和配置
2. 代理请求的权限控制：需要借助插件 [whistle.proxyauth](https://github.com/whistle-plugins/whistle.proxyauth) 或自己[开发插件](/zh-hans/extensions/dev)

## Q：如何添加自定义证书？

进入证书管理页面
1. 点击顶部菜单栏 HTTPS > View Custom Certs > Upload
2. 上传证书文件
     - 证书文件：必须使用 `.crt` 后缀
     - 私钥文件：必须使用 `.key` 后缀
     > 文件名要求：
     >
     > 普通域名证书
     >
     > `example.com.crt` ↔ `example.com.key`
     > 
     > 根证书（必须严格命名）
     > 
     > `root.crt` ↔ `root.key`
