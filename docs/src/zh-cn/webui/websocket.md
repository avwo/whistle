# websocket

whistle v1.6.0 开始支持 WebSocket 及一般 Socket 请求的抓包及构造请求，点击建立连接的 WebSocket(Socket) 请求，打开 右侧 `Response / Frames` 即可看到 WebSocket 的请求贞数据：

![WebSocket](https://raw.githubusercontent.com/avwo/whistleui/master/img/socket/frames.gif)

PS：如果是普通的 Socket 请求要通过 whistle 代理，要走 tunnel 代理，且代理的请求头要加个字段 `x-whistle-policy: tunnel`，这样 whistle 就会把这个请求当成一般的 socket 请求处理，且可以跟 WebSocket 一样进行抓包

也支持构造 WebSocket 请求和一般的 Socket 请求，通过 whistle 的 Composer 构造的 WebSocket 和 Socket 请求，还也自定义请求数据：

![Build WebSocket](https://raw.githubusercontent.com/avwo/whistleui/master/img/socket/composer.gif)


![Build Socket](https://raw.githubusercontent.com/avwo/whistleui/master/img/socket/socket.gif)



PS：通过 Composer 构造的请求 Frames 多了一个 Composer 选项，可以通过该模块发送数据到服务器，也可以通过拖拽文件到此把文件里面的数据发送到后台；构造 Socket 请求的 url 为 `CONNECT` 方法，或者 schema 为：`conn:`、`connect:`、`socket:`、`tunnel:`，如果 `conn://127.0.0.1:9999`，上述图中本地服务器代码为：

	const net = require('net');

	const port = 9999;
	const server = net.createServer();
	server.on('connection', (s) => {
	  s.on('error', () => {});
	  s.on('data', (data) => {
	    s.write(`Response: ${data}`);
	  })
	});
	server.listen(port);
	



如果对一般的请求也要像构造请求一样可以自定义发送或接收数据，需要借助插件 [whistle.script](https://github.com/whistle-plugins/whistle.script)，具体参见文章：[利用 whistle 调试 WebSocket 和 Socket 请求](http://imweb.io/topic/5a11b1b8ef79bc941c30d91a)
