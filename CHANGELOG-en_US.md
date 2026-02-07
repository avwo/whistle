[中文](./CHANGELOG.md) · English

## v2.10.0
1. feat: Move the Raw Tab of Inspectors to the first position.
2. feat: Local mapping paths are not allowed to contain `../` path segments.
3. feat: Allow disabling or enabling custom certificates without deletion.
4. feat: Plugin variable `%plugin-name=xxx` now supports all plugin hooks.
5. refactor: Simplify the code passing mechanism between Whistle and plugins, improving efficiency.
6. fix: Improve test cases and fix hidden bugs.

## v2.9
1. feat: UI and Experience Improvements:
      - Redesigned Dark mode interface according to Dark mode specifications.
      - Network supports filtering by type and manually saving captured packet data.
      - Composer supports importing CURL commands and displaying SSE/WebSocket content.
      - JSON Viewer right-click menu now supports copying selected text.
      - Support for displaying TTFB, SSE content, and WebSocket Frames.
      - Added `frameScript` for modifying WebSocket/TCP request content via JS.
2. feat: Rule and Configuration Enhancements:
     - Support loading default configurations via `~/.whistlerc`.
     - Rules support viewing `Enabled Rules` and grouping functionality.
     - Support setting matching probability: `includeFilter://chance:0.5`.
     - Added `delete://` protocol to delete request parameters, cookies, etc.
     - Support `req.passThrough({transformReq, transformRes, ...})`.
     - Embedded values now have independent scopes (Rules, Plugins, Header Rules are isolated).
3. feat: Plugin System Improvements:
     - Support installing/uninstalling plugins via the UI.
     - Added custom right-click menu to the plugin list.
     - Plugins support `sharedStorage` for data sharing across different instances.
     - Plugin Option pages support setting favicon and opening as dialog boxes.
     - Support installing plugins via plugins.
4. feat: Network and Proxy Features:
     - Enabled `localhostCompatible` mode by default.
     - Support for IPv6-only networks.
     - Support for SOCKS proxy and custom DNS servers.
     - Added `https-proxy` and `internal-http-proxy` protocols.
     - Support for HTTP2 functionality (requires Node 10.16.0+).
5. feat: Certificate and Security:
     - Default certificate format changed to .cer for better compatibility with more devices.
     - Support for custom client certificates and mutual TLS authentication.
     - Root certificates can be updated via `w2 ca` upon expiration.

## v2.8
1. feat: Multi-process Support
      - Added `--cluster [workers]` startup mode, supporting multi-process operation.
      - Fixed an issue where plugin remote rules failed to access when binding to a non-local network interface during startup.
2. feat: Certificate Management Optimization
      - Auto-generated certificates are automatically renewed upon expiration (valid for one year).
      - Prohibited uploading root certificate files (`root.key & root.crt`) via the web interface.
      - Support for non-SNI requests to obtain custom certificates via plugins.
      - Support for directly uploading and deleting user-defined certificates.
3. feat: Plugin System Enhancements
      - Plugin `server` hooks support setting dynamic rules via `req.setReqRules` and `req.setResRules`.
      - Plugins can obtain client connection information (`originalReq.remoteAddress` and `originalReq.remotePort`).
      - Fixed an issue where requests did not re-enter TUNNEL proxy when the plugin `sniCallback` returned `false`.
      - Optimized plugin rule execution: req and res rules are now executed separately.
4. feat: Proxy Rule Enhancements
      - Support filtering `ignore://*` via `ignore://-*`.
      - Support `proxy` and `pac` configurations with `lineProps://proxyHostOnly`, making the proxy effective only when the user configures a `host`.
      - HTTPS Server started with `--httpsPort` can obtain certificates from plugins.
5. feat: Filter Rule Extensions
      - Support filtering requests by source using `excludeFilter://from=httpServer`, `includeFilter://from=httpsServer`, etc.
      - Support modifying the domain or port of log and weinre requests via `enable://useLocalHost` and `enable://useSafePort`.
6. feat: Request Header Control
      - `x-forwarded-host` and `x-forwarded-proto` are disabled by default. They can be enabled via:
      - Startup parameters `-M x-forwarded-host|x-forwarded-proto`.
      - Request header `x-whistle-forwarded-props: host,proto,for,clientIp,ip`.
7. feat: Custom Interface
      - Support custom `inspectors tab`.
      - The interface provides an `api.selectIndex` method to select captured packet data at a specific index.
8. feat: Data Limits and Optimization
      - Default displayed captured packet data is limited to 1.5MB, expandable to 2.5MB via `enable://bigData`.
      - Support setting response rules via request headers.
      - Optimized certificate fetching logic, merging multiple identical requests.
9. File Path Handling
      - Distinct handling of `reqWrite:///path/to/` and `reqWrite:///path/to`, where the former is automatically completed to `index.html`.
10. Merge Operation Enhancement
      - `resMerge://json1 resMerge://json2` uses shallow merge by default; deep merge can be enabled via `resMerge://true`.
11. feat: Force Write Support
      - Support forcing `reqWrite`, `reqWriteRaw`, `resWrite`, and `resWriteRaw` via `enable://forceReqWrite` and `enable://forceResWrite`.
12. feat: Authentication Hook Optimization
     - The plugin's auth hook now applies to resolved HTTPS requests by default.
     - Support enabling the auth hook for tunnel proxy requests via `enable://authCapture`.
13. fix: Issue Fixes
     - Fixed a potential issue where saz files could not be imported.
     - Fixed a memory leak issue in `sniCallback`.
     - Handled `unhandledRejection` events.
14. refactor: Code Optimizations
     - When a plugin receives an HTTPS request, `req.url` will contain the full path.
     - Optimized certificate fetching logic to reduce duplicate requests.
     - Support disabling `enable://abort` via `disable://abort`.

## v2.7

