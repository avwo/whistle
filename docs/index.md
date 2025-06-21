---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Whistle"
  text: "专业级网络调试代理"
  tagline: 操作跟吹口哨（Whistle）一样简单
  image: /img/whistle.png
  actions:
    - theme: brand
      text: Whistle 客户端版本
      link: https://github.com/avwo/whistle-client
    - theme: alt
      text: Whistle 命令行版本
      link: https://github.com/avwo/whistle

features:
  - title: 功能强大
    details: 支持 HTTP/HTTPS/SOCKS/反向代理，可拦截修改主流网络协议流量，内置 Weinre 等调试工具
  - title: 操作简单
    details: 通过配置规则修改请求/响应，提供包含查看抓包、配置规则、管理插件及调试工具的一站式界面
  - title: 可扩展
    details: 可通过插件扩展规则及界面功能，或可作为标准 NPM 模块依赖集成
  - title: 跨平台
    details: 支持 macOS/Windows/Linux 桌面系统、无界面服务器系统及Docker等容器化平台
---
