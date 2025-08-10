# xhost

xhost is a pass-through version of the [host](./host) rule. The main difference lies in how it handles request failures:
- ✅ Request normal: Behaves the same as the [host](./host) rule
- ❌ Request error: Ignore the matching rule and continue the normal network request (while [host](./host) aborts the request).

## Rule Syntax
``` txt
pattern xhost://value [filters...]
```

For detailed usage, see: [host](./host)
