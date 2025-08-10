# xsocks

xsocks is a pass-through version of the [socks](./socks) rule. The main difference lies in how it handles connection failures to the target proxy:
- ✅ When the connection is established successfully: Behaves the same as the [socks](./socks) rule
- ❌ When the connection fails: Ignore the matching rule and continue the normal network request (while [socks](./socks) aborts the request).

## Rule Syntax
``` txt
pattern xsocks://value [filters...]
```

For detailed usage, see [socks](./socks)
