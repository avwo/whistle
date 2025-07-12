# `%` 符号用法

通过插件管理界面可直观地配置各项参数，例如 [whistle.autosave](https://github.com/whistle-plugins/whistle.autosave) 插件支持以下配置：
- 启用存储抓包数据
- 配置存储抓包数据目录

除管理界面外，您还可以直接在规则文件中使用 % 符号快速配置。

## 全局配置（对所有请求生效）
``` txt
%autosave.enableAutoSave=true
%autosave.storageDir=/User/xxx/test/sessions
```

## 精细化配置（针对特定请求）
``` txt
www.test.com/api %autosave.enableAutoSave=true [filters...]
www.test.com/api %autosave.storageDir=/User/xxx/test/sessions [filters...]
```
