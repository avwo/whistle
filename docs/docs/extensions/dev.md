# 开发插件
您已了解插件的各项功能特性（参考[使用文档](/usage)），现在我们将通过模块化方式演示具体实现。
> 每个核心功能作为独立插件实现，保持单一职责原则，实际开发中可自由拼装这些功能模块。

## 准备工作
1. 创建一个空目录，如：`dev-examples`
2. 安装脚手架 [lack](https://github.com/avwo/lack)：
   ``` txt
    npm i -g lack
   ```
## rules.txt
插件的默认规则文件：
- 插件安装后会自动加载生效
- 优先级低于界面 Rules 规则
- 插件被禁用立即失效

创建包含 `rules.txt` 规则文件的插件：
1. 

## reqRules.txt


## resRules.txt


## auth


## sniCallback


## reqRulesServer


## resRulesServer


## reqStatsServer


## resStatsServer



## server


## pipe


## 插件操作界面


## 插件变量配置


## 插件变量配置


## Network 右侧一级 Tab


## Network / Inspectors 二级 Tab


## Network / Inspectors 三级 Tab


## Network / Composer 二级 Tab


## Network / Tools 二级 Tab


## Network 上下文菜单


## Rules 上下文菜单


## Values 上下文菜单


所有功能示例的完整实现代码已托管至 GitHub 仓库：
https://github.com/whistle-plugins/examples
