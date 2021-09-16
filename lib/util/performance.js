const { PerformanceObserver, performance } = require('perf_hooks');

const identity = x => x;
const log = (msg, color = identity) => {
  require('console').log(color(msg));
};

if (process.env.VERBOSE) {
  new PerformanceObserver(list => {
    var entry = list.getEntries()[0];
    log(`${ entry.name }: ${ entry.duration }ms`);
  }).observe({ entryTypes: ['measure'], buffered: false });
}

module.exports = {
  log,
  perf: new class {
    _startMark = 'received_http_request';
    start(mark) {
      performance.mark(this._startMark);
      if (process.env.VERBOSE) log(mark);
    }
    measure(mark) {
      performance.mark(mark);
      performance.measure(mark, this._startMark, mark);
    }
  }
};
