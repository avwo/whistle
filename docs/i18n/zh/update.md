# 更新 Whistle
更新即重新安装并重启：
``` sh
npm i -g whistle && w2 restart
```
> 如果安装速度慢可以改用：`npm i -g whistle --registry=https://registry.npmmirror.com && w2 restart`

如果出现权限问题导致安装失败，可以改用：
``` sh
sudo npm i -g whistle
w2 restart
```

> 重启后看下命令行输出的版本是不是当前安装的版本，如果不是可能是更新了 Node 导致 PATH 路径更改（建议使用 [nvm](https://github.com/nvm-sh/nvm) 安装 Node），可以通过 `which w2` ( Windows 可以用 `git bash` 查看)路径，把该路径的 `w2` 文件删除，如果删除后找不到命令 `w2`，可以手动配下新 PATH 或者重新安装 Node。
