# HTTPS Dialog

The HTTPS Settings dialog box is used to configure HTTPS packet capture and certificate management. The interface is as follows:

<img src="/img/https.png" alt="HTTPS Dialog Box" width="380" />

| Function/Option | Description | Notes |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| **Download RootCA** | Download the Whistle root certificate to your local computer | Used for initial installation or when the certificate expires |
| **rootCA.xxx Selector** | Switch certificate formats: `.crt`, `.cer`, `.pem` | If installation of a certain certificate format fails, try another format |
| **QR Code Address Selector** | Switch mobile certificate download address | Convenient for scanning and downloading certificates on mobile phones. See [Mobile Packet Capture](../mobile) for details |
| **Enable HTTPS (Capture Tunnel Traffic)** | Enable HTTPS traffic decryption (requires root certificate installation) | Can also be controlled through rules: `enable://https` `disable://https` |
| **Enable HTTP/2** | Enable HTTP/2 protocol support (enabled by default) | Can also be controlled via rules: `enable://http2` `disable://http2` |
| **Custom Certs Settings** | View, Upload, or Delete User-Defined Certificates | Direct uploading of root certificates is not supported. If you need to customize the root certificate, you must place it in the custom certificate directory and restart Whistle for it to take effect. |

## Custom Certs Settings {#custom-certs}
Click the **Custom Certs Settings** button to open the custom certificate management panel. In this panel, you can upload server certificates used in your official business (commonly used to resolve SSL pinning detection issues).

Certificate files must be uploaded in pairs, meaning each upload must include one key file and one certificate file. Supported file pairing formats are as follows (actual filenames can be customized, but extensions must meet the requirements):
1. `.key` file + `.cer` file
2. `.key` file + `.crt` file
3. `.key` file + `.pem` file

For example:
- `server.key` and `server.cer`
- `mycert.key` and `mycert.crt`
- `cert.key` and `cert.pem`

Please ensure that each certificate and key file pair matches in content; otherwise, certificate configuration may fail.