1. feat: HTTP2 Feature Extensions
      - **HTTP2 non-HTTPS Support**: HTTP2 protocol now supports non-HTTPS requests.
      - **Performance Monitoring**: Third-party integrations can obtain runtime data like CPU, memory, request volume via `proxy.on('perfDataChange')`.
2. feat: Comprehensive Plugin System Enhancements
      - **Async Support**: Plugin hooks now support `async-await` syntax.
      - **Authentication Integration**: Plugin `whistleConfig` supports configuring `inheritAuth` to reuse Whistle login accounts.
      - **Plugin Management**: Support automatic loading of the plugin when executing `w2 run` in the plugin's root directory.
      - **Configuration Sharing**: Plugins support obtaining certificates for specified domains via `options.getCert()`.
      - **Dependency Reference**: Plugins can directly reference Whistle internal modules via `options.require`.
3. feat: Command Line Tool Improvements
      - **Configuration Management**: Support loading startup configurations via `--config localFile` (higher priority than command line).
      - **Instance Management**: Optimized `w2 stop` command; displays all running instances when none is found.
      - **Docker Support**: Added Dockerfile to the source directory.
4. feat: DNS Resolution Enhancements
      - **Custom DNS**: Support custom DNS servers via the `--dnsServer` parameter.
      - **DNS over HTTPS**: Support for DNS-over-HTTPS services like `http://dns.alidns.com/resolve`.
      - **IPv6 Support**: Manual specification of IPv6 DNS server addresses is possible.
5. feat: Proxy Protocol Optimizations
      - **PAC Authentication**: `pac` protocol supports setting username and password: `pac://user:pass@pacPath`.
      - **Tunnel Proxy**: Support for plugins setting `tunnelKey` to pass tunnel proxy request headers.
      - **Proxy Forwarding**: Optimized `lineProps://proxyHost|proxyTunnel|proxyFirst` configuration.
6. feat: Request Header Processing
      - **Forwarding Control**: Support disabling specific forwarding headers via `-M disableForwardedHost` and `-M disableForwardedProto`.
      - **Custom Parsing**: `pipe://xxx` supports plugins internally obtaining original rule values.
7. feat: Network View Upgrade
      - **Tree View Support**: Network now supports displaying captured packet data in a tree view.
      - **Raw URL Display**: Support for displaying the original URL (Raw Url).
      - **Data Size Display**: The Body column in Network shows the request content size.
      - **List Optimization**: Fixed data updating and sorting issues in Tree View and List View.
8. feat: Interface Interaction Improvements
      - **Composer History**: Optimized display of Composer history list.
      - **Left Menu**: Optimized left menu layout and interaction.
      - **Status Hints**: More obvious reminders when Rules and Plugins are disabled.
      - **Shortcut Support**: Fixed shortcut key issues in Values right-click menu.
9. feat: Rule Editor Enhancements
      - **Rule Sorting**: Support adding Rules to the top.
      - **Error Handling**: Fixed an error when entering `!` in the Rules editor.
      - **Intelligent Suggestions**: `pipe` protocol now supports intelligent suggestions.
10. feat: Authentication Feature Extensions
        - **Plugin Authentication**: Plugin `auth` method supports `req.setRedirect(url)` for redirection.
        - **Login Box Support**: Plugin `auth` supports setting `req.showLoginBox` to pop up a login box.
        - **Internal Requests**: Plugin `auth` method now supports handling Whistle internal requests.
11. feat: Certificate Management
        - **Root Certificate Management**: Support displaying custom root certificates and deletion guidance.
        - **Remote Certificates**: Support obtaining remote certificates via the plugin `sniCallback(req, options)` hook.
12. feat: Custom Parsers
        - **HTTP Parsing**: Regular HTTP requests now also support `customParser` (or `customFrames`).
        - **Data Replacement**: Fixed inaccurate matching issues in `reqReplace` and `resReplace` due to packet splitting.
13. feat: Protocol Support Extensions
        - **Status Code Replacement**: WebSocket and Tunnel requests support `replaceStatus`.
        - **Console Log Control**: Support preventing `log://` from intercepting `console` via `disable://interceptConsole`.
        - **CORS Handling**: `resCors://enable` automatically ignores when the request header lacks an `origin`.
14. feat: Memory Optimization
        - **Empty Request Handling**: Removed `Empty Request` to reduce memory and CPU usage.
        - **Stack Overflow Fix**: Fixed "Maximum call stack size exceeded" errors.
        - **Storage Separation**: Plugins use different storage directories in different instances.
15. feat: Startup and Runtime Optimization
        - **Startup Speed**: Optimized Whistle startup speed.
        - **Delay Implementation**: Optimized the implementation mechanism of `reqDelay` and `resDelay`.
        - **Plugin Loading**: Third-party integrations can listen to plugin loading events.
16. feat: Template String Enhancements
        - **Port Variables**: Support obtaining port information via `clientPort` and `serverPort` in template strings.
        - **Plugin Variables**: Support setting multiple `%plugin-name=xxxx` simultaneously in rules (up to 10).
17. fix: Issue Fixes
        - **Dialog Customization**: Browser built-in windows like `alert`, `confirm`, `prompt` now use custom implementations to prevent Chrome restrictions.
        - **WebSocket Capture**: Fixed an issue where WebSocket packets could not be captured.
        - **Plugin Storage**: Fixed an issue where `storage.setProperties` in plugins could fail.
        - **Request Pause**: Fixed response stream pause issues under certain conditions.
        - **Third-party Integration**: Fixed internal request forwarding issues during third-party integrations.
18. feat: Feature Adjustments
        - **Deletion Timing**: Adjusted the execution timing of `delete://reqH.xxxx`.
        - **Forwarding Logic**: Optimized the implementation of internal request forwarding logic.
19. feat: Other Improvements
        - **Rule Mode**: Support setting `-M shadowRules` (capture + set rules) or `-M shadowRulesOnly` (rules only).
        - **UI Requests**: Display UI request status.
        - **Error Messages**: Optimized error messages.
        - **Protocol Display**: Display the HTTP protocol type forwarded by plugins.

