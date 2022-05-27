# 设置 Firefox 代理
地址栏输入访问 about:preferences，找到 Network Proxy，选择 手动代理配置(Manual proxy configuration)，输入代理服务器地址、端口，保存。

<img width="600" alt="image" src="https://user-images.githubusercontent.com/11450939/170636835-cba3b453-06cd-4769-a68e-89cdf582008f.png">

# 安装 Firefox 根证书
1. 下载根证书，按上述方法设置好代理，在浏览器输入 **rootca.pro** 下载根证书到本地
2. 菜单 > 首选项 > 高级 > 证书 > 证书机构 > 导入 -> 选中所有checkbox -> 确定
    <img width="600" alt="image" src="https://user-images.githubusercontent.com/11450939/170637122-b0e4a0ac-6659-469c-aa30-83986fa669b3.png">

