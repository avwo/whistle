# xrawfile

xrawfile 是 [rawfile](./rawfile) 规则的穿透版本，主要区别在于文件不存在时的处理方式：
- ✅ 文件存在时：返回本地文件内容（与 [rawfile](./rawfile) 规则行为一致）
- ❌ 文件不存在时：继续正常网络请求（而 [rawfile](./rawfile) 规则会返回 `404`）

## 规则语法
``` txt
pattern rawfile://value [filters...]
```

详细用法参考：[rawfile](./rawfile)
