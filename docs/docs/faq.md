# 常见问题

遇到问题或建议请提 [issue](https://github.com/avwo/whistle/issues/new)

## Q：抓包列表中出现 `captureError` 的原因？{#capture-error}
1. 发出请求的客户端没有安装根证书，安装方法参考：
   - PC 端：[安装根证书](./)
   - 移动端：[安装根证书](./mobile)
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

## Q：如何配置双向认证（mTLS）的 HTTPS 请求？

客户端证书设置参考：[@clientCert://](./rules/@)

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
- [includeFilter](./rules/includeFilter)
- [excludeFilter](./rules/excludeFilter)

## Q：iOS 安装完根证书还是无法打开 HTTPS 页面的可能原因？

检查是否完成"完全信任"设置：设置 → 通用 → 关于本机 → 证书信任设置

## Q：Android 安装完根证书还是无法打开 HTTPS 页面的可能原因？
1. `ssl pinning` 问题
   - 对该域名的 HTTPS 请求不解密：`域名 disable://capture` 或只针对指定客户端的请求 `域名 disable://capture includeFilter://reqH.user-agent=/xiaomi/i`
   - 使用可以规避 `ssl pinning` 的系统或模拟器运行客户端
   - 寻找其它规避措施 https://blog.csdn.net/chiehfeng/article/details/134033846
2. 如果是自己公司的 APP，可以参考[Android 开发文档](https://developer.android.com/training/articles/security-config#base-config) 开启信任用户自定义根证书

## Q：如何对 Whistle 转发的请求设置用户名和密码？
1. Whistle 内部请求认证：`w2 start -n 用户名 -w 密码` 或自己[开发插件](./extensions/dev)，防止未授权操作规则和配置
2. 代理请求的权限控制：需要借助插件 [whistle.proxyauth](https://github.com/whistle-plugins/whistle.proxyauth) 或自己[开发插件](./extensions/dev)

## Q：如何添加自定义证书？{#custom-certs}

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

## Q：版本更新问题{#update}
> 客户端版本只需重新下载最新版本并安装即可：https://github.com/avwo/whistle-client

**命令行版本更新：**
``` sh
npm i -g whistle && w2 restart
```
> 遇到安装慢或安装失败的问题可以尝试改镜像：`npm i -g whistle --registry=https://registry.npmmirror.com && w2 restart`
>
> 遇到权限问题可以加 `sudo`：
>
> ``` sh
> sudo npm i -g whistle
> w2 restart
> ```

重启后命令行显示的 Whistle 版本与当前安装版本不符，可能是 Node.js 版本更新导致 PATH 路径变更。

**解决方法：**
1. 确认版本是否有问题：
    ``` sh
    w2 -V
    ```
2. 找命令路径（所有系统通用）
    ``` sh
    which w2  # Linux/Mac
    where w2  # Windows
    ```
3. 清理冲突
    ``` sh
    # 删除旧版本（根据上一步找到的路径）
    rm -f /usr/local/bin/w2  # 示例路径

    # Windows示例（需管理员权限）
    del "C:\Program Files\nodejs\w2.cmd"
    ```
4. 恢复运行，操作完成后执行 `w2 -V` 查看版本是否更新：
   - 如果输出的版本还有问题重复上述操作
   - 如果命令 `w2` 找不到，请手动配置 PATH

## Q：如何过滤抓包界面中的频繁轮询请求？

频繁的轮询请求（如心跳检测、状态上报）会刷屏并干扰主要请求的分析。您可以通过以下步骤快速隐藏它们：

在抓包列表中找到任意一个轮询请求，右键菜单选择合适的过滤规则：
- `Settings / Exclude All Matching Hosts`：隐藏所有来自对应域名的请求（只对当前浏览器生效）
- `Settings / Exclude All Matching URLs`：隐藏与当前 URL 匹配的所有请求（不包含请求参数，且只对当前浏览器生效）

## Q：如何修改 Whistle 文档？

Whistle 文档源文件地址：https://github.com/avwo/whistle/tree/master/docs

本地启动文档服务：
``` sh
npm run docs:dev
```

## Q：如何反馈问题？

New issue：https://github.com/avwo/whistle/issues
