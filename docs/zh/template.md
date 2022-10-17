# 规则模板
> Added in: v2.9.30

每个插件都可以生成以下三种规则：
1. `whistle.xxx://ruleValue`：可以触发非 `server` 的其它所有 hooks
2. `xxx://ruleValue`：可以触发所有 hooks
3. `%xxx=value1` 或 `%xxx.yyy=value2`：设置插件变量的规则

有些时候我们不想让每个请求都通过 hooks 获取规则，这样性能相对较慢且更耗 CPU，如果这类规则相对比较固定（唯一变量就是 `ruleValue`），这时可以在插件的 `rules.txt` 规则文件设置如下规则模板：
``` txt
# 注意下面模板的开头和结尾都是两个反引号 ``（有且只有两个反引号）

# 替换 `whistle.xxx://ruleValue`，其中 {{ruleValue}} 被换成 ruleValue
`` whistle.tpl
file://({{ruleValue}})
``

# 替换 `xxx://ruleValue`，其中 {{ruleValue}} 被换成 ruleValue
`` rule.tpl
file://({{ruleValue}})
``

# 替换 %xxx=value1，其中 {{ruleValue}} 被换成 value1
`` var.tpl
www.test.com/path/to file://({{ruleValue}})
``

# 替换 pattern %xxx=value1，其中 {{ruleValue}} 被换成 value1
`` _var.tpl
file://({{ruleValue}})
``

# 替换 %xxx.yyy=value2，其中 {{ruleValue}} 被换成 value1
`` _var.yyy.tpl
www.test.com/path/to file://({{ruleValue}})
``

# 替换 pattern %xxx.yyy=value2，其中 {{ruleValue}} 被换成 value1
`` _var.yyy.tpl
file://({{ruleValue}})
``


```