## v2.6

1. feat: System Monitoring and Status
      - **Online Status Monitoring**: View current process request count, CPU, and memory status via the `Online` menu.
      - **API Monitoring Interface**: Support obtaining runtime information via `proxy.getRuntimeInfo()`.
      - **Performance Metrics**: The Online panel supports displaying QPS and maximum values of memory, CPU, and QPS.
2. feat: Data Management
      - **Recycle Bin Feature**: Deleted Rules or Values are first moved to the Recycle Bin (up to 120 cached items), with support for recovery.
      - **Certificate Generation Tool**: `Network > Tools > ToolBox` supports generating certificates for corresponding domains.
      - **HAR File Export**: Support exporting captured packet data as HAR format files.
3. feat: Network Feature Enhancements
      - **Advanced Search**: The search box supports filtering with up to 3 keywords.
      - **View Source**: Right-click menu adds `Open/Source` to view captured packet data source code.
      - **SVG Preview**: Support previewing SVG files.
4. feat: Editor and Rule Management
      - **Read-Only Mode**: Support setting Rules & Values editors to read-only mode via the `disabledEditor=1` parameter.
      - **Line Number Comments**: When line numbers are enabled, double-clicking the line number can comment or uncomment.
      - **Rule Highlighting**: Optimized editor highlighting for plugin rules.
5. feat: Interaction Improvements
      - **Toolset Extension**: `Network / Tools / Toolbox` supports converting objects to Query parameters.
      - **Quick Operations**: Support extending the `util.openEditor(value)` method.
6. feat: Rule Import/Export
      - **Rule Import**: Support importing rules into Rules via `--shadowRules jsonString`.
      - **Command Line Output**: Optimized information display when starting from the command line.
7. feat: Mode Settings
      - **Operation Modes**: Support setting multiple modes via the `-M` parameter:
      - `disabledBackOption|disabledMultipleOption|notAllowDisableRules`
      - `rulesOnly` and `pluginsOnly`
8. feat: Internal Path Handling
      - **Path Flexibility**: Internal paths support setting domain and port parameters, formats:
      - `/...whistle-path.5b6af7b9884e1165...///__domain__port__/path/to`
      - `/...whistle-path.5b6af7b9884e1165...///path/to?_whistleInternalHost_=__domain__port__`
9. Memory and Connection Management
      - **Connection Optimization**: Ensure timely closure of unused connections to reduce memory usage.
      - **GC Optimization**: Adjusted GC parameters `--max-semi-space-size=64`.
      - **Performance Monitoring**: Support obtaining the total number of currently processed requests via CGI or API.
10. feat: Exception Handling
        - **Plugin Exceptions**: Support obtaining exception information thrown by plugins via `process.on('pforkError')`.
        - **Uncaught Exceptions**: Optimized handling of uncaught exceptions during request processing.
        - **Timeout Handling**: Added `timeout` event to `onSocketEnd`, compatible with various abnormal situations.
11. feat: Internal Connections
        - **Connection Management**: Optimized internal connection management mechanism.
12. feat: Filter Rules
        - **Rule Fix**: Fixed result disorder when mixing `excludeFilter` and `includeFilter` configurations.
        - **Domain Matching**: Domain wildcards now support obtaining submatch content.
13. feat: Proxy Configuration
        - **Proxy Connection Header**: Support changing the proxy forwarding header to `Proxy-Connection: close` via `disable://proxyConnection`.
        - **Client Filtering**: Support filtering captured packet data via the `clientId` URL parameter.
14. fix: Major Issue Fixes
        - **Rule File Saving**: Fixed an issue where saving failed when rule file names were too long.
        - **Editor Issue**: Fixed an issue with editor highlighting for plugin rules.
        - **Management Interface Security**: Fixed an issue where CGI paths in the management interface could be arbitrarily concatenated.
        - **Node Version Compatibility**: Fixed compatibility issues with specific Node versions (v15.5.0).
        - **pipe Protocol**: Fixed issues that could lead to data loss.
        - **Local File Replacement**: Response headers for local file replacements now include `content-length` by default.
15. perf: Performance Issues
        - **Freeze Issue**: Fixed potential freezes in some Node versions.
        - **Connection Leakage**: Optimized connection management to reduce resource usage.
16. feat: Response Header Handling
        - **Content Length Control**: Local file replacements automatically add the `content-length` field, which can be disabled via `delete://resH.content-length`.
17. Internal Request Handling
        - **Async Handling**: Support listening for plugin process exceptions via `process.on('pforkError')`.

## v2.5

1. feat: Client Certificate Support
      - **Custom Client Certificates**: Support configuring custom client certificates to enhance security authentication.
      - **Connection Error Handling**: Optimized error handling mechanism when establishing connections.
2. feat: Security Protocol Enhancements
      - **Cipher Algorithm Extension**: Added `cipher` protocol to support custom fallback encryption algorithms.
      - **Security Update**: Updated node-forge to address known security issues.
      - **Plugin Security Control**: Startup parameters support controlling plugin loading via `allowPluginList` and `blockPluginList`.
3. feat: Authentication Mode
      - **Proxifier Mode**: Support `-M proxifier` to enable proxifier mode, automatically intercepting specific requests for certificate verification.
4. feat: Tunnel Proxy Enhancement
      - **Confirmation Mechanism**: Tunnel proxy supports a confirmation mechanism, improving proxy stability.
      - **Connection Recovery**: Fixed an issue where HTTP requests going through tunnel proxy did not call `socket.resume()`.
      - **Line-Level Proxy Configuration**: Added `lineProps://proxyHost|proxyTunnel` to apply only to the current line.
5. feat: Multi-Layer Proxy Support
      - **Two-Layer Proxy**: Added `enable://proxyTunnel` to support two-layer HTTP proxy.
      - **Internal Request Support**: Internal path requests also support `enable://proxyTunnel`.
      - **Protocol Conversion Fix**: Fixed an issue where `https2http-proxy` could not properly convert some requests.
