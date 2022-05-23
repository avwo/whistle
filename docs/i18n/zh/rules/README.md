# 规则详解
如 [快速上手](../quickstart.md) 所示，Whistle 所有操作都可以通过配置如下规则的方式实现：

``` txt
pattern operator [filters...]
```

其中：
1. `pattern`：为匹配请求 URL 的表达式，可以为 `域名`、`路径`、`正则表达式`、`通配符` 详见：[匹配方式](./pattern/README.md)
2. `operator`：为操作请求的表达式，由 `protocol://ruleValue` 组成，`protocol` 为操作类型（如：修改请求方法的协议 `method`，`ruleValue` 为操作值（如：`method://get` 把请求方法改成 `GET`） 详见：[修改请求](./modify/README.md)、[转发请求](./modify/README.md)、[控制请求](./modify/README.md)、[操作值](./values/README.md)
3. `filters`：可选，过滤匹配到的规则，支持过滤掉指定 `操作协议`、`url`、`请求方法`、`请求头`、`请求内容`、`响应状态码`、`响应头`等，详见：(./filters/README.md)

除此之外，还支持以下写法：
### 支持设置多个 `operator`
``` txt
pattern operator1 operator2 operator3... [filters...]
```

### 支持 `pattern` 和 `operator` 对调
如果 `operator` **不是 `url`** 也可以写成：

``` txt
operator pattern [filters...]
```

如果 `operator1`、`operator2`、`operator3...` **不是 `url`** 也可以写成：

``` txt
operator1 operator2 operator3... pattern [filters...]
```

## 例如

``` txt
ke.qq.com/admin jsAppend://(alert(123)) includeFilter://resH.content-type=text/html enable://strictHtml
```

上述规则表示 `//ke.qq.com/admin` 及其子路径  `//ke.qq.com/admin/path/to` 请求如果响应类型包含 `text/html`（即为 html 页面），且响应内容第一个非空字符为 `<` 时，注入 JS 脚本 `alert(123)`（`enable://strictHtml` 可以避免一些设置错响应类型的接口误注入脚本导致前端处理失败，也可以设置 `enable://safeHtml` 表示响应内容第一个非空字符不能为为 `{` 或 `[`），其中：
1. `pattern` 为 `ke.qq.com/admin`
2. `operator` 为 `jsAppend://(alert(123))` 及 `enable://strictHtml`
3. `filters` 为 `includeFilter://resH.content-type=text/html ` （可设置多个）

# 规则详解完整文档
1. [修改请求](./modify/README.md)
2. [转发请求](./modify/README.md)
3. [控制请求](./modify/README.md)
4. [过滤规则](./filters/README.md)
4. [匹配方式](./pattern/README.md)
5. [操作值](./values/README.md)

# 其它文档
