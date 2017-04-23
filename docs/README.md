# whistle

> Github(欢迎+Star): [https://github.com/avwo/whistle](https://github.com/avwo/whistle)

[whistle](https://github.com/avwo/whistle)是一款用[Node](https://nodejs.org/)实现的跨平台的Web调试代理工具，支持查看修改http(s)、Websocket连接的请求和响应内容。

## 关于whistle

whistle继承了[Fiddler](http://www.telerik.com/fiddler/)、[Charle](https://www.charlesproxy.com/)的一些优秀设计(如Fiddler请求数据的展示界面)，这两者分别是Windows、macOS平台的优秀代理工具。但whistle不是Fiddler、Charles的复制品，whistle有自己独特丰富的功能，如日志系统[log](webui/log.html)、移动调试工具[weinre](webui/weinre.html)、[插件机制](plugins.html)等。whistle也对操作请求和响应的方式做了改进，通过扩展系统hosts的配置方式及匹配方式，同时支持域名、正则和路径的匹配方式，让所有请求和响应的操作都可以通过类似hosts的配置方式实现，最新版whistle更是支持带端口号的host配置。不仅如此，开发者也可以通过whistle的插件扩展实现自身的个性化功能。实践证明这种方式使用起来方便，用户体验非常好。

<!-- 去掉Fiddler只能通过断点的修改请求响应数据的方式 -->

## 实现原理

首先，whistle把每类操作(如修改请求头的`referer`)抽象成一个URI协议(如`referer://`)，每个具体操作都通过其对应协议及该协议后面的若干参数来描述；接着whistle把操作的URI协议及若干参数合成一个操作URI(如修改referer: `referer://http://wproxy.org`)；最后，whistle把对请求的响应操作转换成请求url到操作URI的匹配(whistle提供了更加丰富的域名、路径、正则三种匹配方式)。

whistle又是如何把操作的URI协议及其参数合成一个操作URI？首先，按参数的个数分成两类：

1. 单参数的情形
  
  所谓单参数的操作类型指操作最多只有一个变量值，如：修改请求方法之一传人新的方法名称，修改请求referer只需传人新的url即可。对这种类型的操作，只需把变量值追加到协议后面即可，即：
  ```
  pattern protocol://value
  ```
    
  由于URI里面不能有空白字符，如果value有空白字符，可以把变量值即value存放在whistle的Values系统(key:value形式)，然后通过`pattern protocol://{key}`的方式传值，whistle会自动到Values里面加载`key`对应的值(如果value对应的是本地文件路径可以用`%20`替换空格)。

2. 多参数的情形

  所谓多参数的操作类型指操作可以传人大于1个参数的情形，如：添加或修改请求响应头部字段。对这类型操作，需要传人一个`key:value`集合给whistle(whistle内部把这个集合转成一个JSON对象)，whistle采用把操作协议和`key:value`集合合成一个URI:
  
  - 请求参数的模式
    ```
    pattern protocol://key1=value1&key2=value2&keyN=valueN
    ```

    如果key或value有空白字符用`encodeURIComponent`转换成实体编码，whistle会自动通过Node的`querystring.parse`把URI里面的值解析成JSON对象。
    
  - 利用[操作符](webui/rules.html)`()`
    ```
    pattern protocol://({"key1":"value1","key2":"value2","keyN":"valueN"})
    ``` 
    这种情况下`key:value`不能空白字符。
    
  - 通用方式

    对这类型操作whistle支持把`key:value`存放在whistle的Values系统或者本地文件里面
    ```
    # 存放在whistle的Values里面
    pattern protocol://{key}
    
    # 存放在Windows系统的文件里面
    # 在Windows中路径分割符`\`和`/`通用
    pattern protocol://E:\xxx
    # or
    pattern protocol://E:/xxx

    # 存放在非Windows系统的文件里面
    pattern protocol:///xxx
    ```

    `key:value`在这些系统里面可以采用如下3种格式描述：
    
    - 请求参数格式
      
        key1=value1&key2=value2&keyN=valueN
      
    - 分割符(`:空格`)格式
        
        key1: value1
        key2: value2
        keyN: valueN
    
    - JSON格式

        {
          "key1": value1,
          "key2": value2,
          "keyN": valueN
        }
        
      第三种格式可以支持任意字符。

最后，我们把所有操作抽象成如下方式：

  pattern operator-uri
  
其中，`pattern`可以参考[匹配方式](pattern.html)，`operator-uri`可以参考[协议列表](rules/index.html)。


whistle的配置是从采用左到右的模式(即：`pattern operator-uri`)，从上到下的优先顺序，为了兼容传统的hosts配置模式，whistle也支持如下的配置模式：

1. 调换位置

  如果`pattern`为正则，或者`operator-uri`为ip、或存在非http(s)的协议，`pattern`和`operator-uri`的位置可以对调：
  
    operator-uri pattern
  
2. 组合模式

    pattern operator-uri1 operator-uri2 operator-uriN
    
  如果pattern1为正则，或者`operator-uri`为ip、或存在非http(s)的协议，也可以写成：
  
    operator-uri pattern1 pattern2 patternN
    
  
## License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)


<!-- 
[1]:https://github.com/avwo/whistle "whistle"
[2]:https://nodejs.org/ "Node"
[3]: http://www.telerik.com/fiddler/ "Fiddler"
[4]:https://www.charlesproxy.com/ "Charles" 
-->
