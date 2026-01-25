# Getting Started with Whistle

Once installed, launch Whistle according to your installation type:
*   **Desktop Application Version**: Launch the desktop app directly.
*   **Command-Line Version**: Access `http://local.whistlejs.com` in your browser.

This will open the main Whistle **Web Interface**.

![Whistle Web Interface](/img/whistle.png)

The main interface provides four core functional areas:
*   **Network**: The main panel for real-time packet capture, analysis, and tools like request replay/compose.
*   **Rules**: The interface for configuring rules to modify requests and responses.
*   **Values**: The interface for managing configurable values (which can be referenced as variables in rules).
*   **Plugins**: The interface for managing plugins.

## Interface Examples

1.  **Replay a Request**
    > Select a request in the Network list and click the `Replay` button in the toolbar, or right-click the request and choose `Actions -> Replay`.
    ![Replay Request](/img/replay-req.png)

2.  **Compose or Edit a Request**
    > Select a request in the Network list and click the `Edit` button in the toolbar, or right-click the request and choose `Actions -> Edit Request`.
    ![Edit Request](/img/edit-req.png)

## Introduction to Rules

![Rules Interface](/img/rules.png)

Whistle allows you to efficiently modify and debug network requests and responses by configuring concise rules. All rules are based on a core syntax structure:

```txt
pattern operation [lineProps...] [filters...]
```

**Interpretation**: When a request's URL matches the `pattern`, Whistle performs the action defined by the `operation` on it. Additionally, you can:
*   Use the optional `lineProps` to set special properties for the rule on the same line.
*   Use the optional `filters` to perform a secondary, more precise筛选 (filtering) on the already matched requests.

| Name | Description & Examples |
| :--- | :--- |
| **`pattern`** | An expression to match request URLs (supports domain, path, regex, wildcard).<br/>1.  `www.test.com` (Domain)<br/>2. `https://www.test.com` (Domain with protocol)<br/>3. `www.test.com:8080` (Domain with port)<br/>4. `*.test.com` (Domain with wildcard)<br/>5. `www.test.com/path` (Path)<br/>6.  `https://www.test.com/path` (Path with protocol)<br/>7.  `www.test.com/path?query` (Domain with query string)<br/>8. `/api/i` (Regular Expression)<br />9. ``^**.test.com/path/index.*.js`` (Wildcard)<br />10. ``^https://**.test.com/path/index.*.js`` (Wildcard with protocol) |
| **`operation`** | The specific action to execute, formatted as `protocol://value`.<br/>1. `reqHeaders://x-proxy=whistle` (Set request headers)<br/>2. `file:///User/xxx` (Map to a local file) |
| **`lineProps`** | Additional configurations that apply only to the current rule line, used for behaviors like increasing priority or refining matching (supports combination).<br/>1. `lineProps://important` (Increase the rule's priority)<br/>2. `lineProps://safeHtml` (Ensure the response content is not a JSON object)<br/>3. `lineProps://proxyHost` (Allow both `proxy` and `host` protocols to take effect) |
| **`filters`** | Perform more precise filtering based on the `pattern` match (supports combination).<br/>1. `includeFilter://b:cmdname=xxx` (Keep requests whose body contains `cmdname=xxx`, case-insensitive)<br/>2. `excludeFilter://reqH.user-agent=/android/i` (Exclude requests whose User-Agent contains 'android', case-insensitive) |

Let's start with some common features to get an intuitive feel for basic Whistle rule usage. Detailed explanations will follow.

## Local Replacement / Proxying

During development or troubleshooting, it's often necessary to forward page, static resource, or API requests to a local environment or a specified test server. Whistle rules make this mapping and proxying convenient.

```txt
# 1. Forward page requests to a local dev server
www.example.com http://localhost:5173 excludeFilter://*/static excludeFilter://*/api

# 2. Map static resources to a local directory
www.example.com/static file:///User/xxx/statics

# 3. Forward API requests to a test environment server
www.example.com/api 10.1.0.1:8080
```

#### Rule Explanation

| Rule | Effect | Notes |
| :--- | :--- | :--- |
| `www.example.com/static file:///User/xxx/statics` | Maps all requests under `www.example.com/static/…` to the local `/User/xxx/statics/…` directory. | Returns a 404 error if the corresponding local file does not exist. |
| `www.example.com/api 10.1.0.1:8080` | Forwards all `www.example.com/api/…` requests to the test server `10.1.0.1:8080`. | The URL seen by the server remains unchanged; only the host and port are replaced. |
| `www.example.com http://localhost:5173 excludeFilter://*/static excludeFilter://*/api` | Forwards all other requests for `www.example.com` (excluding `static` and `api` paths) to the local service `localhost:5173`. | This rule forwards both **HTTP and HTTPS** requests to `http://localhost:5173`. The server receives the forwarded URL. |

By adjusting the domain, local path, or test server address in the above rules according to your actual development environment, you can quickly achieve request forwarding to improve development and debugging efficiency.

## Modifying Request/Response Content

Dynamically modify the content of requests and responses passing through Whistle.

``` txt
# Set or replace a request header x-client: Whistle
www.example.com/path/to reqHeaders://({"x-client":"Whistle"})

# Modify request form data or JSON object
www.example.com/path/to reqMerge://({"test":123})

# Set CORS response header Access-Control-Allow-Origin: *, excluding OPTIONS requests
www.example.com/path/to resCors://* excludeFilter://m:option

# Inject script `alert(123)` at the end of the response page (supports HTML or JS type pages)
www.example.com/path/to  jsAppend://(alert(123))
```

## Remote Debugging: Inspecting DOM & Logs

Use the built-in **weinre** and **log** protocols for remote page debugging.

```txt
# Simultaneously enable remote DOM debugging (weinre) and log capture (log)
https://www.qq.com weinre://test log://
```

1.  **Access the weinre debugger**: After the rule is active, hover over the top menu `Weinre` and click the session name (e.g., `test`) to open the debugger interface.
    <img src="/img/weinre-menu.png" alt="Open weinre menu" width="360" />
2.  **Start debugging**: Open the target page (e.g., `https://www.qq.com`) in your browser. Then, select that page in the weinre interface. You can now inspect **Elements**, **Console**, etc., just like using browser developer tools.
    <img src="/img/weinre-main.png" alt="weinre main interface" width="800" />
3.  **View complete logs**: All page Console output and JavaScript errors will be displayed in the Whistle web interface under **Network → Right-side Tools → Console** tab.
    ![log basic demo](/img/log-basic.gif)

## Detailed Documentation
1. **[Interface Features Details](./gui/network)**: Deep dive into all features of the Network panel and others.
2. **[Complete Rules Configuration](./rules/rule)**: Reference all supported rule protocols and advanced usage.
