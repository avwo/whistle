# v0.3.11

fix配置某些带端口号正则的时候可能导致系统奔溃的情况

# v0.3.12

fix如果请求包含content-length导致weinre无法注入的bug

# v0.4.0

1. 菜单 `Rules`、`Values`、`Weinre`，hover出现列表（原来需要点击才能出现列表）
2. 新增快捷键 `ctrl + /` 来注释（取消注释）选中的行
3. 新增 `css`、`html`、`js` 3个协议，分别用来注入css、js、html到html页面，或css代码到css文件，js代码到js文件的底部。这个与resPrepend、resBody、resAppend的区别是：系统会自动判断响应的类型来选择注入

# v0.4.1、v0.4.2

修改快捷键 `ctrl + /` 的小bug：没有选中，及从后往前选择会导致聚焦有点问题。

# v0.5.0

1. JSON对象的一种inline写法，可以直接写在协议的uri里面，形如： `protocol://name1=values&name2=value2&name3&name4=&name5=value5&nameN=valueN`
2. 加入了如果有大版本的更新，会自动提醒（一般有新功能加入或修复致命bug才会有大版本的更新）

bugFix:

修改了一些子匹配的问题，及urlParams，params可能无效的问题

# v0.5.1

修复：本地调试时，https的根证书可能被开发目录的根证书自动覆盖问题

# v0.5.2

新增：支持 www.qq.com resHeaders://(content-type=text/plain)格式

# v0.5.3

  微调parseInlineJSON的实现
  
  
 # v0.6.0
 
 1. 新增支持配置模式：pattern operator-uri1 operator-uri2 ... operator-uriN （原来只支持operator-uri pattern1 pattern2 ... patternN）
 2. (实现中)新增支持配置pac代理：pattern pac://pac-url （pac-url为本地文件路径、或者http[s]的url、或者直接是一个values的key，或者是用 `()` 设置的值）
 3. (实现中)新增 `whistle update` 命令行及页面按钮用于一键更新whistle
 4. ... 
