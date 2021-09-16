const { PerformanceObserver, performance } = require('perf_hooks');
const { green, yellow, red } = require('colors');

const identity = x => x;
const log = (msg, color = identity) => {
  require('console').log(color(msg));
};
const colorize = duration => {
  if (duration < 100) return green(`${ duration }ms`);
  if (duration > 500) return yellow(`${ duration }ms`);
  return red(`${ duration }ms`);
};

if (process.env.VERBOSE) {
  new PerformanceObserver(list => {
    const [entry] = list.getEntries();
    const { name, duration } = entry;
    log(`${ name }: ${ colorize(duration) }`);
  }).observe({ entryTypes: ['measure'], buffered: false });
}

module.exports = {
  log,
  perf: new class {
    _startMark = '_start_';
    start(mark) {
      this._startMark = mark;
      performance.mark(this._startMark);
      if (process.env.VERBOSE) log(`${ mark}: ${ colorize(0) }`);
    }
    measure(mark) {
      performance.mark(mark);
      performance.measure(mark, this._startMark, mark);
    }
  }
};
