# 常用功能及配置模版

> `#`开头的表示注释

## 1. 绑定转发

```
## disable,对某些域名不拦截
## 一般放到 Default 分组
/wx.qq.com/ disable://intercept
## filter,在Network不会出现某些域名的请求
/qq.com/ filter://hide

## socks
## 一般放到 Default 分组
/facebook/ socks://127.0.0.1:1080
/vk.com/ socks://127.0.0.1:1080
/google/ socks://127.0.0.1:1080

## 一般场景是调试内嵌APP页面，APP内有一个入口链接a，而调试的目标页面是b
## 通过以下一行配置，页面a会自动换成页面b
m.aliexpress.com/a.html m.aliexpress.com/b.html

## 绑定
## a.b.c.d 是某个环境的ip地址
## 有时通过多个域名的方式来部署多套开发环境
## 通过以下两行配置可以屏蔽开发环境域名与线上不一致的情况
m.aliexpress.com mm.aliexpress.com
mm.aliexpress.com a.b.c.d
```

### 2. req
```
## ua
m.aliexpress.com ua://{wp_ua}
#m.aliexpress.com ua://{ali_ua}

## referrer
m.aliexpress.com referer://https://vk.com/
## referrer null
#m.aliexpress.com referer://

## reqHeaders，修改请求头
## ua、referer协议都可以通过reqHeaders来完成
m.aliexpress.com reqHeaders://{req-headers}
```


**values**
```
{wp_ua}
  Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Microsoft; RM-1113) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Mobile Safari/537.36 Edge/13.10586

{req-headers}
  {
    "X-Forwarded-For":" 188.146.171.71",
    "X-Real-IP":" 188.146.171.71",
    "X-Client-Scheme":"https",
    "referer":"https://vk.com/",
    "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1 AliApp(H/5)"
  }
```



## 3. res
```
## file，本地调试是其典型的使用场景
m.aliexpress.com/sw.js file:///path/to/your/local/sw.js
## xfile
#m.aliexpress.com/sw.js xfile:///path/to/your/local/sw.js

## tpl，常用于mock jsonp请求
aliexpress.com/query.jsonp tpl://{res-jsonp}
## xtpl，同tpl，本地不存在时走线上
aliexpress.com/query.jsonp xtpl://{res-jsonp}

## resHeaders，修改响应头
ae01.alicdn.com resHeaders://{res-cors}

## html，往html文档(</body>之前)追加html标签(script,style or normal html tag)
m.aliexpress.com html://{html-test}

## js，往js响应追加脚本，如果响应是html文档，则自动用`<script></script>`包装后插入
m.aliexpress.com/sw.js js://{js-test}

## css，往css响应追加样式，如果响应是html文档，则自动用`<style></style>`包装后插入
## `/`可以起到仅对首页追加的效果
m.aliexpress.com/ css://{css-test}

## resReplace，替换响应的某些字符串
## 一般可用来快速验证某些功能
m.aliexpress.com resReplace://{res-replace}
```

**values**
```
{res-jsonp}: whistle会用请求对应的callback值来替换{callback}
  {callback}({
      "ec": 0,
      "list":[{
            "id":1,
            "price":"US $100",
              "stock":"100",
              "imgUrl":"https://ae01.alicdn.com/kf/HTB12x0CLpXXXXajaXXX760XFXXXS.png_640x640.png"
          },...
        ]
  });

{html-test}
  <script>
  // make an error
  x.x;
  </script>

{js-test}
  fetch("/").then(res=>{console.log("fetched!")});

{css-test}
  body{
    font-size:15px;
  }

{res-cors}
  {
    "access-control-allow-origin":"*",
    "access-control-expose-headers":"Via"
  }

{res-replace}
  <meta name="screen-orientation" content="portrait">: <meta name="apple-itunes-app" content="app-id=436672029">

```




## 4. debugging
```
m.aliexpress.com weinre://debug
m.aliexpress.com log://{log-test}
```

**values**
```
{log-test}
  console.log("Yeah!")
```
