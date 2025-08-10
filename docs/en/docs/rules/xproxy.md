# xproxy (xhttp-proxy)

xproxy (xhttp-proxy) is a pass-through version of the [proxy](./proxy) rule. The main difference lies in how it handles connection failures to the target proxy:
- ✅ When a connection is established successfully: Behaves the same as the [proxy](./proxy) rule
- ❌ When a connection fails: Ignore the matching rule and continue the normal network request (while [proxy](./proxy) aborts the request).

## Rule Syntax
``` txt
pattern xproxy://value [filters...]
```

For detailed usage, see: [proxy](./proxy)
