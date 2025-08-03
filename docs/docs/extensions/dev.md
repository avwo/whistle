# 开发插件
您已了解插件的各项功能特性（参考[使用文档](/usage)），现在我们将通过模块化方式演示具体实现。
> 每个核心功能作为独立插件实现，保持单一职责原则，实际开发中可自由拼装这些功能模块。

## 准备工作
1. 创建一个空目录，如
   ``` sh
    mkdir examples && cd examples
   ```
2. 安装脚手架 [lack](https://github.com/avwo/lack)
   ``` txt
    npm i -g lack
   ```
   > lack 必须用最新版本（`>= 1.4.0`）
3. 更新 [Whistle](https://github.com/avwo/whistle)
   > Whistle 必须用最新版本（`>= 2.9.100`，[客户端](https://github.com/avwo/whistle-client) `>= 1.3.8`）

## rules.txt
- 插件安装后会自动加载生效
- 功能跟界面 Rules 配置的规则一样，优先级低于界面 Rules 规则
- 插件被禁用立即失效

**示例**
1. 创建包含 `rules.txt` 规则文件的插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-rules && cd whistle.test-rules

    # 初始化包含 rules.txt 的插件
    lack init rules

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-rules` 插件
    lack watch
    ```
2. 编辑生成的 `rules.txt` 文件：
    ``` txt
    * reqHeaders://x-client=whistle.test-rules
    ```
3. 所有经过 Whistle 的请求都会自动添加请求头 `x-client: whistle.test-rules`
   
   <img src="/img/test-rules.png" width="600" />
4. 如果规则修改后未生效？请确认：
    - 是否已执行 `lack watch`
    - 是否跟界面配置冲突规则
    - 插件是否被禁用

## _rules.txt
- 仅对匹配插件协议的请求生效
- 支持长协议(whistle.myplugin://)和短协议(myplugin://)
- 作用于请求处理阶段
``` txt
pattern whistle.myplugin://value
pattern myplugin://value
```

**示例**
1. 创建包含 `_rules.txt` 规则文件的插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-req-rules && cd whistle.test-req-rules

    # 初始化包含 _rules.txt 的插件
    lack init _rules

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-req-rules` 插件
    lack watch
    ```
2. 编辑生成的 `_rules.txt` 文件：
    ``` txt
    * file://(hello)
    ```
    > 所有请求返回响应内容 `hello`
4. 直接访问 `https://www.example.com/test` 返回正常页面
5. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    https://www.example.com/test whistle.test-req-rules://
    ```
    后再访问 `https://www.example.com/test` 返回 `hello`
   
## resRules.txt
- 仅对匹配插件协议的请求生效
- 作用于响应处理阶段
- 可修改响应状态码和内容
``` txt
pattern whistle.myplugin://value
pattern myplugin://value
```

**示例**

1. 创建包含 `resRules.txt` 规则文件的插件：
   ```sh
    # 创建插件目录
    mkdir whistle.test-res-rules && cd whistle.test-res-rules

    # 初始化包含 resRules.txt 的插件
    lack init resRules

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-res-rules` 插件
    lack watch
    ```
2. 编辑生成的 `resRules.txt` 文件：
    ``` txt
    * resBody://`(whistle_error_${statusCode})` includeFilter://s:500 includeFilter://s:404
    ```
    > 把响应状态码为 `404` 和 `500` 的请求的响应内容改为 `whistle_error_404` 和  `whistle_error_500`
3. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    https://www.example.com/500 whistle.test-req-rules:// statusCode://500
    https://www.example.com/404 whistle.test-req-rules:// statusCode://404
    ```
4. 效果：
      - 访问 `https://www.example.com/500` 响应内容被改成 `whistle_error_500`
      - 访问 `https://www.example.com/404` 响应内容被改成 `whistle_error_404`
      - 访问 `https://www.example.com/test` 则返回原始内容

## auth
对经过 Whistle 的请求进行鉴权。

**示例**

1. 创建请求鉴权插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-auth && cd whistle.test-auth

    # 初始化包含 auth 的插件
    lack init auth

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-auth` 插件
    lack watch
    ```
2. 编辑 `src/auth.ts` 文件：
    ``` ts
    export default async (req: Whistle.PluginAuthRequest, options: Whistle.PluginOptions) => {
      const { fullUrl } = req;
      // URL 里面包含 `/test/forbidden` 的响应状态码为 403
      if (fullUrl.includes('/test/forbidden')) {
        return false;
      }
      // URL 里面包含 `/test/message/forbidden` 的响应状态码为 403，且自定义响应内容
      if (fullUrl.includes('/test/message/forbidden')) {
        req.setHtml('<strong>Access Denied</strong>');
        return false;
      }

      // URL 里面包含 `/test/login` 要求用户输入用户名和密码
      if (fullUrl.includes('/test/login')) {
        const auth = req.headers.authorization || req.headers['proxy-authorization'];
        if (auth) {
          // TODO: 校验用户名和密码，如果正确返回 true，否则返回 false
          return true;
        }
        req.setLogin(true);
        return false;
      }

      // URL 里面包含 `/test/redirect` 的响应状态码为 302，且重定向到 `https://www.example.com/test`
      if (fullUrl.includes('/test/redirect')) {
        req.setRedirect('https://www.example.com/test');
        return false;
      }
      // 其它请求直接放过
      // 如果需要添加自定义请求头，可以使用 `req.setHeader` 方法
      // 支持添加 key 前缀为 `x-whistle-` 的请求头
      // 例如：req.setHeader('x-whistle-xxx', 'value');
      req.setHeader('x-whistle-custom-header', 'lack');
      return true;
    };
    ```
3. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    www.example.com whistle.auth://
    ```
4. 效果：
      - 访问 `https://www.example.com/test/forbidden` 响应状态码 `403`，响应内容 `Forbidden`
      - 访问 `https://www.example.com/test/message/forbidden` 响应状态码 `403`，响应内容 `<strong>Access Denied</strong>`
      - 访问 `https://www.example.com/test/login` 弹出浏览器的登录框
      - 访问 `https://www.example.com/test/redirect` 重定向到 `https://www.example.com/test`
      - 其它 `www.example.com` 的请求正常，且被添加请求头 `x-whistle-custom-header: lack`

## sniCallback
通过插件动态下发请求证书。

**示例**

1. 创建自定义证书插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-sni && cd whistle.test-sni

    # 初始化包含 sni 的插件
    lack init sni

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-sni` 插件
    lack watch
    ```
2. 编辑 `src/sniCallback.ts` 文件：
    ``` ts
    const key = `...`;
    const cert = `...`;

    // sniCallback 插件处理函数 - 根据请求 URL 动态决定 TLS 隧道处理方式
    export default async (req: Whistle.PluginSNIRequest, options: Whistle.PluginOptions) => {
      const { fullUrl } = req;
      // 特殊域名返回 false，保持 TUNNEL 状态（不解除 TLS 加密）
      if (fullUrl === 'https://tunnel.example.com') {
        return false;
      }

      // 对特定域名使用自定义证书解密，返回一个包含 key 和 cert 的对象
      // 支持 .crt、.pem、.cer 等格式的证书
      if (fullUrl === 'https://custom.example.com') {
        return { key, cert };
      }
      // 默认使用 Whistle 内置证书解密 TLS 流量
      return true;
    };
    ```
5. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    www.example.com sniCallback://test-sni
    ```
6.  效果：
   - 访问 `https://tunnel.example.com/path`，请求保持 TUNNEL 状态（不解除 TLS 加密）
   - 访问 `https://custom.example.com/test/` 报证书出错
   - 其它请求正常

## rulesServer
通过 JavaScript 编程实时生成规则，规则功能跟上面的 _rules.txt 静态规则一样，但优先级高于 _rules.txt。

**示例**

1. 创建包含 `rulesServer` 插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-sni && cd whistle.test-rules-server

    # 初始化包含 rulesServer 的插件
    lack init rulesServer

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-rules-server` 插件
    lack watch
    ```
2. 编辑 `src/rulesServer.ts` 文件：
    ``` ts
    export default (server: Whistle.PluginServer, options: Whistle.PluginOptions) => {
      server.on('request', (req: Whistle.PluginRequest, res: Whistle.PluginResponse) => {
        res.end(JSON.stringify({
          values: {
            'whistle.test-rules-server/a.html': 'test normal values',
          },
          rules: `
            \`\`\` whistle.test-rules-server/b.html
            test inject values
            \`\`\`

            */a file://{whistle.test-rules-server/a.html}
            */b file://{whistle.test-rules-server/b.html}
          `,
        }));
      });
    };
    ```
    > 支持响应纯 rules 文本  `res.end(rules)`，或包含 rules & values 的序列化对象 `res.end(JSON.stringify({rules, values}))`
3. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    test.example.com whistle.test-rules-server://
    ```
