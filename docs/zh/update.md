# 更新whistle

> 为了能使用whistle的所有功能，请记得将whistle升级到最新版本，版本变更点请查看：[CHANGELOG](https://github.com/avwo/whistle/blob/master/CHANGELOG.md)

执行命令更新whistle(Mac或Linux用户，如果安装过程出现异常，请在命令行前面加`sudo`，如: `sudo npm install -g whistle`)：

```sh
# 以下命令都可以更新whistle
$ npm install -g whistle
# or
$ npm install -g whistle --registry=https://registry.npm.taobao.org
```

更新成功后，重启 `whistle` ：

```sh
$ w2 restart
```
> 重启后看下命令行输出的版本是不是当前安装的版本，如果不是可能是更新了Node导致PATH路径更改，`which w2`(windows可以用git bash查看)路径，把该路径的 `w2` 文件删除
