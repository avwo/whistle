# websocket
whistle v1.6.0开始支持WebSocket及一般Socket请求的抓包及构造请求，点击建立连接的WebSocket(Socket)请求，打开 右侧 `Response / Frames` 即可看到WebSocket的请求帧数据：

![WebSocket](https://user-images.githubusercontent.com/11450939/122701249-6610f900-d27f-11eb-945d-eca29d163063.gif)

PS：如果是普通的Socket请求要通过whistle代理，要走tunnel代理，且代理的请求头要加个字段 `x-whistle-policy: tunnel`，这样whistle就会把这个请求当成一般的socket请求处理，且可以跟WebSocket一样进行抓包

也支持构造WebSocket请求和一般的Socket请求，通过whistle的Composer构造的WebSocket和Socket请求，还也自定义请求数据：

![Build WebSocket](https://user-images.githubusercontent.com/11450939/122701285-775a0580-d27f-11eb-8257-49f70edf6a08.gif)


![Build Socket](https://user-images.githubusercontent.com/11450939/122701238-5f828180-d27f-11eb-99b5-2da593a67b3b.gif)



PS：通过Composer构造的请求Frames多了一个Composer选项，可以通过该模块发送数据到服务器，也可以通过拖拽文件到此把文件里面的数据发送到后台；构造Socket请求的url为 `CONNECT` 方法，或者schema为：`conn:`、`connect:`、`socket:`、`tunnel:`，如果 `conn://127.0.0.1:9999`，上述图中本地服务器代码为：

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




如果对一般的请求也要像构造的请求一样可以自定义发送或接收数据，需要借助插件[whistle.script](https://github.com/whistle-plugins/whistle.script)，具体参见文章：[利用whistle调试WebSocket和Socket请求](http://imweb.io/topic/5a11b1b8ef79bc941c30d91a)
