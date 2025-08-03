# xfile

xfile 是 [file](./file) 规则的穿透版本，主要区别在于文件不存在时的处理方式：
- ✅ 文件存在时：返回本地文件内容（与 [file](./file) 规则行为一致）
- ❌ 文件不存在时：继续正常网络请求（而 [file](./file) 规则会返回 `404`）

## 规则语法
``` txt
pattern file://value [filters...]
```

详细用法参考：[file](./file)
