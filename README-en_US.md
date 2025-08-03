<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://user-images.githubusercontent.com/11450939/168828068-99e38862-d5fc-42bc-b5ab-6262b2ca27d6.png">
  </a>
</p>

# whistle
[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js-%3E=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/aur/license/whistle?style=flat-square)](https://www.npmjs.com/package/whistle)

[中文](./README.md) · English

Whistle is a cross-platform network packet capture and debugging tool based on Node.js, with:
1. **Powerful**
   - Supports multiple proxy modes such as HTTP proxy, HTTPS proxy, Socks proxy, and reverse proxy
   - Supports viewing and modifying HTTP, HTTPS, HTTP/2, WebSocket, and TCP requests/responses
   - Built-in multiple common debugging tools:
     - Weinre: View the DOM structure of the remote page,
     - Console: View the console log of the remote page,
     - Composer: Replay and edit requests
2. **Simple operation**
   - Supports modifying requests/responses by configuring rules
   - Provides a one-stop GUI interface for viewing packet capture, configuring rules, managing plug-ins, and operating Weinre/Console/Composer, etc.
3. **Extensible**
   - Supports extending rules and interface functions through plug-ins
   - Supports being referenced by projects as NPM packages
4. **Cross-platform**
   - Supports desktop systems such as macOS, Windows, and Linux (Ubuntu/Fedora)
   - Supports interfaceless Linux servers

# Installation

**Whistle client is recommended for desktop systems such as macOS, Windows, and Linux (Ubuntu/Fedora): [https://github.com/avwo/whistle-client](https://github.com/avwo/whistle-client)**

> You can skip the **installation** step by using Whistle client

For environments such as Linux servers without interfaces, please follow the 4 steps below:

1. **Install Whistle**, it is recommended to install it with NPM: `npm i -g whistle` (Node.js needs to be installed first: https://nodejs.org/)
    > It also supports installation through brew: `brew install whistle` (brew needs to be installed first: https://brew.sh/)
2. **Start Whistle**, execute the command line: `w2 start`
3. **Install the root certificate**, execute the command line: `w2 ca`
    > The root certificate installation process may require manual confirmation:
    >
    > <details>
    > <summary>Windows needs to click the last "Yes (Y)" confirm</summary>
    > <img alt="Click Yes (Y)" width="420" src="https://user-images.githubusercontent.com/11450939/168846905-384e0540-e02f-46de-81d7-e395a496f032.jpeg">
    > </details>
    >
    > <details>
    > <summary>macOS requires a power-on password or fingerprint verification</summary>
    > <img alt="Enter power-on password" width="330" src="https://user-images.githubusercontent.com/11450939/176977027-4a7b06a0-64f6-4580-b983-312515e9cd4e.png">
    > <img alt="Enter fingerprint" width="330" src="https://user-images.githubusercontent.com/11450939/168847123-e66845d0-6002-4f24-874f-b6943f7f376b.png">
    > </details>
    >

4. **Set proxy**, command line execution: `w2 proxy`
    > macOS may need to enter the lock screen password when setting up the proxy for the first time
    >
    > Set a specified IP or port: `w2 proxy "10.x.x.x:8888"`
    >
    > Turn off system proxy: `w2 proxy 0`
    >
    > Other ways to set proxy:
    >
    > 1. **[Recommended]** Install Chrome plug-in ZeroOmega Set up a proxy: https://chromewebstore.google.com/detail/proxy-switchyomega-3-zero/pfnededegaaopdmhkdmcofjmoldfiped (If you cannot access it, you can install it manually: https://chrome.zzzmh.cn/info/pfnededegaaopdmhkdmcofjmoldfiped)
    >
    > 2. Set up a proxy directly on the client, such as FireFox, WeChat developer tools, etc., which have built-in proxy settings
    >
    > <details>
    > <summary>FireFox proxy settings example image</summary>
    > <img width="1000" alt="image" src="https://github.com/user-attachments/assets/98c1ec5d-4955-4e23-a49a-c1015b128d9d" />
    > </details>
    >
    > 3. Through Proxifier Setting up a proxy (for clients that cannot set up a proxy and do not use a system proxy): https://www.proxifier.com/docs/win-v4/http-proxy.html
    >

# Usage

After installation, open the [client](https://github.com/avwo/whistle-client) or open the link http://local.whistlejs.com in the browser to see the Whistle operation interface:

<img width="1000" alt="network" src="https://github.com/user-attachments/assets/3186e76a-486a-4e61-98a1-2d4b4f91fad0" />

Among them:

1. Network: View packet capture, edit and replay interface
2. Rules: Rule configuration interface
3. Values: Data configuration interface (used with Rules)
4. Plugins: Plugin management interface

## Interface functions

1. Replay request

    <img width="720" alt="image" src="https://github.com/user-attachments/assets/9f8276ac-e089-427b-97f4-becac250ae5e" />
2. Edit or construct a request

    <img width="1000" alt="image" src="https://github.com/user-attachments/assets/f2a5b088-72b6-4098-8ba6-3e42f15f3ad8" />
3. For other interface functions, see the complete document: https://wproxy.org/whistle/webui/

## Configure rules

Rule structure:

``` txt
pattern operation [includeFilter://pattern1 ... excludeFilter://pattern2 ...]
```

1. pattern: URL matching pattern (supports domain name, path, regular expression, wildcard and other formats)
2. operation: the operation to be performed, such as modifying the request header
3. includeFilter/excludeFilter: optional filter conditions, multiple filter conditions can be set, supporting matching request URL, request method, request content, response status, response header

#### Example 1: Modify DNS (set Hosts)

1. Domain name matching

    ``` txt
    www.test.com 127.0.0.1
    # Support with port
    www.test.com 127.0.0.1:8080
    # CNAME function (port optional)
    www.test.com host://www.example.com:8181
    ```
2. Path matching

    ``` txt
    www.test.com/path/to 127.0.0.1:8080
    # Support with protocol
    https://www.test.com/path/to 127.0.0.1:8080
    ```
3. Wildcard matching

    ``` txt
    # Domain name wildcard, matching test.com All descendant domain names of
    **.test.com 127.0.0.1:8080
    # Support wildcards for domain names with protocols
    https://**.test.com 127.0.0.1:8080
    # Path wildcards (* is a legal character for paths, so add ^ in front to tell Whistle that it is a wildcard)
    ^**.test.com/*/path/to 127.0.0.1:8080
    # Support wildcards for paths with protocols
    ^https://**.test.com/*/path/to 127.0.0.1:8080
    ```
    > `*`, `**`, `***` have different matching ranges, for details, see the full document: https://wproxy.org/whistle/pattern.html

4. Regular matching

    ``` txt
    # The internal `/` can be escaped, which is equivalent to `new RegExp('^https?://\w+\.test\.com')`
    /^https?://\w+\.test\.com/ 127.0.0.1:8080
    ```
5. Filter matching

    ``` txt
    # `pattern` is the same as the domain name, path, and regular expression above, indicating that in addition to matching `pattern`, the request header `cookie` must also contain `env=test`
    pattern 127.0.0.1:8080 includeFilter://reqH.cookie=/env=test/

    # Only valid for iPhone requests
    https://www.test.com/path/to 127.0.0.1:8080 includeFilter://reqH.user-agent=/iPhone/i
    ```

##### Example 2: Modify form data

``` txt
# Modify the value of the `test` field in the form
pattern reqMerge://test=123

# Delete the `abc` field in the form
pattern delete://reqBody.abc
```

##### Example 3: Set cross-domain response header

``` txt
# Take path matching as an example, set the cross-domain response header Access-Control-Allow-Origin: *, and exclude OPTION requests
pattern resCors://* excludeFilter://m:option

# Cross-domain requests that require cookies
pattern resCors://enable
```

For all rules, see the full document: https://wproxy.org/whistle/rules/

### Install plugins

1. Click the Plugins tab in the left navigation bar
2. Click the Install button at the top
3. Enter the plugin name in the pop-up window (supports installing multiple plugins at the same time):
   - Multiple plugins are separated by spaces or line breaks
   - Custom npm mirror sources can be specified:
   - Add directly after the plugin name --registry=mirror address
   - Or select a mirror source that has been used in the past from the drop-down list

<img width="1000" alt="install plugins" src="https://github.com/user-attachments/assets/53bfc7b1-81a8-4cdb-b874-c0f9ab58b65a" />

**Example** (install two plugins and use a domestic mirror source):

``` txt
w2 install --registry=https://registry.npmmirror.com whistle.script whistle.inspect
```

> You can also install it through the command line: `w2 i whistle.script whistle.inspect`
>
> GitHub repository of the above plugins:
>
> whistle.script: https://github.com/whistle-plugins/whistle.script
>
> whistle.inspect: https://github.com/whistle-plugins/whistle.inspect
>

After installation, you can see these two plugins in the Plugins of the management interface:

<img width="1000" alt="image" src="https://github.com/user-attachments/assets/ec018691-c7a9-415e-9809-bf079694c024" />

In addition to extending rules, plugins can also extend interface functions, see: https://wproxy.org/whistle/plugins.html

# License

[MIT](./LICENSE)
