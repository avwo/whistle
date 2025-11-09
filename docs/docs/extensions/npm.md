# NPM 模块
Whistle 可作为 NPM 模块集成到项目中，**强烈建议**在独立子进程中运行 Whistle，以避免与主进程相互影响，同时便于管理。

## 安装依赖
``` sh
npm i --save whistle pfork
```

## 独立服务模式
1. 创建 Whistle 启动脚本（`/lib/whistle.js`）：
    ``` js
    const startWhistle = require('whistle');

    module.exports = (options, callback) => {
      startWhistle({ port: options.port }, () => callback());
    };
    ```
    > 禁用插件、自定义插件目录、修改存储目录等启动参数参考：https://github.com/avwo/whistle/blob/master/index.d.ts
2. 启动 Whistle 进程代码：
    ``` js
    const { fork } = require('pfork');
    const path = require('path');

    const script = path.join(__dirname, './whistle.js');
    const options = {
      script,
      port: 8080,
    };
    const forkWhistle = (retry) => {
      fork(options, (err, result, child) => {
        if (err) {
          // 初始化时报错，直接退出服务
          if (!retry) {
            throw err;
          }
          // 重试报错，延迟 100 毫秒再重试
          return setTimeout(forkWhistle, 100);
        }
        // 子进程退出自动重试
        child.once('close', () => forkWhistle(true));
      });
    };

    forkWhistle();
    ```

这种方式启动的 Whistle，跟通过命令行独立启动 Whistle 或 Whistle 客户端的用法一样。


## 内部服务模式（推荐）

1. 创建 Whistle 启动脚本（`/lib/whistle.js`）：
    ``` js
    const startWhistle = require('whistle');
    const http = require('http');

    let curPort = 30013;

    const getPort = (callback) => {
      const server = http.createServer();
      server.on('error', () => {
        if (++curPort % 5 === 0) {
          ++curPort;
        }
        getPort(callback);
      });
      server.listen(curPort, '127.0.0.1', () => {
        server.removeAllListeners();
        server.close(() => callback(curPort));
      });
    };

    module.exports = (options, callback) => {
      // 获取一个随机端口
      getPort((port) => {
        // 在随机端口启动 Whistle，启动成功后将启动参数传给父进程
        const options = {
          port,
          host: '127.0.0.1',
          storage: 'xxx', // 建议设置新存储目录，确保不跟其它实例的目录冲突
        };
        startWhistle(options, () => callback(options));
      });
    };
    ```
    > 参考：https://github.com/Tencent/nohost/blob/master/lib/whistle.js
    > 
    > Whistle 会
2. 启动 Whistle 进程方法（`/lib/fork.js`）：
    ``` js
    const { fork } = require('pfork');
    const path = require('path');

    const script = path.join(__dirname, './whistle.js');
    const options = {
      script,
    };

    module.exports =() => {
      return new Promise((resolve, reject) => {
        fork(options, (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        });
      });
    };
    ```
    > 参考：https://github.com/Tencent/nohost/blob/master/lib/main/whistleMgr.js
3. 将项目中的指定请求转发到 Whistle：
   ``` js
    const { createServer } = require('http');
    const forkWhistle = require('./fork');

    const server = createServer(async (req, res) => {
      try {
        const { host, port } = await forkWhistle();
        // 将请求转发到 host、port
      } catch (e) {
        // handle errors
      }
    });

    server.listen(8010);
   ```
   > 参考：https://github.com/Tencent/nohost/blob/master/lib/index.js#L160

这种方式启动的 Whistle，端口是随机的且是按需启动的，外部请求不直接访问 Whistle，需要通过所在项目的服务进行转发，用法更灵活，更推荐项目使用这种方式集成 Whistle。

## 相关文档

1. Whistle 的所有启动参数可查看源代码的类型定义：https://github.com/avwo/whistle/blob/master/index.d.ts
2. pfork：https://github.com/avwo/pfork
3. 完整示例：https://github.com/Tencent/nohost

