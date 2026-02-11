import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Whistle",
  description: "HTTP, HTTP2, HTTPS, Websocket debugging proxy",
  head: [
    ['link', { rel: 'icon', href: '/img/favicon.ico' }],
    ['style', {}, `
      .VPFooter {
        padding-bottom: 20px;
        text-align: center;
      }
      .VPFooter a {
        color: var(--vp-c-text-2);
        font-size: 12px;
      }
    `]],
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh'
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        search: {
          provider: 'local',
        },
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Documentation', link: '/en/docs/' },
        ],
        sidebar: [
          { text: 'Installation', link: '/en/docs/' },
          { text: 'Getting Started', link: '/en/docs/getting-started' },
          { text: 'Mobile Settings', link: '/en/docs/mobile' },
          {
            text: 'UI Features',
            collapsed: false,
            items: [
              { text: 'Network', link: '/en/docs/gui/network' },
              { text: 'HTTPS', link: '/en/docs/gui/https' },
              { text: 'Weinre', link: '/en/docs/gui/weinre' },
              { text: 'Console/Log', link: '/en/docs/gui/console' },
              { text: 'Online', link: '/en/docs/gui/online' },
              { text: 'Composer', link: '/en/docs/gui/composer' },
              { text: 'Rules', link: '/en/docs/gui/rules' },
              { text: 'Values', link: '/en/docs/gui/values' },
              { text: 'Plugins', link: '/en/docs/gui/plugins' },
              { text: 'Shortcut', link: '/en/docs/gui/shortcut' },
            ]
          },
          {
            text: 'Rule Configuration',
            collapsed: false,
            items: [
              { text: 'Rule Syntax', link: '/en/docs/rules/rule' },
              { text: 'Pattern', link: '/en/docs/rules/pattern' },
              { text: 'Operation', link: '/en/docs/rules/operation' },
              { text: 'Filters', link: '/en/docs/rules/filters' },
              { text: 'Protocols', link: '/en/docs/rules/protocols' },
              { text: '@', link: '/en/docs/rules/@' },
              { text: '%', link: '/en/docs/rules/plugin-vars' },
              {
                text: 'Map Local',
                collapsed: false,
                items: [
                  { text: 'file', link: '/en/docs/rules/file' },
                  { text: 'xfile', link: '/en/docs/rules/xfile' },
                  { text: 'tpl', link: '/en/docs/rules/tpl' },
                  { text: 'xtpl', link: '/en/docs/rules/xtpl' },
                  { text: 'rawfile', link: '/en/docs/rules/rawfile' },
                  { text: 'xrawfile', link: '/en/docs/rules/xrawfile' },
                ]
              },
              {
                text: 'Map Remote',
                collapsed: false,
                items: [
                  { text: 'https', link: '/en/docs/rules/https' },
                  { text: 'http', link: '/en/docs/rules/http' },
                  { text: 'wss', link: '/en/docs/rules/wss' },
                  { text: 'ws', link: '/en/docs/rules/ws' },
                  { text: 'tunnel', link: '/en/docs/rules/tunnel' },
                  { text: 'Protocol inheritance', link: '/en/docs/rules/inherit' },
                ]
              },
              {
                text: 'DNS Spoofing',
                collapsed: false,
                items: [
                  { text: 'host', link: '/en/docs/rules/host' },
                  { text: 'xhost', link: '/en/docs/rules/xhost' },
                  { text: 'proxy (http-proxy)', link: '/en/docs/rules/proxy' },
                  { text: 'xproxy (xhttp-proxy)', link: '/en/docs/rules/xproxy' },
                  { text: 'https-proxy', link: '/en/docs/rules/https-proxy' },
                  { text: 'xhttps-proxy', link: '/en/docs/rules/xhttps-proxy' },
                  { text: 'socks', link: '/en/docs/rules/socks' },
                  { text: 'xsocks', link: '/en/docs/rules/xsocks' },
                  { text: 'pac', link: '/en/docs/rules/pac' },
                ]
              },
              {
                text: 'Rewrite Request',
                collapsed: false,
                items: [
                  { text: 'urlParams', link: '/en/docs/rules/urlParams' },
                  { text: 'pathReplace', link: '/en/docs/rules/pathReplace' },
                  { text: 'sniCallback', link: '/en/docs/rules/sniCallback' },
                  { text: 'method', link: '/en/docs/rules/method' },
                  { text: 'tlsOptions', link: '/en/docs/rules/cipher' },
                  { text: 'reqHeaders', link: '/en/docs/rules/reqHeaders' },
                  { text: 'forwardedFor', link: '/en/docs/rules/forwardedFor' },
                  { text: 'ua', link: '/en/docs/rules/ua' },
                  { text: 'auth', link: '/en/docs/rules/auth' },
                  { text: 'cache', link: '/en/docs/rules/cache' },
                  { text: 'referer', link: '/en/docs/rules/referer' },
                  { text: 'reqType', link: '/en/docs/rules/reqType' },
                  { text: 'reqCharset', link: '/en/docs/rules/reqCharset' },
                  { text: 'reqCookies', link: '/en/docs/rules/reqCookies' },
                  { text: 'reqCors', link: '/en/docs/rules/reqCors' },
                  { text: 'reqBody', link: '/en/docs/rules/reqBody' },
                  { text: 'reqMerge', link: '/en/docs/rules/reqMerge' },
                  { text: 'reqPrepend', link: '/en/docs/rules/reqPrepend' },
                  { text: 'reqAppend', link: '/en/docs/rules/reqAppend' },
                  { text: 'reqReplace', link: '/en/docs/rules/reqReplace' },
                  { text: 'reqWrite', link: '/en/docs/rules/reqWrite' },
                  { text: 'reqWriteRaw', link: '/en/docs/rules/reqWriteRaw' },
                  { text: 'reqRules', link: '/en/docs/rules/reqRules' },
                  { text: 'reqScript', link: '/en/docs/rules/reqScript' },
                ]
              },
              {
                text: 'Rewrite Reponse',
                collapsed: false,
                items: [
                  { text: 'statusCode', link: '/en/docs/rules/statusCode' },
                  { text: 'replaceStatus', link: '/en/docs/rules/replaceStatus' },
                  { text: 'redirect', link: '/en/docs/rules/redirect' },
                  { text: 'locationHref', link: '/en/docs/rules/locationHref' },
                  { text: 'resHeaders', link: '/en/docs/rules/resHeaders' },
                  { text: 'responseFor', link: '/en/docs/rules/responseFor' },
                  { text: 'resType', link: '/en/docs/rules/resType' },
                  { text: 'resCharset', link: '/en/docs/rules/resCharset' },
                  { text: 'resCookies', link: '/en/docs/rules/resCookies' },
                  { text: 'resCors', link: '/en/docs/rules/resCors' },
                  { text: 'attachment', link: '/en/docs/rules/attachment' },
                  { text: 'resBody', link: '/en/docs/rules/resBody' },
                  { text: 'resMerge', link: '/en/docs/rules/resMerge' },
                  { text: 'resPrepend', link: '/en/docs/rules/resPrepend' },
                  { text: 'resAppend', link: '/en/docs/rules/resAppend' },
                  { text: 'resReplace', link: '/en/docs/rules/resReplace' },
                  { text: 'htmlPrepend', link: '/en/docs/rules/htmlPrepend' },
                  { text: 'htmlBody', link: '/en/docs/rules/htmlBody' },
                  { text: 'htmlAppend', link: '/en/docs/rules/htmlAppend' },
                  { text: 'cssPrepend', link: '/en/docs/rules/cssPrepend' },
                  { text: 'cssBody', link: '/en/docs/rules/cssBody' },
                  { text: 'cssAppend', link: '/en/docs/rules/cssAppend' },
                  { text: 'jsPrepend', link: '/en/docs/rules/jsPrepend' },
                  { text: 'jsBody', link: '/en/docs/rules/jsBody' },
                  { text: 'jsAppend', link: '/en/docs/rules/jsAppend' },
                  { text: 'trailers', link: '/en/docs/rules/trailers' },
                  { text: 'resWrite', link: '/en/docs/rules/resWrite' },
                  { text: 'resWriteRaw', link: '/en/docs/rules/resWriteRaw' },
                  { text: 'resRules', link: '/en/docs/rules/resRules' },
                  { text: 'resScript', link: '/en/docs/rules/resScript' },
                  { text: 'frameScript', link: '/en/docs/rules/frameScript' },
                ]
              },
              {
                text: 'General',
                collapsed: false,
                items: [
                  { text: 'pipe', link: '/en/docs/rules/pipe' },
                  { text: 'delete', link: '/en/docs/rules/delete' },
                  { text: 'headerReplace', link: '/en/docs/rules/headerReplace' },
                ]
              },
              {
                text: 'Throttle',
                collapsed: false,
                items: [
                  { text: 'reqDelay', link: '/en/docs/rules/reqDelay' },
                  { text: 'resDelay', link: '/en/docs/rules/resDelay' },
                  { text: 'reqSpeed', link: '/en/docs/rules/reqSpeed' },
                  { text: 'resSpeed', link: '/en/docs/rules/resSpeed' },
                ]
              },
              {
                text: 'Tools',
                collapsed: false,
                items: [
                  { text: 'weinre', link: '/en/docs/rules/weinre' },
                  { text: 'log', link: '/en/docs/rules/log' },
                ]
              },
              {
                text: 'Settings',
                collapsed: false,
                items: [
                  { text: 'style', link: '/en/docs/rules/style' },
                  { text: 'enable', link: '/en/docs/rules/enable' },
                  { text: 'disable', link: '/en/docs/rules/disable' },
                  { text: 'lineProps', link: '/en/docs/rules/lineProps' },
                ]
              },
              {
                text: 'Filters',
                collapsed: false,
                items: [
                  { text: 'excludeFilter', link: '/en/docs/rules/excludeFilter' },
                  { text: 'includeFilter', link: '/en/docs/rules/includeFilter' },
                  { text: 'ignore', link: '/en/docs/rules/ignore' },
                  { text: 'skip', link: '/en/docs/rules/skip' },
                ]
              },
            ],
          },
          {
            text: 'Extensions',
            collapsed: false,
            items: [
              { text: 'Plugin Usage', link: '/en/docs/extensions/usage' },
              { text: 'Plugin Development', link: '/en/docs/extensions/dev' },
              { text: 'NPM Modules', link: '/en/docs/extensions/npm' }
            ]
          },
          { text: 'CLI', link: '/en/docs/cli' },
          { text: 'FAQ', link: '/en/docs/faq' },
        ],
      }
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: 'local',
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '帮助文档', link: '/docs/' },
    ],

    sidebar: [
      { text: '安装', link: '/docs/' },
      { text: '快速上手', link: '/docs/getting-started' },
      { text: '移动端抓包', link: '/docs/mobile' },
      {
        text: '界面功能',
        collapsed: false,
        items: [
          { text: 'Network', link: '/docs/gui/network' },
          { text: 'HTTPS', link: '/docs/gui/https' },
          { text: 'Weinre', link: '/docs/gui/weinre' },
          { text: 'Console', link: '/docs/gui/console' },
          { text: 'Online', link: '/docs/gui/online' },
          { text: 'Composer', link: '/docs/gui/composer' },
          { text: 'Rules', link: '/docs/gui/rules' },
          { text: 'Values', link: '/docs/gui/values' },
          { text: 'Plugins', link: '/docs/gui/plugins' },
          { text: '快捷键', link: '/docs/gui/shortcut' },
        ]
      },
      {
        text: '规则配置',
        collapsed: false,
        items: [
          { text: '规则语法', link: '/docs/rules/rule' },
          { text: '匹配模式（pattern）', link: '/docs/rules/pattern' },
          { text: '操作指令（operation）', link: '/docs/rules/operation' },
          { text: '过滤器（filters）', link: '/docs/rules/filters' },
          { text: '协议列表', link: '/docs/rules/protocols' },
          { text: '@', link: '/docs/rules/@' },
          { text: '%', link: '/docs/rules/plugin-vars' },
          {
            text: 'Map Local',
            collapsed: false,
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
            collapsed: false,
            items: [
              { text: 'https', link: '/docs/rules/https' },
              { text: 'http', link: '/docs/rules/http' },
              { text: 'wss', link: '/docs/rules/wss' },
              { text: 'ws', link: '/docs/rules/ws' },
              { text: 'tunnel', link: '/docs/rules/tunnel' },
               { text: '协议继承', link: '/docs/rules/inherit' },
            ]
          },
          {
            text: 'DNS Spoofing',
            collapsed: false,
            items: [
              { text: 'host', link: '/docs/rules/host' },
              { text: 'xhost', link: '/docs/rules/xhost' },
              { text: 'proxy (http-proxy)', link: '/docs/rules/proxy' },
              { text: 'xproxy (xhttp-proxy)', link: '/docs/rules/xproxy' },
              { text: 'https-proxy', link: '/docs/rules/https-proxy' },
              { text: 'xhttps-proxy', link: '/docs/rules/xhttps-proxy' },
              { text: 'socks', link: '/docs/rules/socks' },
              { text: 'xsocks', link: '/docs/rules/xsocks' },
              { text: 'pac', link: '/docs/rules/pac' },
            ]
          },
          {
            text: 'Rewrite Request',
            collapsed: false,
            items: [
              { text: 'urlParams', link: '/docs/rules/urlParams' },
              { text: 'pathReplace', link: '/docs/rules/pathReplace' },
              { text: 'sniCallback', link: '/docs/rules/sniCallback' },
              { text: 'method', link: '/docs/rules/method' },
              { text: 'tlsOptions', link: '/docs/rules/cipher' },
              { text: 'reqHeaders', link: '/docs/rules/reqHeaders' },
              { text: 'forwardedFor', link: '/docs/rules/forwardedFor' },
              { text: 'ua', link: '/docs/rules/ua' },
              { text: 'auth', link: '/docs/rules/auth' },
              { text: 'cache', link: '/docs/rules/cache' },
              { text: 'referer', link: '/docs/rules/referer' },
              { text: 'reqType', link: '/docs/rules/reqType' },
              { text: 'reqCharset', link: '/docs/rules/reqCharset' },
              { text: 'reqCookies', link: '/docs/rules/reqCookies' },
              { text: 'reqCors', link: '/docs/rules/reqCors' },
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
            collapsed: false,
            items: [
              { text: 'statusCode', link: '/docs/rules/statusCode' },
              { text: 'replaceStatus', link: '/docs/rules/replaceStatus' },
              { text: 'redirect', link: '/docs/rules/redirect' },
              { text: 'locationHref', link: '/docs/rules/locationHref' },
              { text: 'resHeaders', link: '/docs/rules/resHeaders' },
              { text: 'responseFor', link: '/docs/rules/responseFor' },
              { text: 'resType', link: '/docs/rules/resType' },
              { text: 'resCharset', link: '/docs/rules/resCharset' },
              { text: 'resCookies', link: '/docs/rules/resCookies' },
              { text: 'attachment', link: '/docs/rules/attachment' },
              { text: 'resCors', link: '/docs/rules/resCors' },
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
              { text: 'frameScript', link: '/docs/rules/frameScript' },
            ]
          },
          {
            text: 'General',
            collapsed: false,
            items: [
              { text: 'pipe', link: '/docs/rules/pipe' },
              { text: 'delete', link: '/docs/rules/delete' },
              { text: 'headerReplace', link: '/docs/rules/headerReplace' },
            ]
          },
          {
            text: 'Throttle',
            collapsed: false,
            items: [
              { text: 'reqDelay', link: '/docs/rules/reqDelay' },
              { text: 'resDelay', link: '/docs/rules/resDelay' },
              { text: 'reqSpeed', link: '/docs/rules/reqSpeed' },
              { text: 'resSpeed', link: '/docs/rules/resSpeed' },
            ]
          },
          {
            text: 'Tools',
            collapsed: false,
            items: [
              { text: 'weinre', link: '/docs/rules/weinre' },
              { text: 'log', link: '/docs/rules/log' },
            ]
          },
          {
            text: 'Settings',
            collapsed: false,
            items: [
              { text: 'style', link: '/docs/rules/style' },
              { text: 'enable', link: '/docs/rules/enable' },
              { text: 'disable', link: '/docs/rules/disable' },
              { text: 'lineProps', link: '/docs/rules/lineProps' },
            ]
          },
          {
            text: 'Filters',
            collapsed: false,
            items: [
              { text: 'excludeFilter', link: '/docs/rules/excludeFilter' },
              { text: 'includeFilter', link: '/docs/rules/includeFilter' },
              { text: 'ignore', link: '/docs/rules/ignore' },
              { text: 'skip', link: '/docs/rules/skip' },
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
      { icon: {
        svg: '<svg class="icon" style="width: 1em;height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5530"><path d="M821.333333 1024H201.955556A202.296889 202.296889 0 0 1 0 821.902222V202.097778A202.296889 202.296889 0 0 1 201.955556 0h309.674666a40.391111 40.391111 0 0 1 0 80.839111H201.955556a121.486222 121.486222 0 0 0-121.173334 121.258667v619.804444a121.486222 121.486222 0 0 0 121.173334 121.258667h619.377777a121.486222 121.486222 0 0 0 121.173334-121.258667V512a40.391111 40.391111 0 1 1 80.782222 0v309.902222a202.296889 202.296889 0 0 1-201.955556 202.097778z m33.905778-932.124444l37.973333 38.286222 38.257778 38.001778-185.827555 185.912888-222.151111 222.065778-83.740445 7.793778 7.793778-83.797333 221.895111-222.321778 185.799111-185.912889z m0-91.875556c-14.336 0-28.103111 5.688889-38.229333 15.900444l-204.657778 204.8-235.349333 237.397334a26.965333 26.965333 0 0 0-7.822223 16.440889l-15.075555 167.879111a26.965333 26.965333 0 0 0 26.936889 29.383111h2.417778l167.765333-15.075556a26.908444 26.908444 0 0 0 16.440889-7.822222l235.889778-236.088889 204.657777-204.8a53.902222 53.902222 0 0 0 0-76.231111l-57.912889-58.766222L893.212444 15.928889A53.845333 53.845333 0 0 0 855.239111 0z" fill="#000000" p-id="5531"></path></svg>',
      }, link: 'https://github.com/avwo/whistle/tree/master/docs' },
    ],
    footer: {
      message: '<a href="https://beian.miit.gov.cn/" target="_blank">浙ICP备15019507号-2</a>',
      copyright: 'Copyright © 2015-present Aven Wu'
    }
  }
});
