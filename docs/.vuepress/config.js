

const getMenuList = (dir) => {
  return [
    'introduction',
    'installation',
    'getting-started',
    'rule-introduction',
    'ui-operation',
    'cli',
    'custom',
    'examples/',
    'faq',
    'protocols/'
  ].map(name => `${dir}${name}`);
};

module.exports = {
  locales: {
    // 每个语言对象的键(key)，是语言的访问路径。
    // 然而，一种特例是将 '/' 作为默认语言的访问路径。
    '/en/': {
      lang: 'English', // 这个值会被设置在 <html> 的 lang 属性上
      title: 'Whistle Documentation',
      description: 'Whistle Documentation'
    },
    '/zh/': {
      lang: '简体中文',
      title: 'Whistle 帮助文档',
      description: 'Whistle 帮助文档'
    }
  },
  head: [
    ['link', { rel: 'icon', href: `/logo.png` }]
  ],
  themeConfig: {
    repo: 'avwo/whistle',
    editLinks: true,
    docsDir: 'docs',
    locales: {
      '/zh/': {
        label: '简体中文',
        selectText: '选择语言',
        editLinkText: '编辑此页',
        nav: [
          { text: '官方插件', link: 'https://github.com/whistle-plugins' },
        ],
      },
      '/en/': {
        label: 'English',
        selectText: 'Languages',
        editLinkText: 'Edit this page',
        nav: [
          { text: 'Plugins', link: 'https://github.com/whistle-plugins' },
        ],
      }
    },
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
      '/zh/': getMenuList('/zh/'),
      '/en/': getMenuList('/en/'),
    }
  },
  footer: 'MIT Licensed | Copyright © 2019-present avenwu'
}
