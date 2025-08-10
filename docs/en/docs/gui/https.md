# HTTPS Dialog

The HTTPS Settings dialog box is used to configure HTTPS packet capture and certificate management. The interface is as follows:

<img src="/img/https.png" alt="HTTPS Dialog Box" width="1000" />

| Function/Option | Description | Notes |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| **Download RootCA** | Download the Whistle root certificate to your local computer | Used for initial installation or when the certificate expires |
| **rootCA.xxx Selector** | Switch certificate formats: `.crt`, `.cer`, `.pem` | If installation of a certain certificate format fails, try another format |
| **QR Code Address Selector** | Switch mobile certificate download address | Convenient for scanning and downloading certificates on mobile phones. See [Mobile Packet Capture](../mobile) for details |
| **Enable HTTPS (Capture Tunnel Traffic)** | Enable HTTPS traffic decryption (requires root certificate installation) | Can also be controlled through rules: `enable://https` `disable://https` |
| **Enable HTTP/2** | Enable HTTP/2 protocol support (enabled by default) | Can also be controlled via rules: `enable://http2` `disable://http2` |
