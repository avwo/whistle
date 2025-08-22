# tlsOptions
Configure the security parameters for HTTPS/TLS connections, used to establish encrypted communication channels and server authentication.
> Only the latest version of Whistle (≥ v2.9.101) supports this feature.

## Rule Syntax
``` txt
pattern tlsOptions://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Operation data object or cipher suite name, supported from the following sources:<br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching:<br/>• Request URL/method/header/content<br/>• Response status code/header | [Filters Documentation](./filters) |

tlsOptions Operation Object Structure:
1. Cipher Suite Name
    ``` txt
    ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384
    ```
    > Multiple suites are separated by `:`
2. `tls.connect(options)` Parameters
    ``` js
    {
      ciphers: string
      secureProtocol: string
      maxVersion: string
      minVersion: string
      honorCipherOrder: boolean
      ca: string
      allowPartialTrustChain: string
      sessionIdContext: string
      sigalgs: string
      dhparam: string
      ecdhCurve: string
      secureOptions: number
      sessionTimeout: number
      base: public path of the certificate
      passphrase: key content of a pfx certificate
      pfx: certificate content or local uuid
    }
    ```
    > See: https://nodejs.org/docs/latest/api/tls.html#tlscreatesecurecontextoptions

## Custom Cipher Suites
``` txt
www.example.com/path tlsOptions://ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384
```
> General manual configuration, see: https://github.com/avwo/whistle/issues/963

## Configuring the Client Certificate
Specify the client certificate for mutual authentication (mTLS) requests.

1. cert format certificate
    ``` txt
    www.exaple.com/path tlsOptions://key=/User/xxx/test.key&cert=/User/xxx/test.crt
    ```
2. pem format certificate
    ``` txt
    www.exaple.com/path tlsOptions://key=E:\test.pem&cert=E:\test.pem
    ```
3. pfx format certificate
    ``` txt
    www.exaple.com/path tlsOptions://passphrase=123456&pfx=/User/xxx/test.pfx
    ```
4. p12 format certificate
    ``` txt
    www.exaple.com/path tlsOptions://passphrase=123456&pfx=E:/test.p12
    ```
    > Windows paths can use a mix of `/` and `\`

## Embedded certificate content
```` txt
# Same for other certificate formats
``` test.json
{
  key: '----xxx----- ... ----xxx-----',
  cert: '----yyy----- ... ----yyy-----'
}

www.exaple.com/path tlsOptions://{test.json}
````

## Local/remote resource

```` txt
www.example.com/path1 tlsOptions:///User/xxx/test.json
www.example.com/path2 tlsOptions://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 tlsOptions://temp/blank.json
````
