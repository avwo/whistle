# `%` 符号用法

通过插件管理界面可直观地配置各项参数，例如可以让 [whistle.autosave](https://github.com/whistle-plugins/whistle.autosave) 插件支持以下配置：
- 启用存储抓包数据
- 配置存储抓包数据目录

除管理界面外，您还可以直接在规则文件中使用 `%` 符号快速配置。

## 全局配置（对所有请求生效）
``` txt
%autosave=123
%autosave.enableAutoSave=true
%autosave.storageDir=/User/xxx/test/sessions
```

## 精细化配置（针对特定请求）
``` txt
www.test.com/api %autosave=abc
www.test.com/api %autosave.enableAutoSave=false [filters...]
www.test.com/api %autosave.storageDir= [filters...]
```

## 获取插件变量值
在插件的 Hooks 里面可以通过以下代码获取到配置的变量列表：

``` js
req.originalReq.globalPluginVars; // 全局变量，如 ['123', 'enableAutoSave=true', 'storageDir=/User/xxx/test/sessions']
req.originalReq.pluginVars; // 精细化配置的变量，如 ['abc', 'enableAutoSave=false', 'storageDir=']
```

## 开启规则自动提示
如果通过插件变量的配置项是固定的，可以通过插件的 `package.json` 里面的 `whistleConfig` 字段配置可选项，这样在规则中可以自动提醒：

#### 匿名 Key 值提示
``` js
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": {
      "hintList": [
        "test1",
        "test2",
        "test3"
      ]
    }
  },
  ...
}
```

<img src="/img/plugin-vars-hint-list.png" width="260" />

值和显示内容分离：

``` js
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": {
      "hintList": [
        {
          "text": "test1",
          "displayText": "displayText1"
        },
       {
          "text": "test2",
          "displayText": "displayText2"
        },
        {
          "text": "test3",
          "displayText": "displayText3",
          "help": "https://www.example.com/path"
        }
      ]
    }
  }
  ...
}
```
> `displayText` 和 `help` 都是可选，配置 `help: 帮助链接` 时，当选中该提醒时，键盘按 `F1` 键自动打开该帮助链接

<img src="/img/plugin-vars-display-list.png" width="220" />

#### 设置 Key 名称
``` js
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": {
      "hintList": [
        {
          "text": "test1",
          "displayText": "displayText1"
        },
       {
          "text": "test2",
          "displayText": "displayText2"
        },
        {
          "text": "test3",
          "displayText": "displayText3",
          "help": "https://www.example.com/path"
        }
      ],
      "hintSuffix": [
        "=",
        ".key1=123",
        ".key2"
      ]
    }
  }
  ...
}
```
<img src="/img/plugin-vars-key-hint.png" width="300" />

选中 `%test-plugin-vars=` 后会自动显示 `hintList` 的内容：

<img src="/img/plugin-vars-display-list.png" width="220" />

#### 借助后台接口

``` js
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": {
      "hintSuffix": [
        "=",
        ".key1=123",
        ".key2"
      ],
      "hintUrl": "/cgi-bin/plugin-vars"
    }
  }
  ...
}
```
> `hintList` 和 `hintUrl` 是互斥的，同时只能使用其中一个，`hintSuffix` 可选

<img src="/img/plugin-vars-hint-url1.png" width="260" />

<img src="/img/plugin-vars-hint-url2.png" width="260" />

`/cgi-bin/plugin-vars` 的实现参考：[插件开发文档](../extensions/dev#rules-hint)
