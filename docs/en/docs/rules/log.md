# log
Inject JS code into the page to capture JS exceptions and `console.xxx` logs, and display them on the Whistle management interface.

## Rule Syntax
``` txt
pattern log://id [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| id | Log ID, a plain string, used for group filtering | |
| filters | Optional filters, supports matching: • Request URL/Method/Headers/Content • Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
www.qq.com log://
```

![log basic](/img/log-basic.gif)

``` txt
ke.qq.com log://ke
news.qq.com log://news
```

![log switch](/img/log-switch.gif)
