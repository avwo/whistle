# weinre
Injects the Weinre (Web Inspector Remote) web debugging tool into the page, allowing developers to debug web pages on mobile devices directly from their computers.

## Rule Syntax
``` txt
pattern weinre://id [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| id | Weinre ID, a plain string, used for group filtering | |
| filters | Optional filters, supporting matching: • Request URL/Method/Header/Content • Response Status Code/Header | [Filter Documentation](./filters) |

For detailed usage, refer to [UI Menu Weinre Usage](../gui/weinre)
