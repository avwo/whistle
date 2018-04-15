# 快速入门

> 推荐看这篇文章：[whistle 工具全程入门](http://imweb.io/topic/596480af33d7f9a94951744c)

按 [上述方法](install.md) 安装好 whistle 后，用 Chrome 浏览器打开配置页面: [http://local.whistlejs.com](http://local.whistlejs.com/)

如图[Rules](webui/rules.md)，whistle 的 Rules 配置页面有一个默认分组 `Default`，用户也可以通过上面的菜单栏按钮 `Create`、`Edit`、`Delete` 分别创建、重命名、删除自定义分组，whistle 先在选中的用户自定义分组中从上到下依次匹配，然后再到 `Default` 中匹配(如果 `Default` 分组被启用的情况下)。

点击页面上方菜单栏的 `Create` 按钮，新建一个名为 `test` 的分组，并参照下面例子输入对应的规则配置。

1. 设置 hosts

	指定 [www.ifeng.com](http://www.ifeng.com/) 的 ip:
	```
  www.ifeng.com 127.0.0.1
  # or
  127.0.0.1 www.ifeng.com
	```

  指定 [www.ifeng.com](http://www.ifeng.com/) 的 ip 和端口，把请求转发到本地 8080 端口，这个在平时开发中可以用来去掉 url 中的端口号:

	```
  # www.ifeng.com 127.0.0.1
  www.ifeng.com 127.0.0.1:8080
  # or
  127.0.0.1:8080 www.ifeng.com
  ```

	也可以用某个域名的 ip 设置 hosts

  ```
  www.ifeng.com host://www.qq.com:8080
  # or
  host://www.qq.com:8080 www.ifeng.com
	```
 更多匹配方式参考：[匹配方式](pattern.md)

2. 本地替换

	平时开发中经常会用到这个功能，把响应替换成本地文件内容。

	```
  # Mac、Linux
  www.ifeng.com file:///User/username/test
  # or www.ifeng.com file:///User/username/test/index.html

  # Windows 的路径分隔符可以用 \ 或者 /
  www.ifeng.com file://E:\xx\test
  # or www.ifeng.com file://E:\xx\test\index.html
	```

	[http://www.ifeng.com/](http://www.ifeng.com/)会先尝试加载 `/User/username/test` 这个文件，如果不存在，则会加载 `/User/username/test/index.html`，如果没有对应的文件则返回 404。

	[http://www.ifeng.com/xxx](.md)会先尝试加载 `/User/username/test/xxx` 这个文件，如果不存在，则会加载 `/User/username/test/xxx/index.html`，如果没有对应的文件则返回 404。

	也可以替换 jsonp 请求，具体参见[tpl](rules/rule/tpl.md)

3. 请求转发

	[www.ifeng.com](http://www.ifeng.com/)域名下的请求都替换成对应的 www.aliexpress.com 域名

  ```
	www.ifeng.com www.aliexpress.com
	```

4. 注入 html、js、css

	whistle 会自动根据响应内容的类型，判断是否注入相应的文本及如何注入(是否要用标签包裹起来)。

  ```
  # Mac、Linux
  www.ifeng.com html:///User/xxx/test/test.html
  www.ifeng.com js:///User/xxx/test/test.js
  www.ifeng.com css:///User/xxx/test/test.css

  # Windows 的路径分隔符可以用 `\` 和 `/`
  www.ifeng.com html://E:\xx\test\test.html
  www.ifeng.com js://E:\xx\test\test.js
  www.ifeng.com css://E:\xx\test\test.css
	```

  所有 www.ifeng.com 域名下的请求，whistle 都会根据响应类型，将处理好的文本注入到响应内容里面，如是 html 请求，js 和 css 会分别自动加上 `script` 和 `style` 标签后追加到内容后面。

5. 调试远程页面

	利用 whistle 提供的 [weinre](rules/weinre.md) 和 [log](rules/log.md) 两个协议，可以实现修改远程页面 DOM 结构及自动捕获页面 js 错误及 console 打印的信息，还可以在页面顶部或 js 文件底部注入指定的脚步调试页面信息。

	使用 whistle 的功能前，先把要相应的系统代理或浏览器代理指向 whistle，如何设置可以参考：[安装启动](install.md)

	weinre：

	```
	www.ifeng.com weinre://test
	```

	配置后保存，打开[www.ifeng.com](http://www.ifeng.com/)，鼠标放在菜单栏的 weinre 按钮上会显示一个列表，并点击其中的 `test` 项打开 weinre 的调试页面选择对应的 url 切换到 Elements 即可。

	log:

	```
	www.ifeng.com log://{test.js}
	```

	配置后保存，鼠标放在菜单栏的 weinre 按钮上会显示一个列表，并点击其中的 `test.js` 项，whistle 会自动在 Values 上建立一个 test.js 分组，在里面填入 `console.log(1, 2, 3, {a: 123})` 保存，打开 Network -> 右侧 Log -> Page，再打开[www.ifeng.com](http://www.ifeng.com/)，即可看到 Log 下面的 Page 输出的信息。

6. 手机设置代理

<div style="display:-webkit-box;display:flex;">
  <div style="display:inline-block;width:40%;margin-left:5%;">
    <img src="https://avwo.github.io/whistle/img/iOS_proxy_settings.png" alt="iOS" style="display:block;width:100%;">
    <br>
    <p style="text-align:center">iOS</p>
  </div>
  <div style="display:inline-block;width:40%;margin-left:5%;">
    <img src="https://avwo.github.io/whistle/img/Android_proxy.png" alt="Android" style="display:block;width:100%;">
    <br>
    <p style="text-align:center">Android</p>
  </div>
</div>


更多功能请参考：[协议列表](rules.md)
