# 配置开机重启whistle
由于whistle是用Node实现的一个命令行程序，相对于客户端程序安装过程多了[安装node、配置代理](https://avwo.github.io/whistle/install.html)这两个步骤及通过命令行启动服务器，而不是点击桌面图标启动，具体参见[安装启动whistle](https://avwo.github.io/whistle/install.html)；命令行程序也有一个好处：可以部署在服务器上。事实上，通过把启动脚本写在脚本文件里面(如bat文件)并存在桌面也可以实现双击图标启动whistle，且将该脚本文件放在开机启动项可以实现开机自动重启，具体根据不同的操作系统采取不同的策略：

1. [Windows](windows)
2. [Mac](mac)
3. [Linux](linux)

PS: 后续whistle可能出客户端版本。