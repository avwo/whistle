
### 启动多个whistle
如果你想在同一台机器启动多个whistle，方便多个浏览器或者供多人使用，有两种方式：

1. 切换到不同的系统用户，在每个系统用户启动一个whistle代理服务(每个服务的端口号可以用命令行参数`w2 start -p xxxx`来指定)
2. 也可以通过切换规则目录和端口号的方式来解决(注意`S`、`C`都是大写, newStorageDir为空表示使用当前配置)

```
w2 start -S newStorageDir -p newPort

# 系统默认目录的配置拷贝到新的目录
w2 start -S newStorageDir -C -p newPort

# 也可以指定要拷贝的目录
w2 start -S newStorageDir -C storageDir -p newPort
```

*Note: 这种拷贝是覆盖式的，会替换目标目录里面原有文件，启动时设置了新的存储目录，关闭或重启时也要把目录参数带上(端口号不要带上)：`w2 stop -S newStorageDir`或`w2 restart -S newStorageDir`*


比如分别在`8899`，`8888`，`7788`端口上开启3个实例：

```
# 默认端口8899，系统默认存储目录
w2 start

# 端口号为8888，存储目录为8888，并把系统默认目录的配置copy到8888目录
w2 start -S 8888 -C

# 端口号为7788，存储目录为7788，并把8888目录的配置copy到7788目录
w2 start -S 7788 -C 8888
```

*Note: 不同实例要配置不同的代理*

### `w2 add [filepath]`
也可以用 `w2 use [filepath]`，通过filepath对应的js文件获取规则配置，filepath可选，默认为当前目录的 `.whistle.js`。

如项目根目录文件 `.whistle.js`：

```
const pkg = require('./package.json');

exports.groupName = '项目开发环境'; // 可选，设置分组， 要求 Whistle 版本 >= v2.9.21
exports.name = `[${pkg.name}]本地环境配置`;
exports.rules = `
test.example.com http://127.0.0.1:5566
# cgi走现网
test.example.com/cgi-bin ignore://http
`;
```

在该目录下支持 `w2 add` (或 `w2 use`)，这时如果本地whistle里面没有同名的规则且不为空，则会自动创建一个并自动启用，如果存在则会提醒：
```
The rule already exists, to override it, you must add CLI option --force.
```

可以通过 `w2 add --force` 强制覆盖当前同名规则。

也可以异步获取规则 `.whistle.js`：

```
const assert = require('assert);
const path = require('path');
const pkg = require('./package.json');

module.exports = (cb, util) => {
  // 如果依赖插件，可以检查插件
  assert(util.existsPlugin('@tnpm/whistle.tianma')
    || util.existsPlugin('whistle.combo'), '请先安装插件npm i -g whisltle.combo');
  // 也可以远程获取规则
  // do sth
  cb({
    name: `[${pkg.name}]本地环境配置`,
    rules:  `
      test.example.com/combo whisle.combo://${path.join(__dirname, 'dev')}
      test.example.com http://127.0.0.1:5566
      # cgi走现网
      test.example.com/cgi-bin ignore://http
      `
  });
};
```
