# 更新whistle
> 为了能使用whistle的所有功能，请记得将whistle升级到最新版本，版本变更点请查看：[CHANGELOG](https://github.com/avwo/whistle/blob/master/CHANGELOG.md#-)

执行命令更新whistle(Mac或Linux用户，如果安装过程出现异常，请在命令行前面加`sudo`，如: `sudo npm install -g whistle`)：

```sh
# 以下命令都可以更新whistle
$ npm install -g whistle
# or
$ npm update -g whistle
# or
$ npm install -g whistle --registry=https://registry.npm.taobao.org
# or
$ npm update -g whistle --registry=https://registry.npm.taobao.org
```

更新成功后，重启 `whistle` ：

```sh
$ w2 restart
```

*Mac或Linux用户，如果启动过程出现读写文件权限异常，可以使用 `sudo w2 restart` 启动*

极端情况下可能出现端口占用的情况，遇到这种情况手动kill掉 `node` 或 `iojs` 的进程即可。
