# cipher
When a Node.js request fails due to a mismatch between the TLS version and the encryption algorithm, a custom fallback encryption algorithm suite is automatically enabled to ensure the HTTPS connection is established properly.

## Rule Syntax
``` txt
pattern cipher://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Encryption algorithm (see list below)<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

**Partial List of Optional Encryption Algorithms**
- `ECDHE-ECDSA-AES256-GCM-SHA384`
- `NULL-SHA256`, `AES128-SHA256`,
- `AES256-SHA256`
- `AES128-GCM-SHA256`
- `AES256-GCM-SHA384`
- `DH-RSA-AES128-SHA256`
- `DH-RSA-AES256-SHA256`
- `DH-RSA-AES128-GCM-SHA256`
- `DH-RSA-AES256-GCM-SHA384`
- `DH-DSS-AES128-SHA256`
- `DH-DSS-AES256-SHA256`
- `DH-DSS-AES128-GCM-SHA256`
- `DH-DSS-AES256-GCM-SHA384`
- `DHE-RSA-AES128-SHA256`
- `DHE-RSA-AES256-SHA256`
- `DHE-RSA-AES128-GCM-SHA256`
- `DHE-RSA-AES256-GCM-SHA384`
- `DHE-DSS-AES128-SHA256`
- `DHE-DSS-AES256-SHA256`
- `DHE-DSS-AES128-GCM-SHA256`
- `DHE-DSS-AES256-GCM-SHA384`
- `ECDHE-RSA-AES128-SHA256`
- `ECDHE-RSA-AES256-SHA384`
- `ECDHE-RSA-AES128-GCM-SHA256`
- `ECDHE-RSA-AES256-GCM-SHA384`
- `ECDHE-ECDSA-AES128-SHA256`
- `ECDHE-ECDSA-AES256-SHA384`
- `ECDHE-ECDSA-AES128-GCM-SHA256`
- `ECDHE-ECDSA-AES256-GCM-SHA384`
- `ADH-AES128-SHA256`
- `ADH-AES256-SHA256`
- `ADH-AES128-GCM-SHA256`
- `ADH-AES256-GCM-SHA384`
- `AES128-CCM`
- `AES256-CCM`
- `DHE-RSA-AES128-CCM`
- `DHE-RSA-AES256-CCM`
- `AES128-CCM8`
- `AES256-CCM8`
- `DHE-RSA-AES128-CCM8`
- `DHE-RSA-AES256-CCM8`
- `ECDHE-ECDSA-AES128-CCM`
- `ECDHE-ECDSA-AES256-CCM`
- `ECDHE-ECDSA-AES128-CCM8`
- `ECDHE-ECDSA-AES256-CCM8`

## Configuration Example
``` txt
www.example.com cipher://DH-RSA-AES256-GCM-SHA384
```

Reference: https://github.com/avwo/whistle/issues/963
