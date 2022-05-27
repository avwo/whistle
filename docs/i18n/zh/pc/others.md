# 设置代理
Linux: Settings > Network > VPN > Network Proxy > Manual

<img width="800" alt="image" src="https://user-images.githubusercontent.com/11450939/170710577-3c289f69-29bd-42b1-8b77-fb2bbcfacf86.png">

# 安装根证书
1. 下载根证书，按上述方法设置好代理，在浏览器输入 **rootca.pro** 下载根证书到本地
2. Linux 安装较为复杂，根据发行版本的不同，安装位置可能略有变化，以下是一些常用发行版的安装方法：
    - ArchLinux: 将下载的 rootCA.crt 复制到 /etc/ca-certificates/trust-source/anchors/ 然后执行 trust extract-compat
    - Fedora: 将下载的 rootCA.crt 复制到 /etc/pki/ca-trust/source/anchors 然后执行 trust extract-compat
    - Ubuntu/Debian: 将下载的 rootCA.crt 复制到 /usr/share/ca-certificates/ 然后执行 echo "rootCA.crt" >> /etc/ca-certificates.conf && update-ca-certificates
    - 如果成功安装，命令 trust list | grep -i whistle 输出不为空。