6. feat: WebSocket Handling
      - **Auto Conversion**: WebSocket HTTPS requests configured in hosts support automatic conversion to HTTP.
      - **Origin Fix**: Fixed an issue with automatic modification of WebSocket origin.
      - **Data Retention**: Retain tunnel proxy request header data after intercepting HTTPS requests.
7. feat: Plugin Management
      - **Status Display**: Plugins disabled show a `Disabled` indicator on the page tab.
      - **Command Customization**: Support customizing uninstall and install command names in the plugins list.
      - **Rule Data Retrieval**: Plugins can obtain rule matching results via `req.originalReq.ruleUrl`.
8. feat: Plugin Feature Enhancements
      - **Trailer Support**: Plugins automatically add trailers, which can be disabled via `res.disableTrailer`.
      - **Event Listening Optimization**: Optimized listening for `res.on('end', cb)` events to ensure triggering.
9. feat: Data Deletion and Clearing
      - **Content Deletion**: Support deleting request and response content via `delete://body`.
      - **Selective Deletion**: Support `delete://req.body` and `delete://res.body` for separate deletion.
      - **Content Clearing**: Support clearing request or response content via `reqBody://()` or `resBody://()`.
10. feat: Trailer Operations
      - **Trailer Passing**: Support passing `trailers`.
      - **Trailer Deletion**: Support deleting specified trailers via `delete://trailer.xxx|trailer.yyy`.
      - **Trailer Modification**: Support modification via `headerReplace://trailer.key:pattern=value` and `trailers://json`.
11. feat: Protocol Optimization
      - **SNI Control**: `enable://servername` removes SNI from HTTPS requests.
      - **StatusCode Adjustment**: `statusCode` moved into `rule` at the same level as `file` and other protocols.
      - **CORS Optimization**: `resCors://enable` automatically sets CORS fields for OPTIONS requests.
12. feat: Interface Layout
      - **Left Menu Control**: Support hiding the left menu via the `hideLeftMenu=true` request parameter.
      - **Rule Toggle**: Left menu adds checkboxes to quickly disable or enable Rules/Plugins.
      - **System Hosts**: Removed the option to sync system hosts.
13. feat: Data Display
      - **Time Precision**: Page time now supports displaying milliseconds.
      - **Encoding Display**: Fixed incorrect Content Encoding display on pages.
      - **Response Header Size**: Fixed header size display issues when h2 requests are converted to https requests in the UI.
14. feat: Shortcut Optimization
      - **General Replay**: Added shortcuts `ctrl[cmd] + r` or `ctrl[cmd] + shift + r` to replay requests.
      - **Frames Replay**: Frames support shortcut `Ctrl/Cmd + R` to replay requests.
15. feat: Interaction Enhancement
      - **Request Header Display**: Bold whistle custom request headers in Composer.
      - **Network Font**: Adjusted bold effect of Network font.
      - **Data Marking**: Network right-click menu added `Actions>Mark` to mark captured packet data.
16. feat: Command Line Tools
      - **Docker Deployment**: Support `w2 run -M prod` for convenient Docker deployment.
      - **Multi-Rule Mode**: Support enabling multi-select via `-M useMultipleRules`.
      - **Plugin Path**: Fixed an issue where `--addon "path1,path2"` could not accept multiple paths.
17. feat: Development Configuration
      - **JSON5 Configuration**: Support json5 configuration files.
      - **Node Requirement**: Node13~14 for HTTP2 functionality, minimum Node version requirement changed to 6.
      - **Template Variables**: Template strings support obtaining system `os.hostname()` via `${hostname}`.
18. feat: HTTP2 Support
      - **HTTP2 Compatibility**: Fixed an issue where HTTP2 could not be used with `Node >= 14.1`.
      - **Protocol Detection**: Automatic detection of whether request or response content supports gzip.
19. feat: Data Compression
      - **Gzip Optimization**: CGI returning captured packet data now uses gzip.
      - **Performance Hint**: Composer input text length now prevents browser freezes.
20. feat: Filter Rules
      - **Rule Fix**: Restored matching order, fixing rule overriding issues.
      - **Response Header Filtering**: Fixed an issue where `includeFilter://h:key=pattern` could not match response headers.
21. fix: Issue Fixes
      - **Proxy Request Headers**: Fixed disorder in proxy request headers `Host`.
      - **Rule Conflict**: Fixed an issue where `reqHeaders://cookie=xxx` and `reqCookies://test=123` could not take effect simultaneously.
      - **Path Handling**: Fixed issues with modifying request URL parameters via `urlParams` and `pathReplace`.
      - **Composer Construction**: Fixed an issue where Composer constructing requests without a body did not set `content-length: 0`.
22. fix: Interface Fixes
      - **Overview Display**: Fixed script errors in the Overview interface when requests contained matching plugin rules.
      - **Plugin Sorting**: Fixed sorting jumps that could occur with simultaneously installed plugins.
      - **Frames Display**: Binary data font bolded in Frames page.
23. feat: Feature Enhancement
      - **JSON Operations**: JSON Tree supports copying child node data; JSONView right-click menu added `Collapse Parent`.
      - **Data Copy**: Support copying request headers as JSON text.
      - **WebSocket Status**: Support displaying WebSocket close error codes.
24. feat: Search and Help
      - **Search History**: Network search box added history function.
      - **Rule Help**: Overview rule list hover allows clicking to view help documentation.
      - **Plugin Installation**: Plugins added `ReinstallAll` button to copy plugin installation commands.
25. feat: File Handling
      - **Composer File Upload**: Support uploading local files.
      - **Proxy Standards**: Fixed pending issues caused by some services not following HTTP standards.
26. feat: Interface Access
      - **Guest Mode**: Added interfaces accessible in guest mode.
      - **Interface Security**: Reduced exposure of interfaces without login state.

## v2.4

