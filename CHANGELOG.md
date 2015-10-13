# v0.3.11

fix配置某些带端口号正则的时候可能导致系统奔溃的情况

# v0.3.12

fix如果请求包含content-length导致weinre无法注入的bug

# v0.4.0

1. 菜单 `Rules`、`Values`、`Weinre`，hover出现列表（原来需要点击才能出现列表）
2. 优化请求列表的性能
3. 新增 `css`、`html`、`js` 3个协议，分别用来注入css、js、html到html页面，或css代码到css文件，js代码到js文件的底部。这个与resPrepend、resBody、resAppend的区别是：系统会自动判断响应的类型来选择注入