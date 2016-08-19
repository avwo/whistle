# Windows上配置开机重启whistle
首先，下载Windows上的whistle脚步文件：[whistle.zip](https://github.com/avwo/whistle/raw/avenwu/assets/launcher/windows/whistle.zip)。

1. 解压whistle.zip获取whistle.bat的脚本文件，把该脚本文件拷贝一份到Windows的桌面，这样可以直接在Mac的桌面上刊登whistle的启动脚本，双击即可重启whistle(会先弹出一个命令行窗口，等3秒左右就会自动消失);

图片.gif

把桌面上的whistle.bat文件拖到桌面左下角的系统**开始菜单 --> 所有程序 --> 启动**目录下面，或者直接拷贝到系统目录`C:\Users\{yourAccount}\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`(可以直接在开始菜单或者文件管理器中的输入框输入`%appData%\Microsoft\Windows\Start Menu\Programs\Startup`快速定位到启动菜单目录)，这样就配置好了开机自动重启whistle。

图片.gif