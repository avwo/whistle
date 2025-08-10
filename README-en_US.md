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

# Getting Started
For detailed usage instructions, please refer to: https://wproxy.org/en/docs/getting-started.html

# License

[MIT](./LICENSE)
