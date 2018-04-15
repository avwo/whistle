# 安装启动

安装启动 whistle，需要以下几个步骤：

1. 安装 Node
2. 安装 whistle
3. 启动 whistle


### 1. 安装 Node

whistle 支持 `v0.10.0` 以上版本的 Node，为获取更好的性能，推荐安装最新版本的 Node。

如果你的系统已经安装了 `v0.10.0` 以上版本的 Node，可以忽略此步骤，直接进入安装 whistle 的步骤，否则：

1. Windows 或 Mac 系统，访问 [https://nodejs.org/](https://nodejs.org/)，安装 **LTS** 版本的 Node，默认安装即可。
2. Linux 下推荐使用源码安装: 从 [Node 官网](https://nodejs.org/en/download/) 下载最新版的 **Source Code**(或者用 `wget` 命令下载)，解压文件 (`tar -xzvf node-vx.y.z.tar.gz`) 后进入解压后的根目录 (`node-vx.y.z`)，依次执行 `./configure`、`./make` 和 `./make install`。

安装完 Node 后，执行下面命令，查看当前 Node 版本

```sh
$ node -v
v4.4.0
```
如果能正常输出 Node 的版本号，表示 Node 已安装成功 (Windows 系统可能需要重新打开 cmd)。


### 2. 安装 whistle

Node 安装成功后，执行如下 npm 命令安装 whistle （**Mac 或 Linux 的非 root 用户需要在命令行前面加 `sudo`，如：`sudo npm install -g whistle`**）

```sh
$ npm install -g whistle
```


npm 默认镜像是在国外，有时候安装速度很慢或者出现安装不了的情况，如果无法安装或者安装很慢，可以使用 taobao 的镜像安装：

```sh
$ npm install cnpm -g --registry=https://registry.npm.taobao.org
$ cnpm install -g whistle

或者直接指定镜像安装：
$ npm install whistle -g --registry=https://registry.npm.taobao.org
```

whistle 安装完成后，执行命令 `whistle help` 或 `w2 help`，查看 whistle 的帮助信息

```sh
$ w2 help

Usage: w2 <command> [options]

  Commands:

    run       Start a front service
    start     Start a background service
    stop      Stop current background service
    restart   Restart current background service
    help      Display help information

  Options:

    -h, --help                                      output usage information
    -d, --debug                                     debug mode
    -l, --localUIHost [hostname]                    local ui host(local.whistlejs.com by default)
    -n, --username [username]                       login username
    -w, --password [password]                       login password
    -S, --storage [newStorageDir]                   the new local storage directory
    -C, --copy [storageDir]                         copy storageDir to newStorageDir
    -p, --port [port]                               whistle port(8899 by default)
    -m, --middlewares [script path or module name]  express middlewares path(as: xx,yy/zz.js)
    -u, --uipath [script path]                      web ui plugin path
    -t, --timeout [ms]                              request timeout(36000 ms by default)
    -s, --sockets [number]                          max sockets(12 by default)
    -V, --version                                   output the version number
    -c, --command <command>                         command parameters ("node --harmony")

```

如果能正常输出 whistle 的帮助信息，表示 whistle 已安装成功。


### 3. 启动 whistle

> 最新版本的 whistle 支持三种等价的命令 `whistle`、`w2`、`wproxy`

启动 whistle:
```sh
$ w2 start
```

*Note: 如果要防止其他人访问配置页面，可以在启动时加上登录用户名和密码 `-n yourusername -w yourpassword`。*

重启 whsitle:
```sh
$ w2 restart
```

停止 whistle:
```sh
$ w2 stop
```

调试模式启动 whistle(主要用于查看 whistle 的异常及插件开发):
```sh
$ w2 run
```

### 启动多个 whistle
如果你想在同一台机器启动多个 whistle，方便多个浏览器或者供多人使用，有两种方式：

1. 切换到不同的系统用户，在每个系统用户启动一个 whistle 代理服务 (每个服务的端口号可以用命令行参数 `w2 start -p xxxx` 来指定)
2. 也可以通过切换规则目录和端口号的方式来解决 (注意 `S`、`C` 都是大写, newStorageDir 为空表示使用当前配置)

```
w2 start -S newStorageDir -p newPort

# 系统默认目录的配置拷贝到新的目录
w2 start -S newStorageDir -C -p newPort

# 也可以指定要拷贝的目录
w2 start -S newStorageDir -C storageDir -p newPort
```

*Note: 这种拷贝是覆盖式的，会替换目标目录里面原有文件，启动时设置了新的存储目录，关闭或重启时也要把目录参数带上 (端口号不要带上)：`w2 stop -S newStorageDir` 或 `w2 restart -S newStorageDir`*


比如分别在 `8899`，`8888`，`7788` 端口上开启 3 个实例：

```
# 默认端口 8899，系统默认存储目录
w2 start

# 端口号为 8888，存储目录为 8888，并把系统默认目录的配置 copy 到 8888 目录
w2 start -S 8888 -C

# 端口号为 7788，存储目录为 7788，并把 8888 目录的配置 copy 到 7788 目录
w2 start -S 7788 -C 8888
```

*Note: 不同实例要配置不同的代理 *
