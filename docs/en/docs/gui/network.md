# Network Interface

Interface for viewing and managing captured packet data

<img src="/img/network.png" alt="Network Interface" width="1000" />

## Bottom Search Box {#filter}

The search box supports various advanced filtering methods, allowing you to quickly locate specific types of requests by prefix:

| Prefix | Filter Target | Example |
| -------------- | ----------------------------------- | --------------------------------- |
| `No Prefix` | Request URL | `example.com/api` `/abc=123/i` |
| `m:pattern` | Request Method | `m:pos` `m:/get\|post/i` |
| `h:pattern` | Request/Response Header Raw Text | `h:image/` `h:/cookie:\s*test=123/i` |
| `H:pattern` | Request Header Host Field | `H:example.com` `H:/test/i` |
| `b:pattern` | Request/response body original content | `b:"error":true` `b:/\d{3}/` |
| `i:pattern` | Client IP or server IP | `i:11.2` `i:/^11\.2/` |
| `s:pattern` | Response status code | `s:404` `s:/5\d{2}/` |
| `t:pattern` | Response header Content-Type | `t:json` `t:/html\|xml/i` |
| `mark:pattern` | Request URL manually marked in the right-click menu | `mark:example.com` `mark:/\d{5}/` |
| `app:pattern` | Filter by app name | `app:wechat` `app:chrome` |
| `fc:pattern` | Request URL issued by Composer | `fc:/test/` `fc:www.test.com` |
| `e:pattern` | Errored request URL | `e:timeout` `e:/abort/i` |
| `style:pattern` | [style](../rules/style) Operation content | `style:italic` `style:/ita/i` |

`pattern` is a **keyword** or **regular expression**. Use "AND" to search for multiple conditions:
``` txt
b:/"success":false/ m:POST s:200 H:api.example.com
```

## Settings
**Exclude Filter** and **Include Filter** allow for refined filtering of captured data not displayed in the Network view. Multiple condition combinations are supported:

| **Filter Type** | **Function** | |
| ------------------ | ---------------------------------------- | ---- |
| **Include Filter** | **Only retain** requests that meet the conditions (equivalent to a whitelist) | |
| **Exclude Filter** | **Exclude** requests that meet the conditions (equivalent to a blacklist) | |

1. Conditions within a single input box
   - Separation method: Use spaces or newlines to separate multiple conditions
   - Logical relationship: Conditions are ORed
   > Example: `example.com api.test.com` → Matches requests from example.com or api.test.com
2. Conditions between multiple input boxes
   - Logical relationship: Conditions are ANDed
   - Example:
     - Include Filter input: `m:GET`
     - Exclude Filter input: `h:/cookie:[^\r\n]*test=123/`
     - Result: Only GET requests are retained, and requests containing `test=123` in the request header cookie are excluded

**Supported filter conditions**:

| **Syntax** | **Effect** | **Example** |
| ----------- | ------------------------------- | -------------------------------------------- |
| `no prefix` | Matches requests whose request URL contains this keyword | `.example.com` |
| `m:pattern` | Matches request method | `m:POST` (matches POST requests) |
| `h:pattern` | Matches original request header | `h:/cookie:[^\r\n]*test=123/` (matches cookies) |
| `H:pattern` | Matches request header Host field | `H:example.com` `H:/test/i` |
| `i:pattern` | Matches client IP | `i:11.2` `i:/^11\.2/` |

Different from the search box at the bottom of the Network list:

| **Function** | **Network search box** | **Filter in Settings** |
| ---------------- | -------------------------- | ------------------------------------ |
| **Match range** | All data in the request and response stages | **Matches only the request phase** (does not include response data) |
| **Effective Time** | Filters displayed and future requests in real time | **Effective only for new future requests** |
| **Affects Historical Data** | Can filter existing packet capture records | **Does not affect displayed requests** |

**Other Options:**

| Item Name | Function Description |
| ----------------------------------------- | -------------------------------------------------------- |
| **Network Columns** | Customize the columns displayed in the packet capture list (such as status code, method, size, etc.) |
| **Maximum Rows** | Set the maximum number of packets displayed simultaneously (to prevent memory overflow) |
| **Viewing only your computer's requests** | Displays only requests sent by the local computer (filters requests from other devices/remote requests) |
| **View All in new window** | Click "View All" to open the full content in a new window (suitable for viewing large response bodies) |
| **Show Tree View** | Displays requests in a tree structure (grouped by domain name/path) |

## Details Panel {#detail}

1. Overview: Basic information about matching rules and requests
2. Inspectors: Detailed information about request/response headers and content
3. Timeline: Request performance information
4. Composer: [Composer interface](./https)
5. Tools: Various tools
   - Console: Displays remote console logs. For details, see [Console](./console)
   - Server: Displays exceptions that occur during Whistle execution
   - Toolbox: Common tools and methods

## Other Menus
1. Replay: Replays the selected capture data
2. Edit: Populates the capture data in the Composer window on the right
3. Arrow button in the upper right corner: Switches to top-down panel mode, suitable for portrait-oriented monitors