4.  效果：
   - 访问 `https://test.example.com/a` 返回 `test inject values`
   - 访问 `https://test.example.com/b` 返回 `test normal values`

## tunnelRulesServer
tunnelRulesServer 是专门用于处理 TUNNEL 请求的动态规则生成机制，其核心特性与常规 [rulesServer](#rulesserver) 相同，但应用场景有专门区分：
1. tunnelRulesServer 仅对 `tunnel://domain:port` 隧道请求生效
2. rulesServer 对 `HTTP[S]/WebSocket` 请求生效

## resRulesServer
请求的响应阶段通过 JavaScript 编程实时生成规则（可作用于所有类型的请求），规则功能跟上面的 resRules.txt 静态规则一样，但优先级高于 resRules.txt。

**示例**

1. 创建包含 `resRulesServer` 插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-res-rules-server && cd whistle.test-res-rules-server

    # 初始化包含 resRulesServer 的插件
    lack init resRulesServer

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-res-rules-server` 插件
    lack watch
    ```
2. 编辑 `src/resRulesServer.ts` 文件：
    ``` ts
    export default (server: Whistle.PluginServer, options: Whistle.PluginOptions) => {
      server.on('request', (req: Whistle.PluginRequest, res: Whistle.PluginResponse) => {
        res.end('* resBody://(test-res-rules-server)');
      });
    };
    ```
3. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    test.example.com/res whistle.test-res-rules-server://
    ```
4.  效果：
   - 访问 `https://test.example.com/res/path` 返回 `test-res-rules-server`


## statsServer
如果仅想获取请求的 URL、请求方法、请求头、请求内容等信息，而不对请求做任何操作，可以用 statsServer。

**示例**

1. 创建包含 `statsServer` 插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-stats-server && cd whistle.test-stats-server

    # 初始化包含 statsServer 的插件
    lack init statsServer

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-stats-server` 插件
    lack watch
    ```
2. 编辑 `src/statsServer.ts` 文件：
    ``` ts
    export default (server: Whistle.PluginServer, options: Whistle.PluginOptions) => {
      server.on('request', (req: Whistle.PluginRequest) => {
        const { originalReq } = req;
        console.log('Value:', originalReq.ruleValue);
        console.log('URL:', originalReq.fullUrl);
        console.log('Method:', originalReq.method);
        console.log('Request Headers:', originalReq.headers);
        // 获取请求的 body
        req.getReqSession((reqSession) => {
          if (reqSession) {
            console.log('Request Body:', reqSession.req.body);
          }
        });
      });
    };
    ```
3. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    www.example.com/stats whistle.test-stats-server://test
    ```
4.  效果：
   - 访问 `https://www.example.com/stats` 控制台输出：
      ``` sh
      Value: test
      URL: https://www.example.com/stats
      Method: GET
      Request Headers: {
        host: 'www.example.com',
        'cache-control': 'max-age=0',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'accept-encoding': 'gzip, br',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        priority: 'u=0, i',
        'x-forwarded-for': '127.0.0.1',
        connection: 'close'
      }
      Request Body: 
      ```

## resStatsServer
如果获取请求的响应状态码、响应头、响应内容等信息，而不对请求做任何操作，可以用 resStatsServer。

**示例**

1. 创建包含 `resStatsServer` 插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-res-stats-server && cd whistle.test-res-stats-server

    # 初始化包含 resStatsServer 的插件
    lack init resStatsServer

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-res-stats-server` 插件
    lack watch
    ```
2. 安装依赖
    ``` sh
    npm i
    ```
3. 编辑 `src/resStatsServer.ts` 文件：
    ``` ts
    export default (server: Whistle.PluginServer, options: Whistle.PluginOptions) => {
      server.on('request', (req: Whistle.PluginRequest) => {
        const { originalReq, originalRes } = req;
        console.log('Value:', originalReq.ruleValue);
        console.log('URL:', originalReq.fullUrl);
        console.log('Method:', originalReq.method);
        console.log('Server IP', originalRes.serverIp);
        console.log('Status Code:', originalRes.statusCode);
        console.log('Response Headers:', originalReq.headers);
        // 获取请求的完整抓包数据
        req.getSession((reqSession) => {
          if (reqSession) {
            console.log('Response Body:', reqSession.res.body);
          }
        });
      });
    };
    ```
4. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    www.example.com/res/stats whistle.test-res-stats-server://testResStats
    ```
5.  效果：
   - 访问 `https://www.example.com/res/stats` 控制台输出：
      ``` sh
      Value: testResStats
      URL: https://www.example.com/res/stats
      Method: GET
      Server IP 127.0.0.1
      Status Code: 200
      Response Headers: {
        'accept-ranges': 'bytes',
        'content-type': 'text/html',
        etag: '"84238dfc8092e5d9c0dac8ef93371a07:1736799080.121134"',
        'last-modified': 'Mon, 13 Jan 2025 20:11:20 GMT',
        server: 'AkamaiNetStorage',
        expires: 'Thu, 24 Jul 2025 02:36:23 GMT',
        'cache-control': 'max-age=0, no-cache, no-store',
        pragma: 'no-cache',
        date: 'Thu, 24 Jul 2025 02:36:23 GMT',
        'alt-svc': 'h3=":443"; ma=93600,h3-29=":443"; ma=93600',
        'x-forwarded-for': '127.0.0.1',
        host: 'www.example.com',
        connection: 'close'
      }
      Response Body: <!doctype html>
      <html>
      <head>
          <title>Example Domain</title>

      ......
      ```

## server
可以将插件作为 **server** 使用，由它接收并转发请求。插件可以直接响应请求，或在处理后继续转发至目标服务器。目标服务器返回响应后，插件可以进一步处理，最终将结果返回给浏览器或客户端。

**示例**

1. 创建包含 `server` 插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-server && cd whistle.test-server

    # 初始化包含 server 的插件
    lack init server

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-server` 插件
    lack watch
    ```
2. 编辑 `src/server.ts` 文件：https://github.com/whistle-plugins/examples/tree/master/whistle.test-server
3. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    https://raw.githubusercontent.com/avwo/whistle/refs/heads/master/package.json test-server://setCookieFromBody
    ```
4.  访问 `https://raw.githubusercontent.com/avwo/whistle/refs/heads/master/package.json`
    - 浏览器 Cookie 新增 `test-name=whistle`
    - 响应内容新增 `"pluginName":"whistle"`


## pipe
如果请求/响应内容被加密，或者需要转成特定格式显示在抓包界面，可以用 pipe 将请求/响应内容交给插件处理。

#### HTTP/HTTPS 协议实现
1. 创建 pipe http 插件:
    ```sh
    # 创建插件目录
    mkdir whistle.test-pipe-http && cd whistle.test-pipe-http

    # 初始化包含 pipe http 的插件
    lack init pipeHttp,server

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-pipe-http` 插件
    lack watch
    ```
4. 编辑代码：https://github.com/whistle-plugins/examples/tree/master/whistle.test-pipe-http
5. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    www.example.com/test-pipe-http pipe://test-pipe-http test-pipe-http://mirror
    ```
    > `test-pipe-http://mirror` 的作用是客户端请求什么内容，服务端就响应什么内容
6. Whistle / Network / Composer 输入 `www.example.com/test-pipe-http`，选择 `POST` 方法，Body 输入 `test-pipe-http`
    <img src="/img/pipe-http.png" width="400" />
7.  点击发送按钮，查看返回的 Body 如下
    <img src="/img/pipe-http-result.png" width="400" />
   

#### WebSocket 协议实现
1. 创建 pipe websocket 插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-pipe-ws && cd whistle.test-pipe-ws

    # 初始化包含 pipe websocket 的插件
    lack init pipeWs

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-pipe-ws` 插件
    lack watch
    ```
2. 编辑代码：https://github.com/whistle-plugins/examples/tree/master/whistle.test-pipe-ws
3. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    wss://echo.websocket.org/ pipe://test-pipe-ws
    ```
4.  打开页面 `https://echo.websocket.org/.ws` 可以看到如下效果：
   <img src="/img/pipe-ws.png" width="520" />
   


#### TCP 隧道实现
1. 创建 pipe tunnel 插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-pipe-tunnel && cd whistle.test-pipe-tunnel

    # 初始化包含 pipe tunnel 的插件
    lack init pipeTunnel.server

    # 安装依赖
    npm i --save-dev lack-proxy && npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-pipe-tunnel` 插件
    lack watch
    ```
2. 编辑代码：https://github.com/whistle-plugins/examples/tree/master/whistle.test-pipe-tunnel
3. 在界面 Rules （或插件的 `rules.txt` 文件）配置以下规则：
    ``` txt
    test-pipe-tunnel.example.com pipe://test-pipe-tunnel test-pipe-tunnel://mirror
    ```
4. 执行 `whistle.test-pipe-tunnel` 根目录的 `test.js` 文件：
    ``` sh
    node test.js
    ```
5. 控制台输出的内容
    <img src="/img/pipe-tunnel.png" width="560" />

## 插件操作界面
在 Whistle 插件列表中，点击 `Option` 或插件名称可快速打开插件操作界面，支持以下三种模式：
1. **Tab 模式**：在 Whistle 界面内以标签页形式打开（默认方式）
2. **对话框模式**：在 Whistle 界面内以弹窗形式打开
3. **新标签模式**：在浏览器新标签页或客户端新窗口中打开

---

### 1. Tab 模式（默认）
**特性**  
- 插件管理界面默认地址为：`http[s]://domain[:port]/plugin.xxx/`  
- 通过插件列表的 `Option` 或插件名称直接打开  

**禁用 Tab 模式**  
若需隐藏此打开方式，可在 `whistleConfig` 中配置：  
```js
{
  ...
  "whistleConfig": {
    ...
    "noOption": true // 禁用默认入口
    ...
  }
  ...
}
```

---

### 2. 对话框模式
**特性**  
- 支持通过弹窗形式打开管理界面  
- 弹窗页面可以调用 `window.whistleBridge`：[插件界面 API]([插件界面 API](https://github.com/avwo/whistle/blob/master/biz/webui/htdocs/src/js/bridge.js))

**配置示例**  
```js
{
  "whistleConfig": {
    ...
    "openInModal": {
      "width": 360,  // 弹窗宽度（px）
      "height": 566  // 弹窗高度（px）
    }
    ...
  }
}
```

---

### 3. 新标签模式
**场景**  
需使用外部页面作为插件管理界面时使用。  

**基础配置**  
```js
{
  "whistleConfig": {
    "pluginHomepage": "https://your-external-page.com" // 外部页面地址
  }
}
```

**高级选项**  
若需将外部链接强制在 Whistle 内打开（Tab 或对话框模式）：  

**方式一：对话框模式**  
```js
{
  ...
  "whistleConfig": {
    ...
    "pluginHomepage": "https://your-external-page.com",
    "openInModal": {  // 强制以弹窗打开
      "width": 360,
      "height": 566
    }
    ...
  }
  ...
}
```

**方式二：Tab 模式**  
```js
{
  ...
  "whistleConfig": {
    ...
    "pluginHomepage": "https://your-external-page.com",
    "openInPlugins": true  // 强制在插件Tab页打开
    ...
  }
  ...
}
```
 
## 完整 Hooks API
参考：https://github.com/avwo/lack/blob/master/assets/ts/src/types/global.d.ts

## 插件变量配置{#pluginvars}
支持通过 `%` 符号在规则里面配置，详见：[`%` 符号用途](/docs/rules/plugin-vars)

## 自定义规则补全功能{#rules-hint}
综上所述，每个插件可以扩展以下规则：
``` txt
%myplugin=xxx
%myplugin.key=xxx
whistle.myplugin://xxx
myplugin://xxx
sinCallback://myplugin(sinValue)
pipe://myplugin(pipeValue)
```

Whistle 还支持对以下规则自定义补全功能：
``` txt
%myplugin=xxx
%myplugin.key=xxx
whistle.myplugin://xxx
myplugin://xxx
```

**示例**
1. 创建 rules hints 插件：
    ```sh
    # 创建插件目录
    mkdir whistle.test-rules-hint && cd whistle.test-rules-hint

    # 初始化包含 uiServer 的插件
    lack init uiServer

    # 安装依赖
    npm i

    # 编译代码
    npm run dev

    # 开发模式运行：将插件挂载到 Whistle，挂载后可以在插件列表中看到 `test-rules-hint` 插件
    lack watch
    ```
5. 在 `package.json` 配置 `whistleConfig`，新增 `pluginVars` 和 `hintUrl`：
   ``` js
    {
      ...
      "whistleConfig": {
        "pluginVars": {
          ...
          "hintUrl": '/cgi-bin/plugin-vars'
          ...
        },
        "hintUrl": '/cgi-bin/get-hints'
      },
      ...
    }
   ```
6. 编辑 `src/uiServer/router.ts` 文件：
    ``` ts
    export default (router: Router) => {
      // 针对 `%test-rules-hint[.key]=xxx`
      router.get('/cgi-bin/plugin-vars', (ctx) => {
        const { sep, value } = ctx.query;
        const isKey = sep === '.';
        let key = '';
        let keyword = '';
        if (value && typeof value === 'string') {
          if (isKey) {
            const index = value.indexOf('=');
            // %test-plugin-vars.xxx=yyy
            if (index !== -1) {
              key = value.substring(0, index);
              keyword = value.substring(index + 1).toLowerCase();
            } else {
              // %test-plugin-vars.xxx or %test-plugin-vars.xxx=
              key = value;
            }
          } else {
            // %test-plugin-vars=yyy
            keyword = value.toLowerCase();
          }
        }
        const result: (string | {
          isKey: true,
          value: string,
        })[] = [];
        VARS_OPTIONS.forEach((option) => {
          if (keyword && !option.toLowerCase().includes(keyword)) {
            return;
          }
          if (isKey) {
            result.push({
              value: `${key}=${option}`,
              isKey: true,
            });
          } else {
            result.push(option);
          }
        });
        ctx.body = result;
      });

      // 针对 `test-rules-hint://xxx` 和 `whistle.test-rules-hint://xxx`
      // 如果没有配置 `pluginVars.hintUrl`，则对 `%test-rules-hint[.key]=xxx` 也生效
      router.get('/cgi-bin/get-hints', (ctx) => {
        const { protocol, value } = ctx.query;
        if (!protocol || typeof protocol !== 'string' || typeof value !== 'string') {
          return;
        }
        const isVar = protocol.startsWith('%');
        // 事实上不会有这种情况，除非删除了 `pluginVars.hintUrl` 配置
        if (isVar) {
          return;
        }
        const isLong = protocol.startsWith('whistle.');
        const prefix = isLong ? 'long-' : 'short-';
        const keyword = value.toLowerCase();
        const result: string[] = [];
        HINTS_OPTIONS.forEach((option) => {
          if (`${prefix}${option.toLowerCase()}`.includes(keyword)) {
            result.push(`${prefix}${option}`);
          }
        });
        ctx.body = result;
      });
    };

    ```
9. 效果：
   
   <img src="/img/rules-hint1.png" width="300" />

   <img src="/img/rules-hint2.png" width="300" />

   <img src="/img/plugin-vars-hint-url1.png" width="300" />

## 界面扩展
Whistle 插件系统支持扩展以下界面功能模块：
- **Network 模块**
  - 数据表格列扩展
  - 上下文菜单扩展
  - 详情面板 Tab 扩展
- **Rules 模块**上下文菜单
- **Values 模块**上下文菜单
- **Plugins 模块**上下文菜单

1. 创建示例插件
    ```sh
    # 创建插件目录
    mkdir whistle.test-ui-ext && cd whistle.test-ui-ext

    # 初始化空白插件
    lack init blank

    # 开发模式运行
    lack watch
    ```
2. 编辑 `whistleConfig`：https://github.com/whistle-plugins/examples/tree/master/whistle.test-ui-ext/package.json
3. 执行后可在 Whistle 插件列表看到 `test-ui-ext` 插件
    ![界面扩展效果图](/img/ui-ext.png)

#### 1. Network 表格列扩展
**配置示例**：
```js
{
  ...
  "whistleConfig": {
    ...
    "networkColumn": {
      "name": "Referer",          // 列显示名称（必填）
      "key": "req.headers.referer", // 数据字段路径（必填）
      "iconKey": "",              // 图标字段（可选）
      "showTitle": true,          // 是否显示悬浮提示（可选）
      "width": 120                // 列宽（可选，默认120）
    }
    ...
  }
  ...
}
```

**高级数据处理**：
1. 创建 `/public/webWorker.js`：
    ```js
    module.exports = function(session, next) {
      const isGithub = /^https?:\/\/github\.com\//.test(session.url);
      next({
        testWebWorker: 'custom_value',
        style: isGithub ? { 
          color: '#fff',
          fontStyle: 'italic',
          bgColor: 'red' 
        } : null
      });
    };
    ```
2. 配置 webWorker：
    ```js
    {
      "whistleConfig": {
        "networkColumn": {
          "name": "Test",
          "key": "customData.testWebWorker"  // 访问 webWorker 返回数据
          ...
        },
        "webWorker": "/public/webWorker.js"
      }
    }
    ```

#### 2. 详情面板 Tab 扩展
```js
{
  "whistleConfig": {
    "inspectorsTab": {
      "name": "Custom Tab",       // Tab 显示名称
      "action": "/public/tab.html", // 功能页面
      "icon": "data:image/png;base64,...", // 图标（可选）
      "req": {                    // Request 子 Tab
        "name": "Req SubTab",
        "action": "/public/req-tab.html"
      },
      "res": {                    // Response 子 Tab
        "name": "Res SubTab",
        "action": "/public/res-tab.html"
      }
    },
    "composerTab": { /* 同 inspectorsTab */ },
    "toolsTab": { /* 同 inspectorsTab */ }
  }
}
```

Tab 页面可以调用 `window.whistleBridge`：[插件界面 API](https://github.com/avwo/whistle/blob/master/biz/webui/htdocs/src/js/bridge.js)

#### 3. Network 上下文菜单功能
``` js
{
  ...
  "whistleConfig": {
    ...
    "networkMenus": [
      {
        "name": "Network Menu1",
        "action": "/public/network-menu.html",
        "required": false, // 默认 false，列表模式下不是列表项的上下文菜单是否禁用该项
        "requiredTreeNode": false, // 默认 false，树形模式下不是列表项的上下文菜单是否禁用该项
        "urlPattern": ""
      },
      {
        "name": "Network Menu2", // 菜单项名称
        "action": "/public/network-menu.html", // 功能页面
        "required": true, // 默认 false，列表模式下不是列表项的上下文菜单是否禁用该项
        "requiredTreeNode": true, // 默认 false，树形模式下不是列表项的上下文菜单是否禁用该项
        "urlPattern": ""
      }
    ],
    ...
  }
  ...
}
```
- 上下文菜单的 `action` 页面可以调用 `window.whistleBridge`：[插件界面 API](https://github.com/avwo/whistle/blob/master/biz/webui/htdocs/src/js/bridge.js)
- 具体实现参考：https://github.com/nohosts/whistle.nohost-imweb/blob/master/menu.html

#### 3. Rules 上下文菜单功能
``` js
{
  ...
  "whistleConfig": {
    ...
    "rulesMenus": [
      {
        "name": "Rules Menu1", // 菜单项名称
        "action": "/public/rules-menu.html", // 功能页面
        "required": false, // 默认 false，列表模式下不是列表项的上下文菜单是否禁用该项
        "requiredTreeNode": false, // 默认 false，树形模式下不是列表项的上下文菜单是否禁用该项
        "urlPattern": ""
      },
      {
        "name": "Rules Menu2",
        "action": "/public/rules-menu.html",
        "required": false, // 默认 false，列表模式下不是列表项的上下文菜单是否禁用该项
        "requiredTreeNode": false, // 默认 false，树形模式下不是列表项的上下文菜单是否禁用该项
        "urlPattern": ""
      }
    ],
    ...
  }
  ...
}
```
- 上下文菜单的 `action` 页面可以调用 `window.whistleBridge`：[插件界面 API](https://github.com/avwo/whistle/blob/master/biz/webui/htdocs/src/js/bridge.js)
- 具体实现参考：https://github.com/nohosts/whistle.nohost-imweb/blob/master/menu.html

#### 4. Values 上下文菜单功能
``` js
{
  ...
  "whistleConfig": {
    ...
    "valuesMenus": [
      {
        "name": "Values Menu1",
        "action": "/public/values-menu.html",
        "required": false, // 默认 false，列表模式下不是列表项的上下文菜单是否禁用该项
        "requiredTreeNode": false, // 默认 false，树形模式下不是列表项的上下文菜单是否禁用该项
        "urlPattern": ""
      },
      {
        "name": "Values Menu2",
        "action": "/public/values-menu.html",
        "required": false, // 默认 false，列表模式下不是列表项的上下文菜单是否禁用该项
        "requiredTreeNode": false, // 默认 false，树形模式下不是列表项的上下文菜单是否禁用该项
        "urlPattern": ""
      }
    ],
    ...
  }
  ...
}
```
- 上下文菜单的 `action` 页面可以调用 `window.whistleBridge`：[插件界面 API](https://github.com/avwo/whistle/blob/master/biz/webui/htdocs/src/js/bridge.js)
- 具体实现参考：https://github.com/nohosts/whistle.nohost-imweb/blob/master/menu.html

#### 5. Plugins 上下文菜单功能
``` js
{
  ...
  "whistleConfig": {
    ...
    "pluginsMenus": [
      {
        "name": "Plugins Menu1",
        "action": "/public/plugins-menu.html",
        "required": false, // 默认 false，列表模式下不是列表项的上下文菜单是否禁用该项
        "requiredTreeNode": false, // 默认 false，树形模式下不是列表项的上下文菜单是否禁用该项
        "urlPattern": ""
      },
      {
        "name": "Plugins Menu2",
        "action": "/public/plugins-menu.html",
        "required": false, // 默认 false，列表模式下不是列表项的上下文菜单是否禁用该项
        "requiredTreeNode": false, // 默认 false，树形模式下不是列表项的上下文菜单是否禁用该项
        "urlPattern": ""
      }
    ],
    ...
  }
  ...
}
```
- 上下文菜单的 `action` 页面可以调用 `window.whistleBridge`：[插件界面 API](https://github.com/avwo/whistle/blob/master/biz/webui/htdocs/src/js/bridge.js)
- 具体实现参考：https://github.com/nohosts/whistle.nohost-imweb/blob/master/menu.html

## 特殊路径

Whistle 提供专用路径格式，用于在格类型页面下直接请求插件接口。

#### 1. Whistle 界面直接访问
在 Whistle 界面或插件管理界面中，可直接使用以下格式访问插件接口：
```
path/to
```

- 此路径会自动解析为 `/whistle.xxx/path/to`
- 推荐使用相对路径格式，避免直接使用绝对路径 `/path/to`

#### 2. 普通页面访问
若需在非 Whistle 的普通网页中调用插件接口，请使用以下特殊路径格式：
```
/.whistle-path.5b6af7b9884e1165./whistle.xxx/path/to
```

- 请求到达插件时会被标准化为：`/whistle.xxx/path/to`
- 前缀 `/.whistle-path.5b6af7b9884e1165./` 是 Whistle 的专用标识符，用于标记内部请求路由

#### 说明：
- `xxx` 为您的插件名称
- `path/to` 是插件接口的具体路径
- 特殊路径中的哈希值 `/.whistle-path.5b6af7b9884e1165./` 为固定标识符

## 其它 whistleConfig 配置
``` js
{
  ...,
  "whistleConfig": {
    "hideLongProtocol": false, // 是否隐藏插件的长协议，设置为 true 后，Rules 界面里面配置该插件协议会显示已被删除
    "hideShortProtocol": false, // 是否隐藏插件的短协议，设置为 true 后，Rules 界面里面配置该插件协议会显示已被删除
    "priority": 0, // 默认值为0，插件优先级按更新时间从旧到新排序（越早更新的优先级越高），可通过此字段调整优先级顺
    "favicon": '', // 插件 Tab 页上的 icon，可以为插件相对路径 `/public/xxx.png` 或绝对路径 `https://xxx` 或 `data:image/png;base64,xxx`
    "registry": '', // 插件的 npm registry
    "homepage": '', // 插件帮助页面地址
    "pluginHomepage": '', // 自定义插件操作页面地址，默认为 `/plugin.xxx/`
    "noOption": false, // 如果不存在操作界面，可以设置为 true，这样 Option 按钮会置灰
    "enableAuthUI": false, // 插件的 auth hook 是否作用于插件操作界面（慎用）
    "tunnelKey": '', // 字符串或字符串组，如果需要继续将请求通过 TUNNEL 代理到其它 HTTP Proxy 时，可以指定哪些请求头跟着过去
    ...
  },
  ...
}
```

## 发布插件
Whistle 插件的发布方式与常规 NPM 包完全一致，只需遵循标准 NPM 发布流程：
1. 登录 NPM（或企业私有源，后者需要设置企业私有源的 `npm config set registry https://xxx`）:
    ``` sh
    npm login
    ```
2. 在插件根目录执行发布命令：
    ``` sh
    npm publish
    ```

## 参考资料
1. 示例源码仓库：
https://github.com/whistle-plugins/examples
1. 脚手架命令：https://github.com/avwo/lack
