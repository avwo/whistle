import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Whistle",
  description: "HTTP, HTTP2, HTTPS, Websocket debugging proxy",
  head: [['link', { rel: 'icon', href: '/img/favicon.ico' }]],
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh'
    },
    zh: {
      label: '繁体中文',
      lang: 'zh-hant',
      link: '/zh-hant'
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Docs', link: '/en/docs/installation' },
        ],
        sidebar: [],
      }
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '帮助文档', link: '/zh-hans/installation' },
    ],

    sidebar: [
      { text: '安装', link: '/zh-hans/installation' },
      { text: '快速上手', link: '/zh-hans/getting-started' },
      { text: '移动端抓包', link: '/zh-hans/mobile' },
      {
        text: '界面功能',
        collapsed: false,
        items: [
          { text: 'Network', link: '/zh-hans/gui/network' },
          { text: 'HTTPS', link: '/zh-hans/gui/https' },
          { text: 'Weinre', link: '/zh-hans/gui/weinre' },
          { text: 'Log', link: '/zh-hans/gui/log' },
          { text: 'Composer', link: '/zh-hans/gui/composer' },
          { text: 'Rules', link: '/zh-hans/gui/rules' },
          { text: 'Values', link: '/zh-hans/gui/values' },
          { text: 'Plugins', link: '/zh-hans/gui/plugins' },
        ]
      },
      {
        text: '规则配置',
        collapsed: false,
        items: [
          { text: '匹配模式（pattern）', link: '/zh-hans/rules/pattern' },
          { text: '操作指令（operation）', link: '/zh-hans/rules/operation' },
          { text: '@', link: '/zh-hans/rules/@' },
          {
            text: 'Map Local',
            collapsed: true,
            items: [
              { text: 'file', link: '/zh-hans/rules/file' },
              { text: 'xfile', link: '/zh-hans/rules/xfile' },
              { text: 'tpl', link: '/zh-hans/rules/tpl' },
              { text: 'xtpl', link: '/zh-hans/rules/xtpl' },
              { text: 'rawfile', link: '/zh-hans/rules/rawfile' },
              { text: 'xrawfile', link: '/zh-hans/rules/xrawfile' },
            ]
          },
          {
            text: 'Map Remote',
            collapsed: true,
            items: [
              { text: 'https', link: '/zh-hans/rules/https' },
              { text: 'http', link: '/zh-hans/rules/http' },
              { text: 'wss', link: '/zh-hans/rules/wss' },
              { text: 'ws', link: '/zh-hans/rules/ws' },
              { text: 'tunnel', link: '/zh-hans/rules/tunnel' },
            ]
          },
          {
            text: 'DNS Spoofing',
            collapsed: true,
            items: [
              { text: 'host', link: '/zh-hans/rules/host' },
              { text: 'xhost', link: '/zh-hans/rules/xhost' },
              { text: 'proxy', link: '/zh-hans/rules/proxy' },
              { text: 'xproxy', link: '/zh-hans/rules/xproxy' },
              { text: 'http-proxy', link: '/zh-hans/rules/http-proxy' },
              { text: 'xhttp-proxy', link: '/zh-hans/rules/xhttp-proxy' },
              { text: 'https-proxy', link: '/zh-hans/rules/https-proxy' },
              { text: 'xhttps-proxy', link: '/zh-hans/rules/xhttps-proxy' },
              { text: 'socks', link: '/zh-hans/rules/socks' },
              { text: 'xsocks', link: '/zh-hans/rules/xsocks' },
              { text: 'pac', link: '/zh-hans/rules/pac' },
            ]
          },
          {
            text: 'Rewrite Request',
            collapsed: true,
            items: [
              { text: 'urlParams', link: '/zh-hans/rules/urlParams' },
              { text: 'pathReplace', link: '/zh-hans/rules/pathReplace' },
              { text: 'sniCallback', link: '/zh-hans/rules/sniCallback' },
              { text: 'method', link: '/zh-hans/rules/method' },
              { text: 'cipher', link: '/zh-hans/rules/cipher' },
              { text: 'reqHeaders', link: '/zh-hans/rules/reqHeaders' },
              { text: 'forwardedFor', link: '/zh-hans/rules/forwardedFor' },
              { text: 'ua', link: '/zh-hans/rules/ua' },
              { text: 'auth', link: '/zh-hans/rules/auth' },
              { text: 'cache', link: '/zh-hans/rules/cache' },
              { text: 'referer', link: '/zh-hans/rules/referer' },
              { text: 'attachment', link: '/zh-hans/rules/attachment' },
              { text: 'reqCharset', link: '/zh-hans/rules/reqCharset' },
              { text: 'reqCookies', link: '/zh-hans/rules/reqCookies' },
              { text: 'reqCors', link: '/zh-hans/rules/reqCors' },
              { text: 'reqType', link: '/zh-hans/rules/reqType' },
              { text: 'reqBody', link: '/zh-hans/rules/reqBody' },
              { text: 'reqMerge', link: '/zh-hans/rules/reqMerge' },
              { text: 'reqPrepend', link: '/zh-hans/rules/reqPrepend' },
              { text: 'reqAppend', link: '/zh-hans/rules/reqAppend' },
              { text: 'reqReplace', link: '/zh-hans/rules/reqReplace' },
              { text: 'reqWrite', link: '/zh-hans/rules/reqWrite' },
              { text: 'reqWriteRaw', link: '/zh-hans/rules/reqWriteRaw' },
              { text: 'trailers', link: '/zh-hans/rules/trailers' },
            ]
          },
          {
            text: 'Rewrite Reponse',
            collapsed: true,
            items: [
              { text: 'statusCode', link: '/zh-hans/rules/statusCode' },
              { text: 'replaceStatus', link: '/zh-hans/rules/replaceStatus' },
              { text: 'redirect', link: '/zh-hans/rules/redirect' },
              { text: 'locationHref', link: '/zh-hans/rules/locationHref' },
              { text: 'resHeaders', link: '/zh-hans/rules/resHeaders' },
              { text: 'responseFor', link: '/zh-hans/rules/responseFor' },
              { text: 'resCharset', link: '/zh-hans/rules/resCharset' },
              { text: 'resCookies', link: '/zh-hans/rules/resCookies' },
              { text: 'resCors', link: '/zh-hans/rules/resCors' },
              { text: 'resType', link: '/zh-hans/rules/resType' },
              { text: 'resBody', link: '/zh-hans/rules/resBody' },
              { text: 'resMerge', link: '/zh-hans/rules/resMerge' },
              { text: 'resPrepend', link: '/zh-hans/rules/resPrepend' },
              { text: 'resAppend', link: '/zh-hans/rules/resAppend' },
              { text: 'resReplace', link: '/zh-hans/rules/resReplace' },
              { text: 'htmlPrepend', link: '/zh-hans/rules/htmlPrepend' },
              { text: 'htmlBody', link: '/zh-hans/rules/htmlBody' },
              { text: 'htmlAppend', link: '/zh-hans/rules/htmlAppend' },
              { text: 'cssPrepend', link: '/zh-hans/rules/cssPrepend' },
              { text: 'cssBody', link: '/zh-hans/rules/cssBody' },
              { text: 'cssAppend', link: '/zh-hans/rules/cssAppend' },
              { text: 'jsPrepend', link: '/zh-hans/rules/jsPrepend' },
              { text: 'jsBody', link: '/zh-hans/rules/jsBody' },
              { text: 'jsAppend', link: '/zh-hans/rules/jsAppend' },
              { text: 'resWrite', link: '/zh-hans/rules/resWrite' },
              { text: 'resWriteRaw', link: '/zh-hans/rules/resWriteRaw' },
            ]
          },
          {
            text: 'Throttle',
            collapsed: true,
            items: [
              { text: 'reqDelay', link: '/zh-hans/rules/reqDelay' },
              { text: 'resDelay', link: '/zh-hans/rules/resDelay' },
              { text: 'reqSpeed', link: '/zh-hans/rules/reqSpeed' },
              { text: 'resSpeed', link: '/zh-hans/rules/resSpeed' },
            ]
          },
          {
            text: 'Tools',
            collapsed: true,
            items: [
              { text: 'weinre', link: '/zh-hans/rules/weinre' },
              { text: 'log', link: '/zh-hans/rules/log' },
            ]
          },
          {
            text: 'Settings',
            collapsed: true,
            items: [
              { text: 'style', link: '/zh-hans/rules/style' },
              { text: 'lineProps', link: '/zh-hans/rules/lineProps' },
              { text: 'enable', link: '/zh-hans/rules/enable' },
              { text: 'disable', link: '/zh-hans/rules/disable' },
            ]
          },
          {
            text: 'Filters',
            collapsed: true,
            items: [
              { text: 'ignore', link: '/zh-hans/rules/ignore' },
              { text: 'skip', link: '/zh-hans/rules/skip' },
              { text: 'excludeFilter', link: '/zh-hans/rules/excludeFilter' },
              { text: 'includeFilter', link: '/zh-hans/rules/includeFilter' },
            ]
          },
          {
            text: 'Others',
            collapsed: true,
            items: [
              { text: 'pipe', link: '/zh-hans/rules/pipe' },
              { text: 'delete', link: '/zh-hans/rules/delete' },
              { text: 'headerReplace', link: '/zh-hans/rules/headerReplace' },
              { text: 'reqScript', link: '/zh-hans/rules/reqScript' },
              { text: 'resScript', link: '/zh-hans/rules/resScript' },
              { text: 'reqRules', link: '/zh-hans/rules/reqRules' },
              { text: 'resRules', link: '/zh-hans/rules/resRules' },
            ]
          },
        ]
      },
      {
        text: '功能扩展',
        collapsed: false,
        items: [
          { text: '使用插件', link: '/zh-hans/extensions/usage' },
          { text: '开发插件', link: '/zh-hans/extensions/dev' },
          { text: 'NPM 模块', link: '/zh-hans/extensions/npm' }
        ]
      },
      { text: '命令行操作', link: '/zh-hans/cli' },
      { text: '常见问题', link: '/zh-hans/qa' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/avwo/whistle' },
    ]
  }
});
