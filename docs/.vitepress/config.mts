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
      { text: '帮助文档', link: '/docs/installation' },
    ],

    sidebar: [
      { text: '安装', link: '/docs/installation' },
      { text: '快速上手', link: '/docs/getting-started' },
      { text: '移动端抓包', link: '/docs/mobile' },
      {
        text: '界面功能',
        collapsed: false,
        items: [
          { text: 'Network', link: '/docs/gui/network' },
          { text: 'HTTPS', link: '/docs/gui/https' },
          { text: 'Console', link: '/docs/gui/console' },
          { text: 'Online', link: '/docs/gui/online' },
          { text: 'Composer', link: '/docs/gui/composer' },
          { text: 'Rules', link: '/docs/gui/rules' },
          { text: 'Weinre', link: '/docs/gui/weinre' },
          { text: 'Values', link: '/docs/gui/values' },
          { text: 'Plugins', link: '/docs/gui/plugins' },
        ]
      },
      {
        text: '规则配置',
        collapsed: false,
        items: [
          { text: '匹配模式（pattern）', link: '/docs/rules/pattern' },
          { text: '操作指令（operation）', link: '/docs/rules/operation' },
          { text: '@', link: '/docs/rules/@' },
          {
            text: 'Map Local',
            collapsed: true,
            items: [
              { text: 'file', link: '/docs/rules/file' },
              { text: 'xfile', link: '/docs/rules/xfile' },
              { text: 'tpl', link: '/docs/rules/tpl' },
              { text: 'xtpl', link: '/docs/rules/xtpl' },
              { text: 'rawfile', link: '/docs/rules/rawfile' },
              { text: 'xrawfile', link: '/docs/rules/xrawfile' },
            ]
          },
          {
            text: 'Map Remote',
            collapsed: true,
            items: [
              { text: 'https', link: '/docs/rules/https' },
              { text: 'http', link: '/docs/rules/http' },
              { text: 'wss', link: '/docs/rules/wss' },
              { text: 'ws', link: '/docs/rules/ws' },
              { text: 'tunnel', link: '/docs/rules/tunnel' },
            ]
          },
          {
            text: 'DNS Spoofing',
            collapsed: true,
            items: [
              { text: 'host', link: '/docs/rules/host' },
              { text: 'xhost', link: '/docs/rules/xhost' },
              { text: 'proxy', link: '/docs/rules/proxy' },
              { text: 'xproxy', link: '/docs/rules/xproxy' },
              { text: 'http-proxy', link: '/docs/rules/http-proxy' },
              { text: 'xhttp-proxy', link: '/docs/rules/xhttp-proxy' },
              { text: 'https-proxy', link: '/docs/rules/https-proxy' },
              { text: 'xhttps-proxy', link: '/docs/rules/xhttps-proxy' },
              { text: 'socks', link: '/docs/rules/socks' },
              { text: 'xsocks', link: '/docs/rules/xsocks' },
              { text: 'pac', link: '/docs/rules/pac' },
            ]
          },
          {
            text: 'Rewrite Request',
            collapsed: true,
            items: [
              { text: 'urlParams', link: '/docs/rules/urlParams' },
              { text: 'pathReplace', link: '/docs/rules/pathReplace' },
              { text: 'sniCallback', link: '/docs/rules/sniCallback' },
              { text: 'method', link: '/docs/rules/method' },
              { text: 'cipher', link: '/docs/rules/cipher' },
              { text: 'reqHeaders', link: '/docs/rules/reqHeaders' },
              { text: 'forwardedFor', link: '/docs/rules/forwardedFor' },
              { text: 'ua', link: '/docs/rules/ua' },
              { text: 'auth', link: '/docs/rules/auth' },
              { text: 'cache', link: '/docs/rules/cache' },
              { text: 'referer', link: '/docs/rules/referer' },
              { text: 'attachment', link: '/docs/rules/attachment' },
              { text: 'reqCharset', link: '/docs/rules/reqCharset' },
              { text: 'reqCookies', link: '/docs/rules/reqCookies' },
              { text: 'reqCors', link: '/docs/rules/reqCors' },
              { text: 'reqType', link: '/docs/rules/reqType' },
              { text: 'reqBody', link: '/docs/rules/reqBody' },
              { text: 'reqMerge', link: '/docs/rules/reqMerge' },
              { text: 'reqPrepend', link: '/docs/rules/reqPrepend' },
              { text: 'reqAppend', link: '/docs/rules/reqAppend' },
              { text: 'reqReplace', link: '/docs/rules/reqReplace' },
              { text: 'reqWrite', link: '/docs/rules/reqWrite' },
              { text: 'reqWriteRaw', link: '/docs/rules/reqWriteRaw' },
              { text: 'reqRules', link: '/docs/rules/reqRules' },
              { text: 'reqScript', link: '/docs/rules/reqScript' },
            ]
          },
          {
            text: 'Rewrite Reponse',
            collapsed: true,
            items: [
              { text: 'statusCode', link: '/docs/rules/statusCode' },
              { text: 'replaceStatus', link: '/docs/rules/replaceStatus' },
              { text: 'redirect', link: '/docs/rules/redirect' },
              { text: 'locationHref', link: '/docs/rules/locationHref' },
              { text: 'resHeaders', link: '/docs/rules/resHeaders' },
              { text: 'responseFor', link: '/docs/rules/responseFor' },
              { text: 'resCharset', link: '/docs/rules/resCharset' },
              { text: 'resCookies', link: '/docs/rules/resCookies' },
              { text: 'resCors', link: '/docs/rules/resCors' },
              { text: 'resType', link: '/docs/rules/resType' },
              { text: 'resBody', link: '/docs/rules/resBody' },
              { text: 'resMerge', link: '/docs/rules/resMerge' },
              { text: 'resPrepend', link: '/docs/rules/resPrepend' },
              { text: 'resAppend', link: '/docs/rules/resAppend' },
              { text: 'resReplace', link: '/docs/rules/resReplace' },
              { text: 'htmlPrepend', link: '/docs/rules/htmlPrepend' },
              { text: 'htmlBody', link: '/docs/rules/htmlBody' },
              { text: 'htmlAppend', link: '/docs/rules/htmlAppend' },
              { text: 'cssPrepend', link: '/docs/rules/cssPrepend' },
              { text: 'cssBody', link: '/docs/rules/cssBody' },
              { text: 'cssAppend', link: '/docs/rules/cssAppend' },
              { text: 'jsPrepend', link: '/docs/rules/jsPrepend' },
              { text: 'jsBody', link: '/docs/rules/jsBody' },
              { text: 'jsAppend', link: '/docs/rules/jsAppend' },
              { text: 'trailers', link: '/docs/rules/trailers' },
              { text: 'resWrite', link: '/docs/rules/resWrite' },
              { text: 'resWriteRaw', link: '/docs/rules/resWriteRaw' },
              { text: 'resRules', link: '/docs/rules/resRules' },
              { text: 'resScript', link: '/docs/rules/resScript' },
            ]
          },
          {
            text: 'General',
            collapsed: true,
            items: [
              { text: 'pipe', link: '/docs/rules/pipe' },
              { text: 'delete', link: '/docs/rules/delete' },
              { text: 'headerReplace', link: '/docs/rules/headerReplace' },
            ]
          },
          {
            text: 'Throttle',
            collapsed: true,
            items: [
              { text: 'reqDelay', link: '/docs/rules/reqDelay' },
              { text: 'resDelay', link: '/docs/rules/resDelay' },
              { text: 'reqSpeed', link: '/docs/rules/reqSpeed' },
              { text: 'resSpeed', link: '/docs/rules/resSpeed' },
            ]
          },
          {
            text: 'Tools',
            collapsed: true,
            items: [
              { text: 'weinre', link: '/docs/rules/weinre' },
              { text: 'log', link: '/docs/rules/log' },
            ]
          },
          {
            text: 'Settings',
            collapsed: true,
            items: [
              { text: 'style', link: '/docs/rules/style' },
              { text: 'lineProps', link: '/docs/rules/lineProps' },
              { text: 'enable', link: '/docs/rules/enable' },
              { text: 'disable', link: '/docs/rules/disable' },
            ]
          },
          {
            text: 'Filters',
            collapsed: true,
            items: [
              { text: 'ignore', link: '/docs/rules/ignore' },
              { text: 'skip', link: '/docs/rules/skip' },
              { text: 'excludeFilter', link: '/docs/rules/excludeFilter' },
              { text: 'includeFilter', link: '/docs/rules/includeFilter' },
            ]
          },
        ]
      },
      {
        text: '功能扩展',
        collapsed: false,
        items: [
          { text: '插件使用', link: '/docs/extensions/usage' },
          { text: '插件开发', link: '/docs/extensions/dev' },
          { text: 'NPM 模块', link: '/docs/extensions/npm' }
        ]
      },
      { text: '命令行操作', link: '/docs/cli' },
      { text: '常见问题', link: '/docs/faq' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/avwo/whistle' },
    ]
  }
});
