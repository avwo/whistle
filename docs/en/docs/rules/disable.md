# disable
Disable HTTPS, hide requests, terminate requests, and other features through rules.

## Rule Syntax
``` txt
pattern disable://action1|action2|... [filters...]

# Equivalent to:
pattern disable://action1 disable://action2 ... [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| action | Specific action, see the description below | |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

- `301`: Disable `301` redirects, force `301` to `302` (can also use [replaceStatus](./replaceStatus))
- `abort`: Disable the abort feature, see: [enable](./enable)
- `abortReq`: Disable the abortReq feature, see: [enable](./enable)
- `abortRes`: Disable the abortRes feature, see: [enable](./enable)
- `authCapture`: Disable the `authCapture` feature, see: [enable](./enable)
- `auto2http`: Disable the auto2http feature, see: [enable](./enable)
- `autoCors`: When using the [file](./file) protocol to replace requests, if Whistle detects that the request is a cross-origin request, it automatically adds necessary CORS (Cross-Origin Resource Sharing) headers. This can be disabled via `disable://autoCors`
- `ajax`: Remove the request header `x-requested-with`
- `bigData`: Disable the bigData feature, see: [enable](./enable)
- `capture` or `https`: Disable `Enable HTTPS`, see: [enable](./enable)
- `captureIp`: Disable the captureIp feature, see: [enable](./enable)
- `captureStream`: Disable the captureStream feature, see: [enable](./enable)
- `clientCert`: Disable the clientCert feature, see: [enable](./enable)
- `clientId`: Remove the request header `x-whistle-client-id`
- `clientIp`: Remove the request header `x-forwarded-for`
- `customParser`: Disable the customParser feature, see: [enable](./enable)
- `cache`: Disable caching
- `dnsCache`: Disable DNS caching
- `csp`: Disable CSP
- `cookies`: Disable cookies for requests and responses
- `reqCookies`: Disable request cookies
- `resCookies`: Disable response cookies
- `flushHeaders`: Disable the flushHeaders feature, see: [enable](./enable)
- `forHttp`: Disable the forHttp feature, see: [enable](./enable)
- `forHttps`: Disable the forHttps feature, see: [enable](./enable)
- `forceReqWrite`: Disable the forceReqWrite feature, see: [enable](./enable)
- `forceResWrite`: Disable the forceResWrite feature, see: [enable](./enable)
- `gzip`: Disable response compression
- `h2`: Disable the h2 feature, see: [enable](./enable)
  > Disable: Whistle proxy -xx-> server enables HTTP2
- `http2`: Disable the http2 feature, see: [enable](./enable)
  > Disable: Browser -xx-> Whistle proxy -xx-> server all enable HTTP2
- `httpH2`: Disable the httpH2 feature, see: [enable](./enable)
  > Disable: Whistle proxy -xx-> server HTTP requests enable HTTP2
- `hide`: Disable the hide feature, see: [enable](./enable)
- `hideComposer`: Disable the hideComposer feature, see: [enable](./enable)
- `hideCaptureError`: Disable the hideCaptureError feature, see: [enable](./enable)
- `interceptConsole`: Disable the interceptConsole feature, see: [enable](./enable)
- `internalProxy`: Disable the internalProxy feature, see: [enable](./enable)
- `proxyFirst`: Disable prioritizing the use of [proxy](./proxy) rules
- `proxyHost`: Disable the proxyHost feature, see: [enable](./enable)
- `proxyTunnel`: Disable the proxyTunnel feature, see: [enable](./enable)
- `keepCSP`: Disable the keepCSP feature, see: [enable](./enable)
- `keepAllCSP`: Disable the keepAllCSP feature, see: [enable](./enable)
- `keepCache`: Disable the keepCache feature, see: [enable](./enable)
- `keepAllCache`: Disable the keepAllCache feature, see: [enable](./enable)
- `keepAlive`: Disable caching of request connections
- `keepClientId`: Disable the keepClientId feature, see: [enable](./enable)
- `keepH2Session`: No need for each TUNNEL connection to correspond to one HTTP2 connection (default is `yes`, recommended to use default)
- `safeHtml`: Disable the safeHtml feature, see: [enable](./enable)
- `strictHtml`: Disable the strictHtml feature, see: [enable](./enable)
- `proxyConnection`: Set `proxy-connection: close` when forwarding requests via proxy, socks, or other proxy protocols
- `ua`: Remove the request header `user-agent`
- `proxyUA`: Remove the request header `user-agent` when forwarding requests via proxy, socks, or other proxy protocols
- `referer`: Disable `referer`
- `rejectUnauthorized`: Set `rejectUnauthorized` to `true`
- `requestWithMatchedRules`: Disable the requestWithMatchedRules feature, see: [enable](./enable)
- `responseWithMatchedRules`: Disable the responseWithMatchedRules feature, see: [enable](./enable)
- `secureOptions`: Disable the default `options` for establishing HTTP2 connections
- `timeout`: Disable request timeout settings
- `trailerHeader`: Remove the response header `trailer`
- `trailers`: Remove trailers
- `tunnelAuthHeader`: Remove the proxy authentication header `proxy-authorization`
- `tunnelHeadersFirst`: Disable the tunnelHeadersFirst feature, see: [enable](./enable)
- `useLocalHost`: Disable the useLocalHost feature, see: [enable](./enable)
- `useSafePort`: Disable the useSafePort feature, see: [enable](./enable)
- `userLogin`: Disable showing the login box when setting [statusCode://401](./statusCode)
- `weakRule`: Disable the weakRule feature, see: [enable](./enable)

## Configuration Example
``` txt
# Disable request caching and remove cache fields from both request and response headers.
# Unlike the cache protocol, cache only sets cache headers for responses.
wwww.example.com/path disable://cache

# Disable cookies for both requests and responses.
wwww.example.com/path disable://cookies

# Disable cookies for requests only.
wwww.example.com/path disable://reqCookies

# Disable cookies for responses only.
wwww.example.com/path disable://resCookies

# Remove user-agent.
wwww.example.com/path disable://ua

# Delete the referer
wwww.test.com/path disable://referer

# Delete the CSP policy
wwww.test.com/path disable://csp

# Disable the timeout. By default, Whistle will consider a request timed out if no data is transferred within 36 seconds.
wwww.test.com/path disable://timeout

# Convert 301 responses to 302s to prevent caching
wwww.test.com/path disable://301

# Disable HTTPS interception
wwww.test.com/path disable://capture

# Do not cache DNS results
wwww.test.com/path disable://dnsCache

# Disable proxy server request connection reuse
wwww.test.com/path disable://keepAlive

# Delete the `x-requested-with` request header
wwww.test.com/path disable://ajax

# You can also disable multiple requests simultaneously.
www.example.com/path disable://cache|cookies|ua|referer|csp|timeout|301|intercept|dnsCache|keepAlive|autoCors
```

Association operation: [enable](./enable)

