# w2 ca
安装系统根证书命令，目前只支持 Mac 和 Windows 系统。

# 用法
1. 安装本机默认 Whistle 实例的证书：
    ``` sh
    w2 ca
    ```
    > 安装本地运行的 Whistle 实例根证书（自动检测当前运行的默认实例，如果没有取默认取 `8899` 端口）
2. 安装指定端口的 Whistle 实例的证书：
    ``` sh
    w2 ca 8888
    ```
    > 安装本地 `8888` 端口的 Whistle 根证书
3. 安装运行在 `host` 和 `port` 的其它 Whistle 或 Nohost 的根证书：
    ``` sh
    w2 ca xxx.yyy.com:8080
    ```
    > 可以用来安装其它代理服务的证书
4. 下载指定 URL 的根证书并安装：
    ``` sh
    w2 ca url
    ```
    > 可以用来安装其它代理服务的证书
5. 下载指定本地路径的根证书并安装：
    ``` sh
    w2 ca filepath
    ```
    > 可以用来安装其它代理服务的证书

注意，Mac 系统需要指纹验证或输入开机密码：

<img alt="输入指纹" width="300" src="https://user-images.githubusercontent.com/11450939/168847123-e66845d0-6002-4f24-874f-b6943f7f376b.png">

如果上述命令系统不支持或安装失败，也可以：[手动安装](../manual/)
