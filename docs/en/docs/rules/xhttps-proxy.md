# xhttps-proxy

xhttps-proxy is a pass-through version of the [https-proxy](./https-proxy) rule. The main difference lies in how it handles connection failures to the target proxy:
- ✅ When a connection is established successfully: Behaves the same as the [https-proxy](./https-proxy) rule
- ❌ When a connection fails: Ignore the matching rule and continue the normal network request (while [https-proxy](./https-proxy) aborts the request).

## Rule Syntax
``` txt
pattern xhttps-proxy://value [filters...]
```

For detailed usage, see [https-proxy](./https-proxy)
