<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://user-images.githubusercontent.com/11450939/168828068-99e38862-d5fc-42bc-b5ab-6262b2ca27d6.png">
  </a>
</p>

# whistle
[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js-%3E=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/aur/license/whistle?style=flat-square)](https://www.npmjs.com/package/whistle)

[中文](./README-zh_CN.md) · English

Whistle is a powerful and easy-to-use cross-platform packet capture and debugging tool developed based on Node.js. It supports multiple proxy modes (such as HTTP, HTTPS, Socks, reverse proxy, etc.), which can be used for packet capture analysis or modifying HTTP, HTTPS, HTTP/2, WebSocket, TCP requests through configuration rules. Whistle also has built-in tools such as Weinre, Log, Composer, etc., which support viewing the DOM structure of remote pages, debugging console output, replaying or editing requests, etc. In addition, Whistle supports plug-in extensions and can also be referenced by other projects as NPM packages.

# Installation

**Windows PC or Mac PC recommended client: [https://github.com/avwo/whistle-client](https://github.com/avwo/whistle-client).**

> If you use Whistle client, you can skip this installation step

Linux PC, server and other systems can use the command line version, which needs to be installed strictly according to the following 4 steps:

1. Install Whistle
2. Start Whistle
3. Install root certificate
4. Set up proxy

### Install Whistle

Choose one of the following installation methods according to the actual situation:

1. Install through npm (need to install Node.JS first: https://nodejs.org/ ):

``` sh
npm i -g whistle
```

2. Install through brew (need to install brew first: https://brew.sh/ ):

``` sh
brew install whistle
```

### Start Whistle

``` sh
w2 start
```

> Whistle starts HTTP proxy by default (IP: `127.0.0.1`, port: `8899`), which can be started through `w2 start -p 8888` Modify the port. If it has been started, restart it with `w2 restart -p 8888` to modify the port.

For complete command line functions, please refer to the full document: https://wproxy.org/whistle/options.html

### Install the root certificate

After starting Whistle, you can install the root certificate with the following command:

``` sh
w2 ca --enable-https
```

<details>
<summary>Windows needs to click "Yes (Y)" to confirm</summary>
<img alt="Click Yes (Y)" width="420" src="https://user-images.githubusercontent.com/11450939/168846905-384e0540-e02f-46de-81d7-e395a496f032.jpeg">
</details>

<details>
<summary>Mac You need to enter the power-on password or fingerprint verification</summary>
<img alt="Enter the power-on password" width="330" src="https://user-images.githubusercontent.com/11450939/176977027-4a7b06a0-64f6-4580-b983-312515e9cd4e.png">
<img alt="Enter fingerprint" width="330" src="https://user-images.githubusercontent.com/11450939/168847123-e66845d0-6002-4f24-874f-b6943f7f376b.png">
</details>

For how to install the root certificate on other terminals such as mobile phones, please refer to the complete document: https://wproxy.org/whistle/webui/https.html

### Setting up a proxy

**There are four ways to use Windows PC or Mac PC. You can choose one of them according to your actual situation:**

1. **[Recommended]** Set up a proxy by installing the Chrome plug-in SwitchyOmega: https://chromewebstore.google.com/detail/proxy-switchyomega/padekgcemlokbadohgkifijomclgjgif

> Chrome App Store requires a VPN. If you cannot access it, please install it manually: https://proxy-switchyomega.com/download/

<details>
<summary>SwitchyOmega setting method example diagram</summary>
<img width="620" alt="image" src="https://github.com/user-attachments/assets/24016b7c-8f2a-45a3-9dc8-5ef3ddf46233" /><img width="180" alt="image" src="https://github.com/user-attachments/assets/43afd3cd-5c17-4d6a-82d0-20a7ef2e0d99" />
</details>

2. Set the system proxy through the command line:

```. sh
w2 proxy
```

> You can also specify the IP (default `127.0.0.1`) and port: `w2 proxy "10.x.x.x:8888"`, and use `w2 proxy 0` to turn off the system proxy setting

3. Set the proxy directly on the client, such as FireFox, WeChat developer tools, etc., which have built-in proxy setting functions
<details>
<summary>FireFox proxy setting example image</summary>
<img width="1100" alt="image" src="https://github.com/user-attachments/assets/98c1ec5d-4955-4e23-a49a-c1015b128d9d" />
</details>
4. Set up a proxy through Proxifier (for clients that cannot set up a proxy and do not use a system proxy): https://www.proxifier.com/docs/win-v4/http-proxy.html

**Linux setting path: Settings > Network > VPN > Network Proxy > Manual**
<details>
<summary>Linux proxy setting example image</summary>
<img width="1000" alt="image" src="https://github.com/user-attachments/assets/e9441d32-c818-4446-8be6-0fa3df3aed86" />
</details>

**Mobile devices such as mobile phones need to configure the current `Wi-Fi` proxy, taking iOS as an example:**
<details>
<summary>iOS proxy settings example image</summary>
<img width="1000" alt="image" src="https://github.com/user-attachments/assets/e97dc311-2ace-4287-b6b0-0247b13974a9" />
</details>

# Use

After installing Whistle according to the above steps, open the link http://local.whistlejs.com on the Chrome browser, and you can see the following operation interface:

<img width="1200" alt="network" src="https://github.com/user-attachments/assets/3186e76a-486a-4e61-98a1-2d4b4f91fad0" />

<img width="1200" alt="rules" src="https://github.com/user-attachments/assets/2e336403-4810-48e5-91c1-6f22dcda7388" />

Among them, Network is the interface for viewing packet capture, Rules is the configuration rule, Values ​​is the configuration data interface (used with Rules), and Plugins is the list of installed plugins.

### Interface functions

<details>
<summary>Replay request</summary>
<img width="800" alt="image" src="https://github.com/user-attachments/assets/9f8276ac-e089-427b-97f4-becac250ae5e" />
</details>

<details>
<summary>Edit or construct request</summary>
<img width="1200" alt="image" src="https://github.com/user-attachments/assets/f2a5b088-72b6-4098-8ba6-3e42f15f3ad8" />
</details>

For other interface functions, see the full document: https://wproxy.org/whistle/webui/

### Rule functions

Whistle rules can be seen as an extension of the following system hosts rules:

``` txt
# One domain name corresponds to one IP
127.0.0.1 localhost
::1 localhost
# Multiple domain names correspond to one IP
10.2.55.3 www.test.com www.example.com
```

The system hosts rules have a single function, only supporting DNS modification and domain name matching, and there are DNS cache problems, which cannot meet daily work needs. Whistle rules extend the functions of system hosts rules. In terms of matching methods, they not only support domain name matching, path matching, wildcard matching, regular matching, etc., but also support further filtering by request method, response status code, request (response) header, request content, etc.; in terms of functions, they not only support DNS modification, but also support port modification, CNAME, proxy setting, request URL modification, request method, response status code, request header, response header, request content, response content, etc. In theory, everything in HTTP request can be modified. The format of Whistle rules is:

1. Default format

``` txt
pattern operation
```

2. Support matching multiple operations

``` txt
pattern operation1 operation2 ...
```

3. Support filters

``` txt
pattern operation1 operation2 ... includeFilter://filterPattern1 ... excludeFilter://filterPatternN ...
```

> Multiple filters are in an or relationship, that is, one of the conditions must be met

4. Support position swap (prerequisite: operation and pattern are not URLs or domain names at the same time)

``` txt
operation pattern [filters ...]
operation pattern1 pattern2 ... [filters ...]
```

5. Support line breaks

``` txt
line`
operation
pattern1
pattern2 ...
[filters ...]
`
```

Specific examples are as follows:

##### Modify DNS (set Hosts)

1. Domain name matching

``` txt
www.test.com 127.0.0.1
# Support port
www.test.com 127.0.0.1:8080
# CNAME function (port optional)
www.test.com host://www.example.com:8181
```

> Unlike the system hosts rule, the Whistle rule adopts **left-to-right mapping** and **top-to-bottom priority** by default, but the operation and pattern can be swapped when they are different URLs or domain names, so it is also compatible with the system hosts rule, that is: `127.0.0.1:8080 www.test.com`

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
```

##### Modify form data

``` txt
# Modify the value of the `test` field in the form
pattern reqMerge://test=123

# Delete the `abc` field in the form
pattern delete://reqBody.abc
```

##### Set the cross-domain response header

``` txt
# Taking path matching as an example, set the cross-domain response header Access-Control-Allow-Origin: * and exclude OPTION requests
pattern resCors://* excludeFilter://m:option
```

For all rules, see the full document: https://wproxy.org/whistle/rules/

### Install the plugin

The plugin needs to be installed through the command line:

``` sh
w2 i whistle.inspect whistle.vase
```

> The above plug-in function introduction and source code: [https://github.com/whistle-plugins](https://github.com/whistle-plugins), the client can be installed through the interface: [https://github.com/avwo/whistle-client](https://github.com/avwo/whistle-client)

After installation, you can see these two plug-ins in the Plugins of the management interface:

<details>
<summary>Plugin list example image</summary>
<img width="1000" alt="image" src="https://github.com/user-attachments/assets/ec018691-c7a9-415e-9809-bf079694c024" />
</details>

Each plug-in can add two rule protocols by default:

``` txt
whistle.inspect://xxx
inspect://xxx
```

> By configuring the custom rules of the plug-in, the matching request can be forwarded to the plug-in specified hook implements custom functions. If not needed, you can also set `"hideLongProtocol": true` or `"hideShortProtocol": true` in `whistleConfig` of `package.json` of the plugin to hide the corresponding rule protocol

In addition to extending rules, the plugin also supports extending the Whistle interface, as well as providing operation interfaces, built-in rules and other functions. For installation, use and development of the plugin, please refer to the complete document: https://wproxy.org/whistle/plugins.html

# License

[MIT](./LICENSE)
