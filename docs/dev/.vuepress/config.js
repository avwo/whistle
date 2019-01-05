
module.exports = {
  title: 'whistle帮助文档',
  description: 'whistle帮助文档',
  head: [
    ['link', { rel: 'icon', href: `/logo.png` }]
  ],
  themeConfig: {
    repo: 'avwo/whistle',
    editLinks: true,
    docsDir: 'docs/zh',
    label: '简体中文',
    selectText: '选择语言',
    editLinkText: '编辑此页',
    nav: [
      {
        text: 'Languages',
        items: [
          { text: '简体中文', link: './' },
          { text: 'English', link: '../en/' }
        ]
      },
      { text: '官方插件', link: 'https://github.com/whistle-plugins' },
    ],
    sidebar: {
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
        '',
        'installation',
        'getting-started',
        'faq',
        '/protocols/'
      ],
    }
  },
  footer: 'MIT Licensed | Copyright © 2019-present avenwu'
}
