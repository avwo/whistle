# frameScript
Manipulate WebSocket and regular TCP request data frames through JavaScript scripts.

## Rule Syntax
``` txt
pattern frameScript://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | JS script to generate rules. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values ​​Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
```` txt
``` test-frame.js
// Send preset data
ctx.sendToServer('1 = 0x12300000');
ctx.sendToClient('1 = 0x1236666666');

// Process the data frame sent to the server
ctx.handleSendToServerFrame = function(buf, opts) {
// Can return empty, null, undefined, etc.
return (buf + '').replace(/1/g, '***');
};

// Process the data frame sent to the client
ctx.handleSendToClientFrame = function(buf, opts) {
// Can return empty, null, undefined, etc.
return (buf + '').replace(/1/g, '+++');
};
```

wss://echo.websocket.org/ frameScript://{test-frame.js}
````
Visiting `https://echo.websocket.org/.ws` Results:

<img width="1200" alt="frame-script" src="/img/frame-script.png" />

#### Available Global Variables

| Variable/Method | Description |
|--------------------|---------------------------------------------------------------------|
| `url` | Full request URL |
| `method` | Request method (GET/POST, etc.) |
| `ip`/`clientIp` | Client IP address |
| `headers` | Request header object |
| `rules` | Rule array, add new rules via push |
| `values` | Temporary value storage object |
| `render(tpl,data)` | Micro template rendering function |
| `getValue(key)` | Get the value in `Values` |
| `parseUrl` | Same as `url.parse` in Node.js |
| `parseQuery` | Same as `querystring.parse` in Node.js |
| `sendToClient(frame, options)` | Sends data (object, string, buffer) to the client. See the example below. |
| `sendToServer(frame, options)` | Sends data (object, string, buffer) to the server. See the example below. |
| `handleSendToClientFrame(buffer, options)` | Processes (filters or deletes) data sent to the client. See the example below. |
| `handleSendToServerFrame(buffer, options)` | Processes (filters or deletes) data sent to the server. See the example below. |

