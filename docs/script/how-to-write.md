# 文档指南

## 1. 文档编译

1. 安装 gitboock-cli
  ```sh
  npm i -g gitbook-cli --registry=https://registry.npmmirror.com/
  ```
2. 启动 gitbook 本地服务器
  ```sh
  cd docs/
  gitbook serve [zh-cn|en-us]
  ```
3. 打开页面，本地预览 gitbook 生成的文档
4. watch src/*.md
  ```sh
  npm run docs:watch
  ```
5. build html: TODO
  ```sh
  gitbook build
  ```

## 2. 文档规约

单文件的文档组织方式，通过脚本来合并文档

### 文件名

文件名对应文档左边的导航，pattern: /[\d\w-]+\.md/

> 文件名不要使用 `_` 连接，使用 `-` 连接

### 标题

* 主标题与副标题字体大小相差两个字号，形成视觉区分
* 子标题通过 **加粗** 的方式

### 代码块

优先使用 \`\`\` 的方式，在其后追加代码语言类型，比如：\`\`\`js，避免代码块里面一些注释性的文本扰乱 md 的解析

### 中英文空格

更好的阅读效果，推荐中英文留空格

相关的插件

* vscode extension: pangu ，目前发现中文加粗有 bug
