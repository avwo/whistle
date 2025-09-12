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
| filters | Optional filters, supporting matching: • Request URL/Method/Header/Content • Response Status Code/Header | [Filters Documentation](./filters) |

- `important`: `!important` of type css attribute, increasing rule priority
- `disableAutoCors`: Disables automatic addition of necessary CORS (Cross-Origin Resource Sharing) headers for `file`(./file) protocol substitution requests
- `proxyHost`: Both `proxy`(./proxy)` and `host`(./host)` take effect simultaneously
- `proxyTunnel`: Used with `proxyHost`, allows the upstream proxy to tunnel to the upstream HTTP proxy. See the example below for details
- `proxyFirst`: Prioritizes `proxy`(./proxy)` rules
- `internal`：Apply `proxy`, `socks`, and `host` protocol drop rules to Whistle internal requests
- `safeHtml`: A security protection mechanism that is used when `htmlXxx`/`jsXxx`/`cssXxx` are used to add HTML When injecting content into a page, the response is checked to see if the first non-whitespace character is `{` or `[` (the opening characters of a JSON object). Injection is performed only if it is not. This effectively prevents accidental injection of non-standard HTML responses (such as JSON endpoints).
- `strictHtml`: This is a security mechanism. When injecting content into an HTML page using `htmlXxx`/`jsXxx`/`cssXxx`, the response is checked to see if the first non-whitespace character is `<`. Injection is performed only if it is not. This effectively prevents accidental injection of non-standard HTML responses (such as JSON interfaces).
- `enableUserLogin`: Sets whether to display the login dialog when a [statusCode://401](./statusCode) is displayed (disabled by default).
- `disableUserLogin`: Disables displaying the login dialog when a [statusCode://401](./statusCode) is set.

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
Accessing `https://www.example.com/path` returns the response content:
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
Visiting `https://www.example.com/path` returns the response content:
``` html
test
```
> `enable://strictHtml` applies to all rules

### Using `lineProps://strictHtml`
``` txt
www.example.com/path file://(test) resType://html
www.example.com/path htmlPrepend://(alert(1))
www.example.com/path jsPrepend://(alert(1)) lineProps://strictHtml
www.example.com/path cssPrepend://(alert(1))
```
Visiting `https://www.example.com/path` returns the following response:
``` html
<!DOCTYPE html>
<style>alert(1)</style>
alert(1)test
```
> `lineProps://strictHtml` only applies to the rules in the current line.