1. feat: Mutual TLS Authentication Support
      - **Client-Server Mutual Authentication**: Support custom client certificates for mutual TLS authentication.
      - **Safe Mode**: Added startup parameter `-M safe` to enable safe mode with strict server certificate verification.
      - **Certificate Management**: `HTTPS > View all custom certificates` highlights expired certificates and supports copying installation paths.
2. feat: Certificate and Host Configuration
      - **Local Host Configuration**: Fixed an issue where HTTPS requests might fail if the local hosts file lacked `127.0.0.1 localhost`.
      - **Express Framework Fix**: Fixed an issue with the `x-powered-by` response header added by default by Express.
3. feat: HTTP2 Optimization
      - **Node Version Requirement**: Due to numerous bugs in the HTTP/2 module of lower Node versions, unified adjustment requires Node v12.12.0 or above for HTTP/2 support.
      - **HTTP2 Session Error**: Fixed potential `ERR_HTTP2_SESSION_ERROR` on some websites.
      - **DELETE Request Optimization**: HTTP2 `DELETE` requests with content automatically downgrade to HTTP/1.1.
      - **HTTP/2 Compatibility**: HTTP/2 supports DELETE requests with body.
3. feat: Proxy Feature Extensions
      - **Internal HTTP Proxy**: Added `internal-http-proxy` protocol, similar to `internal-proxy` but uses tunnel proxy for WebSocket requests.
      - **SOCKS Proxy Stability**: Fixed a crash issue when enabling `--socksServer port` and request exceptions occur.
      - **HTTPS Downgrade**: Support automatic downgrade of HTTPS requests with content (like post) to HTTP requests.
4. feat: Protocol Processing Improvements
      - **pipe Protocol Fix**: Fixed issues where request exceptions in `pipe` were not caught and HTTP request pipe failure.
      - **Rule Parsing Enhancement**: Support parsing pipe rules from request headers.
5. feat: Network Customization
      - **Custom Columns**: Support custom column display in Network via `style` protocol configuration.
      - **Frames Page Enhancement**:
        - Added Overview Tab for viewing basic frame data information.
        - Binary data font bolded.
      - **Search Filtering**: Fixed duplicate data issues in Network search filtering.
6. feat: Data Display Optimization
      - **Composer Response Data**: Response data passed to Composer changed to base64 format.
      - **Saz File Support**: Support displaying non-text content in saz files.
      - **Overview Panel**: Display matching `includeFilter` in Overview.
      - **Time Display**: Support displaying time consumed by HTTPS auto-conversion to HTTP in Overview.
7. feat: Rule Matching Display
      - **Filter Rule Display**: Display matching `includeFilter` rules in the Overview panel.
8. feat: Filter Rule Optimization
      - **includeFilter Fix**: Fixed an issue where `includeFilter://b:pattern` failed.
      - **Matching Logic Adjustment**: Adjusted `includeFilter` and `excludeFilter` matching:
        - Must satisfy one of all `includeFilter`.
        - Must not match any `excludeFilter`.
        - i.e., `excludeFilter://p1 excludeFilter://p2 includeFilter://p3 includeFilter://p4` is equivalent to `!(p1 || p2) && (p3 || p4)`.
9. feat: Remote Rule Management
      - **Update Mechanism Optimization**: Optimized remote rule update mechanism to prevent misjudgment of pull failure leading to rule clearance.
      - **Rule Conflict Fix**: Fixed an issue where setting `reqBody://(xxxx) method://post` could not take effect simultaneously.
10. feat: Startup Parameter Enhancement
      - **Version Notification Control**: Support disabling version update notifications via `-M disableUpdateTips` (for third-party integrations).
      - **Installation Process Optimization**: Removed warning prompts during installation.
      - **Configuration Fix**: Fixed host configuration errors introduced in the previous version.
11. feat: Network Configuration
      - **IPv6 Optimization**: Optimized IPv6 configuration.
      - **Interface Streamlining**: Removed redundant interfaces.
12. fix: Issue Fixes
      - **Host Configuration**: Fixed HTTPS failures due to local hosts file configuration issues.
      - **Express Response Header**: Fixed the `x-powered-by` response header added by default by Express.
      - **HTTP2 Error**: Fixed potential `ERR_HTTP2_SESSION_ERROR` on some websites.
      - **Rule Matching**: Fixed `includeFilter://b:pattern` failure.
      - **Proxy Exception**: Fixed crashes when enabling `--socksServer` and request exceptions occur.
      - **Rule Conflict**: Fixed simultaneous effect issue with `reqBody://(xxxx) method://post`.

## v2.3

1. feat: Significant List Performance Improvement
      - **Virtual List Technology**: Introduced `react-virtualized` library, greatly improving Network list rendering performance.
      - **Default Data Volume**: Default support for displaying 1500 captured packet items simultaneously.
      - **Custom Quantity**: Adjustable via `Network > Filter > Max Rows Number`.
      - **Memory Management**: Limited zlib concurrency to reduce memory leak risk.
2. feat: Dependency Management and Build
      - **Lock Dependency Versions**: Added `package-lock.json` to ensure dependency consistency.
      - **Build Stability**: Improved project build and deployment stability.
3. feat: Request Header Security Control
      - **x-forwarded-for Fix**: Fixed `x-forwarded-for` chaos issues.
      - **Custom Forwarding Headers**: Support custom forwarding addresses via `forwardedFor://ip` or `reqHeaders://x-forwarded-for=ip`.
      - **Proxy Forwarding Logic**: Direct requests do not carry `x-forwarded-for` by default; proxy forwarding automatically adds non-local IPs.
4. feat: HTTPS and Certificate Processing
      - **Non-SNI Request Support**: Fixed issues where non-SNI HTTPS requests could not be unpacked.
      - **HTTP2 Compatibility**: Fixed overly strict format requirements for request/response in HTTP2 module.
