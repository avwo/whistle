# xsocks

xsocks 是 [socks](./socks) 规则的穿透版本，主要区别在于跟目标代理建立连接失败时的处理方式：
- ✅ 建立连接成功时：与 [socks](./socks) 规则行为一致
- ❌ 建立连接失败时：忽略该匹配规则，继续正常网络请求（而 [socks](./socks) 中断请求）

## 规则语法
``` txt
pattern xsocks://value [filters...]
```

详细用法参考：[socks](./socks)
