### `w2 use [filepath]`
也可以用 `w2 enable [filepath]`，通过filepath对应的js文件获取规则配置，filepath可选，默认为当前目录的 `.whistle.js`。

如项目根目录文件 `.whistle.js`：

```
const pkg = require('./package.json');

exports.name = `[${pkg.name}]本地环境配置`;
exports.rules = `
test.example.com http://127.0.0.1:5566
# cgi走现网
test.example.com/cgi-bin ignore://http
`;
```

在该目录下支持 `w2 use` (或 `w2 enable`)，这时如果本地whistle里面没有同名的规则且不为空，则会自动创建一个并自动启用，如果存在则会提醒：
```
The rule already exists, to override it, you must add CLI option --force.
```

可以通过 `w2 use --force` 强制覆盖当前同名规则。

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