5. feat: Content Injection Security
      - **Strict HTML Check**: `enable://strictHtml` ensures injection only when the first non-whitespace character is `<`.
      - **Safe HTML Check**: `enable://safeHtml` prevents accidental injection into non-standard interfaces (checks not starting with `{{`).
      - **Mis-injection Protection**: Unified script injection for domains prevents accidental injection into non-HTML response types.
6. feat: Plugin Development Experience
      - **Runtime Identifier**: `@url` requests automatically carry `x-whistle-runtime-id`, helping plugins identify request source.
      - **Plugin Status Query**: Added `options.isEnable()` method to get plugin enable status.
      - **Template Variable Support**: Plugin configuration files support placeholders:
        - `{{whistlePluginName}}` - Gets plugin short name (excluding `whistle.`).
        - `{{whistlePluginPackage.xx.yy.zzz}}` - Gets values from plugin `package.json`.
      - **Plugin Sorting**: Fixed sorting jumps that could occur with simultaneously installed plugins.
7. feat: WebSocket Handling
      - **Status Code Passing**: When WebSocket returns a non-101 status, it's passed to the browser.
      - **Proxy Client IP**: Fixed an issue where WebSocket using `internal-proxy` could not accurately carry clientIp.
8. Proxy and Connection Management
      - **Proxy Retry Fix**: Fixed duplicate path addition after setting proxy retry.
      - **Socket Error Handling**: Force-set empty errorHandler for all sockets to prevent uncaught exceptions.
      - **Compression Control**: Support disabling `gzip` for all requests via startup parameter `-M noGzip`.
9. Cache Policy Adjustment
      - **Cache Priority**: `cache://xxx` now has the highest priority.
      - **Response Header Retention**: Support forced retention of original request headers via `cache://reserve`.
      - **Injection and Cache Coordination**: Fixed conflicts between `log://xxx`/`weinre://xxx` injection and caching.
10. feat: Network Interface Optimization
      - **Column Width Adjustment**: Network `URL` column supports width modification.
      - **Layout Improvement**: Optimized interface layout and interaction.

## v2.2

1. feat: Global HTTP2 Switch
      - **Interface Control**: Support enabling/disabling HTTP2 requests via `Network -> HTTPS -> Enable HTTP/2`.
      - **Local Enablement**: Can enable HTTP2 for specific requests locally via `pattern enable://h2`.
      - **Mode Switching**: After deselecting HTTP2, both receiving and sending requests switch to non-HTTP2.
