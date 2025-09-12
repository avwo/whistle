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

- `capture` or `https`: Disable `Enable HTTPS`
- `authCapture`: Disable the `authCapture` feature, see [enable](./enable) for details
- `abort`: Disable abort For details, see: [enable](./enable)
- `abortReq`: Disables the abortReq feature. For details, see: [enable](./enable)
- `abortRes`: Disables the abortRes feature. For details, see: [enable](./enable)
- `gzip`: Disables response content compression
- `proxyHost`: Disables the proxyHost feature. For details, see: [enable](./enable)
- `proxyTunnel`: Disables the proxyTunnel feature. For details, see: [enable](./enable)
- `proxyFirst`: Disables the use of the proxy rule first
- `http2`: Disables the http2 feature. For details, see: [enable](./enable)
  > Disabled: Browser -xx-> Whistle Proxy -xx-> Enable HTTP2 for all servers
- `h2`: Disables the h2 feature. For details, see: [enable](./enable)
  > Disabled: Whistle Proxy -xx-> Enable HTTP2 for the server
- `httpH2`: Disables httpH2 For details, see: [enable](./enable)
  > Disabled: Whistle Proxy -xx-> Enable HTTP2 for HTTP requests to the server
- `safeHtml`: Disables the safeHtml feature. For details, see: [enable](./enable)
- `strictHtml`: Disables the strictHtml feature. For details, see: [enable](./enable)
- `clientIp`: Removes the x-forwarded-for request header
- `bigData`: Disables the bigData feature. For details, see: [enable](./enable)
- `forceReqWrite`: Disables the forceReqWrite feature. For details, see: [enable](./enable)
- `forceResWrite`: Disables the forceResWrite feature. For details, see: [enable](./enable)
- `auto2http`: Disables the auto2http feature. For details, see: [enable](./enable)
- `hide`: Disables the hide feature. For details, see: [enable](./enable)
- `useLocalHost`: Disable the `useLocalHost` feature. For details, see: [enable](./enable)
- `useSafePort`: Disable the `useSafePort` feature. For details, see: [enable](./enable)
- `cookies`: Disable request and response cookies
- `reqCookies`: Disable request cookies
- `resCookies`: Disable response cookies
- `ua`: Disable `user-agent`
- `referer`: Disable `referer`
- `csp`: Disable CSP
- `cache`: Disable caching
- `301`: Disable 301 redirects, force 301 redirects to 302
- `dnsCache`: Disable DNS caching
- `ajax`: Remove the `x-requested-with` request header
- `keepAlive`: Disable caching of request connections
- `timeout`: Disable request timeout settings
- `autoCors`: When using the [file](./file) protocol to replace a request, if Whistle detects that the request is cross-origin, it will automatically add the necessary CORS (Cross-Origin Resource Sharing) headers. This can be disabled using `disable://autoCors`.

- `userLogin`: Disables the login dialog when setting [statusCode://401](./statusCode).

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

