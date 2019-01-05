
module.exports = {
  title: 'whistle帮助文档',
  description: 'whistle帮助文档',
  head: [
    ['link', { rel: 'icon', href: `/logo.png` }]
  ],
  themeConfig: {
    repo: 'avwo/whistle',
    editLinks: true,
    docsDir: 'docs',
    label: '简体中文',
    selectText: '选择语言',
    editLinkText: '编辑此页',
    nav: [
      {
        text: 'Languages',
        items: [
          { text: '简体中文', link: '../zh/' },
          { text: 'English', link: '../en/' }
        ]
      },
      { text: '官方插件', link: 'https://github.com/whistle-plugins' },
    ],
    sidebar: {
      '/examples/': [
        ''
      ],
      '/protocols/': [
        '',
        'host',
        {
          title: 'rule',
          collapsable: false,
          children: [
            'rule/file'
          ]
        }
      ],
      '/': [
        '/zh/introduction',
        '/zh/installation',
        '/zh/getting-started',
        '/zh/rule-introduction',
        '/zh/ui-operation',
        '/zh/cli',
        '/zh/custom',
        '/zh/examples/',
        '/zh/faq',
        '/zh/protocols/'
      ],
    }
  },
  footer: 'MIT Licensed | Copyright © 2019-present avenwu'
}