2. feat: HTTP2 Performance Optimization
      - **Session Caching**: Optimized H2 session caching strategy, improving connection reuse efficiency.
      - **Node.js Compatibility**: Fixed Node.js version compatibility issues (issue #27384).
      - **Timeout Setting Optimization**: Removed request timeout settings, improved connection management.
3. feat: Command Line Rule Configuration
      - **Remote Rule Loading**: Support loading rules from remote URLs via `w2 start -r "@https://xxx"`.
      - **Local Rule File**: Support loading rules from local files via `w2 start -r "@filepath"`.
      - **Direct Rule Setting**: Support direct rule setting via `w2 start -r "www.test.com/path/to reqHeaders://x-test=1"`.
      - **Combined Configuration**: Support JSON.stringify format for combining multiple rule sources.
4. feat: Rule Execution Optimization
      - **Response Phase Rules**: Some rules executed only in the response phase are matched after request response.
      - **Performance Improvement**: Optimized rule matching timing, improving execution efficiency.
5. feat: HAR File Support
      - **Encoding Detection**: Support automatic detection of whether `xxx.har` files use base64 encoding.
      - **Data Compatibility**: Improved HAR file import compatibility and accuracy.
6. feat: Internal Request Handling
      - **Retry Mechanism Fix**: Fixed potential infinite loops due to internal request retries.
      - **Connection Stability**: Improved internal request handling logic to avoid infinite retries.
8. feat: Overall Optimization
      - **Code Refactoring**: Optimized H2 session management logic.
      - **Configuration Simplification**: Removed unnecessary request timeout settings.

## v2.1
1. feat: JSON Object Handling
      - **Array and Nested Support**: Multi-line JSON objects now support setting array and multi-level nested values.
      - **Smart Conversion Rules**:
        - Previous version: `[1]: "test"` converted to `{ "[1]": "test" }`
        - Current version: `[1]: "test"` converted to `var arr = []; arr[1] = 'test';`
      - **Complex Structure Support**: Support for complex nested structures like `[a.b[3].c]: abc`.
      - **Escape Control**: Using double quotes `"[xxx.yyy[n]]"` avoids automatic escaping.
2. feat: Domain Matching Extension
      - **Flexible Matching Syntax**:
        - `.test.com` - Matches `x.test.com` and `test.com`
        - `*.test.com` - Matches `x.test.com`, not `test.com`
        - `**.test.com` - Matches `x.test.com` and all its descendant domains
        - `***.test.com` - Matches `test.com` and all its descendant domains
      - **Precise Control**: Support adding protocols and paths for more precise matching, e.g., `http://.test.com/path/to/*`
3. feat: Custom Method Support
      - **Method Extension**: Composer interface supports custom request methods.
      - **Flexible Construction**: Users can construct and send various types of requests more flexibly.
4. feat: HTTP2 Performance Optimization
      - **Session Reuse**: Reduced HTTP2 session count; each client can fully reuse HTTP2 sessions.
      - **Connection Efficiency**: Improved HTTP2 connection reuse efficiency, reducing resource usage.
5. feat: Plugin Development Experience
      - **Hint Optimization**: Fixed an issue where custom plugin hints with only one completion data wouldn't display.
      - **Environment Variable Support**: Support setting Node path for forked plugin processes via environment variable `env.WHISTLE_PLUGIN_EXEC_PATH` or startup parameter `-M buildIn`.
      - **Path Control**: Defaults to global Node; specific Node paths can be specified as needed.
6. feat: Overview Panel Enhancement
      - **Compression Information Display**: Overview panel supports displaying request size before and after gzip.
      - **Data Size Display**: Fixed an issue where empty request/response content wouldn't show size.
7. fix: URL Replacement Fix
      - **Path Handling**: Fixed incorrect path handling in URL replacement `url replacementUrl`.
      - **Replacement Accuracy**: Ensure URL replacement operations accurately handle path parameters.
8. perf: Performance Optimization
      - **HTTP2 Connection**: Optimized HTTP2 session management, reducing connection creation overhead.
      - **Data Display**: Improved data display logic for empty content.

## v2.0.0
1. feat: **Support for HTTP2 Functionality**
	> Please ensure the Node version is [the latest LTS (>= 10.16.0) or Stable (>= 12.12.0) version](https://nodejs.org/en/), otherwise anomalies may occur, such as: [#24037](https://github.com/nodejs/node/issues/24037), [#24470](https://github.com/nodejs/node/issues/24470)
2. feat: `**/path/to` If `path/to` contains `*`, e.g., `*/cgi-*`, it is equivalent to `^*/cgi-*`.

## v1.17
1. feat: Support establishing connections between browser and whistle via HTTP2 (**requires updating [Node](https://nodejs.org) to version `v10.16.0` or above**)
2. refactor: Adjusted connection caching strategy; no long caching for any connections to reduce memory usage.

## v1.16
1. feat: Support plugins obtaining plugin Rules, Values, and custom certificate information via `options.getRules(cb), options.getValues(cb), options.getCustomCertsInfo(cb)` respectively.
2. feat: HTTPS menu dialog added `View Custom Certs` button for managing custom certificates.
3. feat: Support enabling debugging mode via `w2 run --inspect` or `w2 run --inspectBrk`.
4. feat: Plugin list added `Sync` button to fetch plugin rules or values and set them in the UI Rules or Values.
5. feat: Support custom auto-completion list functionality via plugin package.json configuration, e.g., `"whistleConfig: { "hintUrl": "/cgi-xxx/xxx" }"`.
6. feat: Support data transfer between plugin server hooks via `req.sessionStorage.[get|set|remove]`.

## v1.15
1. feat: Support starting a SOCKS v5 service on a specified port via command line parameter `--socksPort 1080` (currently only supports regular TCP requests).
2. feat: Plugin server added `req.passThrough()`, `req.request(url/options, cb)`, `req.writeHead(code, message, headers)` methods for forwarding requests from plugins to specified services.
3. feat: Support a no-capture-page mode via command line parameter `-M rules`, where the UI won't show Network, cannot capture packets, and plugins cannot obtain captured packet data via `req.getSession(cb)`.
4. feat: Support setting request font color/style/background color via `style://color=!xxx&fontStyle=xxxxx&bgColor=red`.
5. feat: Support adjusting proxy configuration priority above host via `enable://proxyFirst` (default: host > proxy).
6. fix: Fixed various issues encountered during operation.

## v1.14
1. feat: Added new protocols [pipe](https://wproxy.org/docs/rules/pipe.html), [headerReplace](https://wproxy.org/docs/rules/headerReplace.html).
2. fix: Fixed `querystring.parse('+')` automatically converting to space ' ' or `%2B` issue.
3. refactor: Optimized startup parameter [--max-http-header-size=size](https://nodejs.org/dist/latest-v10/docs/api/cli.html#cli_max_http_header_size_size).
4. feat: Added command line parameters `--httpPort` and `--httpsPort` for starting regular HTTP and HTTPS servers respectively, useful for reverse proxying, and can also start another `http proxy` (same function as default HTTP proxy) and `https proxy` (can serve as an HTTPS proxy server).
5. fix: Fixed various issues encountered during operation.

## v1.13
1. feat: Enhanced plugin functionality, supporting `resRules.txt`.
2. feat: Added new protocols [excludeFilter](http://wproxy.org/docs/rules/excludeFilter.html) and [includeFilter](http://wproxy.org/docs/rules/includeFilter.html).
3. feat: [log](http://wproxy.org/docs/rules/log.html) supports injecting `whistle.onWhistleLogSend(level, logStr)` to obtain page log information for custom reporting.
4. feat: Plugins support custom interface URL via package.json configuration `"pluginHomepage": "http://xxx.xxx.com/"`.
5. feat: Local replacement added response `206` functionality, supporting iOS playback of locally replaced video files.
6. feat: Command line added `--no-prev-options` startup option, supporting `w2 restart` without reusing previous options.

## v1.12
1. feat: Support adjusting rule priority order in `Rules > Settings > The later rules first`. Default is top-to-bottom, with rules in Default having the lowest priority. This setting only applies to rules configured in Rules, not to [reqScript](https://wproxy.org/docs/rules/reqScript.html) or plugin-set rules.
2. feat: Added new protocol [https-proxy](https://wproxy.org/docs/rules/https-proxy.html).
3. feat: [resCookies](https://wproxy.org/docs/rules/resCookies.html) supports setting [SameSite](https://www.owasp.org/index.php/SameSite).
4. feat: Support loading remote rules via configuration `@url` or `@filepath` or `@whistle.xxx/path` in Rules.
5. feat: Support setting `shadowRules` via command line `-r, --shadowRules [shadowRules]`.
6. feat: Support embedded Values.
7. feat: Template strings support `replace`, and support submatching.
    ```
    pattern protocol://`${search.replace(pattern1,replacment)}`
    www.test.com file://`${search.replace(/Course_(id)\,?/ig,$1cid)}${test.html}`
    ```
    `pattern1` is a regex or regular string (no quotes needed).

## v1.11
1. feat: HTTPS request auto-downgrade ([https://github.com/avwo/whistle/issues/176](https://github.com/avwo/whistle/issues/176)).
2. feat: Support displaying HexView (binary).
3. feat: Added new protocol [xhost](https://wproxy.org/docs/rules/xhost.html).
4. feat: Adjusted strategy; some protocols support multiple simultaneous matches.
5. fix: Fixed various issues encountered during operation.

## v1.10
1. feat: Enhanced interface functionality.
2. feat: Support port matching `:12345 operation`.
3. feat: Support setting multiple domains for accessing webui `-l "webui1.example.com|webui2.example.com"`.
4. feat: Support obtaining rule configuration output by `.whistle.js` in the current directory via command line `w2 add`. See: [Command Line Parameters](https://wproxy.org/docs/cli.html).
5. feat: Display current whistle running status via `w2 status [-S storage]` or `w2 --all`.

## v1.9
1. feat: Support setting to capture-only mode via command line `-M network`. In this mode, only packet capture can be viewed; rules cannot be set nor plugins loaded.
2. feat: Support customizing domains for accessing plugins via command line `-L "script=a.b.com&vase=x.y.com&nohost=imweb.nohost.pro"`.
3. feat: Composer supports setting Rules.

## v1.8
1. feat: Added new protocols [htmlPrepend](https://wproxy.org/docs/rules/htmlPrepend.html), [htmlBody](https://wproxy.org/docs/rules/htmlBody.html), [htmlAppend](https://wproxy.org/docs/rules/htmlAppend.html), [cssPrepend](https://wproxy.org/docs/rules/cssPrepend.html), [cssBody](https://wproxy.org/docs/rules/cssBody.html), [cssAppend](https://wproxy.org/docs/rules/cssAppend.html), [jsPrepend](https://wproxy.org/docs/rules/jsPrepend.html), [jsBody](https://wproxy.org/docs/rules/jsBody.html), [jsAppend](https://wproxy.org/docs/rules/jsAppend.html).
2. feat: Support wildcard matching.
3. feat: Support `Copy As CURL`.
4. feat: Support importing HAR files.
5. feat: Support third-party extensions for the `@` symbol function in Rules.

## v1.7
1. feat: Added new protocols [resScript](https://wproxy.org/docs/rules/resScript.html), [responseFor](https://wproxy.org/docs/rules/responseFor.html), [resforwardedForScript](https://wproxy.org/docs/rules/forwardedFor.html).
2. fix: Fixed various issues encountered during operation.

## v1.6
1. feat: Support WebSocket request mapping, `ws://www.test.com/xxx https://www.abc.com/a/b`.
2. feat: Adjusted certificate strategy to prevent invalid characters in domains causing Chrome certificate validation failures.
3. fix: Fixed various issues encountered during operation.

## v1.5
1. feat: Composer supports constructing WebSocket and TCP requests.
2. feat: Support custom Whistle management interface port via command line parameter `-P uiPort`.
3. feat: Enhanced plugin functionality, supporting setting plugin-private Values via root directory file `_values.txt` (does not support `values.txt`), matching private rules `_rules.txt`.
4. feat: Interface supports left menu mode and displays client and server port numbers.
5. fix: Fixed various issues encountered during operation.

## v1.4
1. feat: Support modifying the root path of Whistle storage directory via command line parameters `-D, -baseDir`.
2. perf: Optimized performance of `os.networkInterfaces`.
3. fix: Fixed various issues encountered during operation.

## v1.3
1. feat: Pattern added support for schema-less mode `//xxx`.
2. fix: Fixed various issues encountered during operation.

## v1.2
1. feat: Added new protocols [reqScript](https://wproxy.org/docs/rules/reqScript.html), [ignore](https://wproxy.org/docs/rules/ignore.html), [enable](https://wproxy.org/docs/rules/enable.html).
2. feat: Enhanced plugin functionality, added `statsServer`.
3. feat: Added short link for downloading root certificate `http://rootca.pro`.

## v1.1
1. feat: Added new protocols [pac](https://wproxy.org/docs/rules/pac.html), [delete](https://wproxy.org/docs/rules/delete.html), [reqHeaders](https://wproxy.org/docs/rules/reqHeaders.html), [resHeaders](https://wproxy.org/docs/rules/resHeaders.html).
2. feat: Enhanced plugin functionality.
3. fix: Fixed various issues encountered during operation.

## v1.0
1. feat: Enhanced plugin functionality, added `tunnelServer`, support for new protocol `whistle.xxx://`.
2. feat: Enhanced `socks`, `proxy` protocol functionality.
3. feat: Added command line parameter `-l, --localUIHost` to modify the domain for accessing the configuration page, default is `local.whistlejs.com`.
4. feat: Proxy requests added `x-whistle-policy` for setting Whistle policies.
5. fix: Fixed various issues encountered during operation.
6. feat: Replaced with a new logo, thanks to our department's visual designer **[@wjdgh1031(鬼刀)](https://github.com/wjdgh1031)** for designing the new logo.
7. feat: Enhanced protocol functionality [pathReplace](https://wproxy.org/docs/rules/pathReplace.html), [log](https://wproxy.org/docs/rules/log.html), [replaceStatus](https://wproxy.org/docs/rules/replaceStatus.html), [rawfile](https://wproxy.org/docs/rules/rawfile.html), [xrawfile](https://wproxy.org/docs/rules/xrawfile.html), [reqAppend](https://wproxy.org/docs/rules/reqAppend.html), [resAppend](https://wproxy.org/docs/rules/resAppend.html), [reqType](https://wproxy.org/docs/rules/reqType.html), [resType](https://wproxy.org/docs/rules/resType.html), [reqCharset](https://wproxy.org/docs/rules/reqCharset.html), [ua](https://wproxy.org/docs/rules/ua.html), [reqWriter](https://wproxy.org/docs/rules/reqWriter.html), [reqWriterRaw](https://wproxy.org/docs/rules/reqWriterRaw.html), [reqReplace](https://wproxy.org/docs/rules/reqReplace.html), [resReplace](https://wproxy.org/docs/rules/resReplace.html), etc.
8. feat: Support exporting captured packet data.
9. feat: Support starting multiple instances `w2 start -S newStorageDir -p newPort`.
10. feat: Support custom plugins.
11. fix: Fixed various issues encountered during operation.
