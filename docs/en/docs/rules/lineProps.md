# lineProps
Enable features such as proxyHost, proxyTunnel, and safeHtml through rules.
> 📌 Differences from [enable](./enable):
>
> `enable` is a global configuration.
>
> `lineProps` only applies to the rule on the line where the configuration is located.

## Rule Syntax
``` txt
pattern operation lineProps://action1|action2|... [filters...]

# Equivalent to:
pattern operation lineProps://action1 lineProps://action2 ... [filters...]
```
> `lineProps` cannot be used as an `operation` alone and only applies to the `operation` on the same line.

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| operation | Operation Instructions | [Operation Instruction Documentation](./operation) |
| action | Specific actions, see the description below | |
| filters | Optional filters, supporting matching: • Request URL/Method/Header/Content • Response Status Code/Header | [Filter Documentation](./filters) |

- `important`: Like CSS !important, boosts rule priority; only applies to operations of the same protocol
- `safeHtml`: This is a security protection mechanism. When injecting content into an HTML page using `htmlXxx`/`jsXxx`/`cssXxx`, the first non-whitespace character in the response is checked to see if it is a `{` or a `[` (the opening character of a JSON object). Injection is performed only if it is not. This effectively prevents accidental injection of non-standard HTML responses (such as JSON endpoints).
- `strictHtml`: This is a security protection mechanism. When injecting content into an HTML page using `htmlXxx`/`jsXxx`/`cssXxx`, the first non-whitespace character in the response is checked to see if it is a `<`. Injection is performed only if it is not. This effectively prevents accidental injection of non-standard HTML responses (such as JSON endpoints).
- `disableAutoCors`: Disables automatic addition of necessary CORS (Cross-Origin Resource Sharing) headers for [file](./file) protocol substitution requests.
- `disableUserLogin`: Disables displaying the login dialog when setting [statusCode://401](./statusCode).
- `enableUserLogin`: Enables displaying the login dialog when setting [statusCode://401](./statusCode). (Shown by default, disables `disable.userLogin`).
- `internal`: Applies `proxy`, `socks`, and `host` protocol drop rules to Whistle internal requests.
- `internalOnly`: Applies `proxy`, `socks`, and `host` protocol drop rules to Whistle internal requests only.
- `internalProxy`: Uses proxy protocols like `proxy` and `socks` to forward requests to another proxy server (such as another Whistle proxy server). When this feature is enabled, HTTPS requests decrypted by the first-tier proxy will be transmitted in plaintext throughout the proxy chain, allowing upstream proxies to directly access the plaintext data.
- `proxyFirst`: give priority to the [proxy](./proxy) rule (by default, both `host` and `proxy` are matched, and only `host` takes effect)
- `proxyHost`: Both the [proxy](./proxy) and [host](./host) rules take effect.
- `proxyHostOnly`: Functions similarly to `proxyHost`, but if no [host](./host) matches, the [proxy](./proxy) rule will be automatically disabled.
- `proxyTunnel`: Used with `proxyHost`, it allows the upstream proxy to tunnel to the upstream HTTP proxy. See the example below for details.
- `weakRule`: By default, the `weakRule` rule will be disabled when protocols such as [file](./file) are configured. By setting the `weakRule` property, you can increase the priority of the `proxy` (./proxy) rule, ensuring it still works in the above scenario.

## Configuration Example
#### Without `lineProps://important`
``` txt
www.example.com/path file:///User/xxx/important1.html
www.example.com/path file:///User/xxx/important2.html
```
Accessing `https://www.example.com/path` will match `file:///User/xxx/important1.html`

#### Using `lineProps://important`
``` txt
www.example.com/path file:///User/xxx/important1.html
www.example.com/path file:///User/xxx/important2.html lineProps://important
```
Accessing `https://www.example.com/path` will match `file:///User/xxx/important2.html`

#### Inject text
``` txt
www.example.com/path file://(test) resType://html
www.example.com/path htmlPrepend://(alert(1))
www.example.com/path jsPrepend://(alert(1))
www.example.com/path cssPrepend://(alert(1))
```
Visit `https://www.example.com/path` and return the response content:
``` html
<!DOCTYPE html>
<style>alert(1)</style>
alert(1)
<script>alert(1)</script>test
```

#### Use `enable://strictHtml`
``` txt
www.example.com/path file://(test) resType://html
www.example.com/path htmlPrepend://(alert(1))
www.example.com/path jsPrepend://(alert(1)) enable://strictHtml
www.example.com/path cssPrepend://(alert(1))
```
Visit `https://www.example.com/path` and return the response content:
``` html
test
```
> `enable://strictHtml` is effective for all rules

### Use `lineProps://strictHtml`
``` txt
www.example.com/path file://(test) resType://html
www.example.com/path htmlPrepend://(alert(1))
www.example.com/path jsPrepend://(alert(1)) lineProps://strictHtml
www.example.com/path cssPrepend://(alert(1))
```
Visit `https://www.example.com/path` Return response content:
``` html
<!DOCTYPE html>
<style>alert(1)</style>
alert(1)test
```
> `lineProps://strictHtml` only applies to the line where the rule is located
