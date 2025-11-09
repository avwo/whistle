# NPM Module
Whistle can be integrated into your project as an NPM module. It's strongly recommended that you run Whistle in a separate child process to avoid interfering with the main process and to facilitate management.

## Install dependencies
``` sh
npm i --save whistle pfork
```

## Standalone Service Mode
1. Create the Whistle startup script (`/lib/whistle.js`):
    ``` js
    const startWhistle = require('whistle');

    module.exports = (options, callback) => {
      startWhistle({ port: options.port }, () => callback());
    };
    ```
    > For startup parameters such as disabling plugins, customizing plugin directories, and modifying storage directories, refer to: https://github.com/avwo/whistle/blob/master/index.d.ts
2. Start the Whistle process code:
    ``` js
    const { fork } = require('pfork');
    const path = require('path');

    const script = path.join(__dirname, './whistle.js');
    const options = {
      script,
      port: 8080,
    };
    const forkWhistle = (retry) => {
      fork(options, (err, result, child) => {
        if (err) {
          // Initialization error, exit the service directly
          if (!retry) {
            throw err;
          }
          // Retry error, delay 100 milliseconds before retrying
          return setTimeout(forkWhistle, 100);
        }
        // Child process automatically retry after exit
        child.once('close', () => forkWhistle(true));
      });
    };

    forkWhistle();
    ```

Starting Whistle this way is the same as starting Whistle independently or as a Whistle client from the command line.

## Internal Service Mode (Recommended)

1. Create the Whistle startup script (`/lib/whistle.js`):
    ``` js
    const startWhistle = require('whistle');
    const http = require('http');

    let curPort = 30013;

    const getPort = (callback) => {
      const server = http.createServer();
      server.on('error', () => {
        if (++curPort % 5 === 0) {
          ++curPort;
        }
        getPort(callback);
      });
      server.listen(curPort, '127.0.0.1', () => {
        server.removeAllListeners();
        server.close(() => callback(curPort));
      });
    };

    module.exports = (options, callback) => {
    // Get a random port
    getPort((port) => {
    // Start at a random port Whistle, after successful startup, passes startup parameters to the parent process.
    const options = {
      port,
      host: '127.0.0.1',
      storage: 'xxx', // It is recommended to set a new storage directory to ensure that it does not conflict with the directories of other instances
    };
    startWhistle(options, () => callback(options));
    });
    };
    ```
    > Reference: https://github.com/Tencent/nohost/blob/master/lib/whistle.js
    >
    > Whistle will
2. Start the Whistle process method (`/lib/fork.js`):
    ``` js
    const { fork } = require('pfork');
    const path = require('path');

    const script = path.join(__dirname, './whistle.js');
    const options = {
      script,
    };

    module.exports = () => {
      return new Promise((resolve, reject) => {
        fork(options, (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        });
      });
    };
    ```
    > Reference: https://github.com/Tencent/nohost/blob/master/lib/main/whistleMgr.js
3. Forward the specified request in the project to Whistle:
    ``` js
    const { createServer } = require('http');
    const forkWhistle = require('./fork');

    const server = createServer(async (req, res) => {
      try {
      const { host, port } = await forkWhistle();
      // Forward the request to host, port
      } catch (e) {
      // handle errors
      }
    });

    server.listen(8010);
    ```
    > Reference: https://github.com/Tencent/nohost/blob/master/lib/index.js#L160

Started in this way Whistle uses a random port and is started on demand. External requests do not access Whistle directly but are forwarded through the project's services. This provides more flexibility and is the recommended method for project integration.

## Related Documentation

1. For all Whistle startup parameters, see the source code type definitions: https://github.com/avwo/whistle/blob/master/index.d.ts
2. pfork: https://github.com/avwo/pfork
3. Complete example: https://github.com/Tencent/nohost
