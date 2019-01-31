# attachment

设置响应头字段，让响应变成可以直接下载，配置方式：

	pattern attachment://filename

filname指定下载文件保存的名称，如果filename为空，则会自动获取url对应的文件名称，如果url没有对应的文件名称，则默认为`index.html`

例子：

	www.ifeng.com attachment://ifeng.html

访问[www.ifeng.com](http://www.ifeng.com/)时会自动下载该页面。
