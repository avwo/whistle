'use strict';

const assert = require('assert').strict;
const { once } = require('events');
const fs = require('fs');
const http = require('http');
const http2 = require('http2');
const os = require('os');
const path = require('path');
const tls = require('tls');
const { setTimeout: delay } = require('timers/promises');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whistle-h2-bridge-'));
process.env.WHISTLE_PATH = dataDir;
const startWhistle = require('../index');
const host = 'bridge.test';

async function openSession(port, headers, ca) {
  const connect = http.request({
    host: '127.0.0.1', port, method: 'CONNECT', path: host + ':443', headers, agent: false
  });
  connect.end();
  const [response, socket] = await once(connect, 'connect');
  assert.equal(response.statusCode, 200);
  const secure = tls.connect({ socket, servername: host, ca, ALPNProtocols: ['h2'] });
  await once(secure, 'secureConnect');
  assert.equal(secure.alpnProtocol, 'h2');
  return http2.connect('https://' + host, { createConnection: () => secure });
}

function readBody(stream) {
  return new Promise((resolve, reject) => {
    let body = '';
    stream.setEncoding('utf8');
    stream.on('data', chunk => {
      body += chunk;
    });
    stream.on('end', () => resolve(body));
    stream.on('error', reject);
  });
}

async function run() {
  const proxy = http.createServer();
  const origin = http.createServer((req, res) => {
    if (req.url !== '/hold') {
      res.end(req.url);
    }
  });
  origin.listen(0, '127.0.0.1');
  await once(origin, 'listening');
  proxy.listen(0, '127.0.0.1');
  await once(proxy, 'listening');
  await new Promise(resolve => startWhistle({
    server: proxy,
    baseDir: dataDir,
    debugMode: true,
    noGlobalPlugins: true,
    disableAllPlugins: true,
    mode: 'capture|http2|disableUpdateTips',
    h2BridgeSockets: 1,
    shadowRules: host + ' http://127.0.0.1:' + origin.address().port
  }, resolve));
  const ca = fs.readFileSync(require('../lib/https/ca').getRootCAFile());
  const a = await openSession(proxy.address().port, {
    'x-forwarded-for': '192.0.2.45', 'x-whistle-tunnel-data': 'A'
  }, ca);
  const b = await openSession(proxy.address().port, {}, ca);
  const agent = require('../lib/config').h2BridgeAgent;
  const received = new Map();
  proxy.on('request', req => received.set(req.url, {
    socket: req.socket, ip: req.clientIp, fromTunnel: req.fromTunnel,
    marker: req.headers['x-whistle-tunnel-data']
  }));

  async function waitForQueuedRequest(pathname) {
    while (!Object.values(agent.requests).some(queue => queue.some(req => req.path === pathname))) {
      await delay(1);
    }
  }

  async function pair(contentType, releaseEarly) {
    received.clear();
    const arrived = once(origin, 'request');
    const stream = a.request({ ':path': '/hold' });
    const firstBody = readBody(stream);
    const [, response] = await arrived;
    const small = readBody(b.request({ ':path': '/small' }));
    // Make the ordering deterministic: B must already be waiting when A sends headers.
    await waitForQueuedRequest('/small');
    const headers = once(stream, 'response');
    response.writeHead(200, { 'Content-Type': contentType, Connection: 'keep-alive' });
    response.write('first');
    await headers;
    const bridgeSocket = received.get('/hold').socket;
    const closed = releaseEarly && once(bridgeSocket, 'close');
    if (releaseEarly) {
      assert.equal(await small, '/small');
      assert.notEqual(received.get('/hold').socket, received.get('/small').socket);
    }
    response.end('last');
    assert.equal(await firstBody, 'firstlast');
    assert.equal(await small, '/small');
    if (releaseEarly) {
      await closed;
    } else {
      const first = received.get('/hold');
      const second = received.get('/small');
      assert.equal(first.socket, second.socket, 'B should reuse the bridge socket from A');
      assert.equal(first.ip, '192.0.2.45');
      assert.equal(first.marker, 'A');
      assert.equal(second.ip, '127.0.0.1');
      assert.equal(second.marker, undefined);
      assert.equal(second.fromTunnel, true);
      assert.ok(!second.socket.fromTunnel, 'tunnel identity must stay on the request');
    }
  }

  for (const [type, releaseEarly] of [
    ['multipart/mixed; boundary=frame', false],
    ['text/event-stream; charset=utf-8', true],
    ['multipart/x-mixed-replace; boundary=frame', true]
  ]) {
    const timeout = setTimeout(() => {
      console.error('HTTP/2 bridge stalled while testing ' + type); // eslint-disable-line no-console
      process.exit(1);
    }, 10000);
    await pair(type, releaseEarly);
    clearTimeout(timeout);
  }
  const arrived = once(origin, 'request');
  const held = readBody(a.request({ ':path': '/hold' }));
  const [, response] = await arrived;
  const cancelled = b.request({ ':path': '/cancelled' });
  await waitForQueuedRequest('/cancelled');
  const cancelledClosed = once(cancelled, 'close');
  cancelled.close(http2.constants.NGHTTP2_CANCEL);
  await cancelledClosed;
  // A subsequent stream is processed after the cancellation on the same H2 session.
  const next = readBody(b.request({ ':path': '/next' }));
  await waitForQueuedRequest('/next');
  response.end('done');
  assert.equal(await held, 'done');
  assert.equal(await next, '/next');
  assert.ok(!received.has('/cancelled'), 'a cancelled request reached the bridge listener');
  const burst = Array.from({ length: 200 }, (_, index) => '/module-' + index);
  const bodies = await Promise.all(burst.map(url => readBody(b.request({ ':path': url }))));
  assert.deepEqual(bodies, burst);
  a.destroy();
  b.destroy();
  origin.close();
  proxy.close();
}

process.on('exit', () => fs.rmSync(dataDir, { recursive: true, force: true }));
setTimeout(() => { throw new Error('HTTP/2 bridge test timed out'); }, 30000).unref();
run().then(() => process.exit(0), err => {
  console.error(err); // eslint-disable-line no-console
  process.exit(1);
});
