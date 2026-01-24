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
[![License](https://img.shields.io/github/license/avwo/whistle?style=flat-square)](https://www.npmjs.com/package/whistle)

[中文](./README.md) · English

Whistle (pronounced /ˈwisəl/) is a cross-platform network debugging and proxy tool built on Node.js. It provides powerful packet capture, request/response inspection and modification, a rule-based modification engine, and extensibility through plugins.

Key features:
1. **Powerful**
   - Capture and modify HTTP, HTTPS, HTTP/2, WebSocket, and TCP traffic
   - Supports HTTP, HTTPS, Socks and reverse proxy modes
   - Built-in tools: Weinre (remote DOM inspection), Console (console logs), Composer (request replay/editing), etc.
2. **Easy to use**
   - Rule-based request/response modification
   - Unified UI for captures, rules, plugins, Weinre/Console/Composer and more
3. **Extensible**
   - SPlugin support for extending rules and UI
   - Can be used as an NPM module in projects
4. **Cross-platform**
   - Supports macOS, Windows, Linux (Ubuntu/Fedora) desktop systems
   - Supports headless Linux server environments

# Installation (recommended)

Desktop users (macOS/Windows/Linux) should use the Whistle client: https://github.com/avwo/whistle-client
> The client skips manual installation and configuration steps

# Headless Linux / Server Install (CLI)

Follow these 4 steps to deploy Whistle on a headless server:

1. Install Whistle (recommended via npm)
   - Install Node.js first: https://nodejs.org/
   - Install: `npm i -g whistle`
      > Alternatively via Homebrew: `brew install whistle`
1. Start Whistle
   - Command: `w2 start`
2. Install CA certificate (required for HTTPS capture)
   - Command: `w2 ca`
   - Manual confirmation may be required:
     - Windows: confirm with “Yes (Y)”
     - macOS: may require entering password or Touch ID
3. Configure proxy
   - Command: `w2 proxy`
   - Specify host:port: `w2 proxy "10.x.x.x:8888"`
   - Disable system proxy: `w2 proxy 0`

Other proxy options:
- Recommended: use a Chrome proxy extension ZeroOmega for easy switching
  > Chrome Web Store (or manual install if blocked): https://chromewebstore.google.com/detail/proxy-switchyomega-3-zero/pfnededegaaopdmhkdmcofjmoldfiped
- Use browser/devtools built-in proxy settings (e.g. Firefox, WeChat DevTools)
- For apps that can't set proxies directly, use Proxifier (Windows/macOS)

# Quick Start

See the official guide for usage and examples: https://wproxy.org/docs/getting-started.html

# Common Commands

- Start: `w2 start`
- Stop: `w2 stop`
- Restart: `w2 restart`
- Status: `w2 status`
- Install CA: `w2 ca`
- Set proxy: `w2 proxy [host:port]` (use `w2 proxy 0` to disable)

# License

[MIT — see the LICENSE file](./LICENSE)
