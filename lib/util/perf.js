var now = Date.now();
var preData = {
  now: now,
  totalHttpRequests: 0,
  totalWsRequests: 0,
  totalTunnelRequests: 0,
  totalAllHttpRequests: 0,
  totalAllWsRequests: 0
};
var memUsage = process.memoryUsage();
var maxCpuElap = 0;
var procData = {
  memUsage: memUsage,
  uptime: 0,
  cpuPercent: '0.0%',
  startupTime: now,
  updateTime: now,
  httpRequests: 0,
  allHttpRequests: 0,
  wsRequests: 0,
  allWsRequests: 0,
  tunnelRequests: 0,
  totalHttpRequests: 0,
  totalWsRequests: 0,
  totalTunnelRequests: 0,
  totalAllHttpRequests: 0,
  totalAllWsRequests: 0,
  httpQps: 0,
  tunnelQps: 0,
  wsQps: 0,
  totalQps: 0,
  maxQps: 0,
  maxAllQps: 0,
  maxRss: memUsage.rss,
  maxCpu: 0,
  maxQpsTime: now,
  maxAllQpsTime: now,
  maxRssTime: now,
  maxCpuTime: now
};
var startTime = typeof process.hrtime === 'function' && process.hrtime();
var startUsage = typeof process.cpuUsage === 'function' && process.cpuUsage();
var proxy;

function secNSec2ms(secNSec) {
  if (Array.isArray(secNSec)) {
    return secNSec[0] * 1000 + secNSec[1] / 1000000;
  }
  return secNSec / 1000;
}

if (startTime !== false && startUsage !== false) {
  setInterval(function () {
    var elapTime = process.hrtime(startTime);
    var elapUsage = process.cpuUsage(startUsage);
    startTime = process.hrtime();
    startUsage = process.cpuUsage();
    var elapTimeMS = secNSec2ms(elapTime) || 1;
    var elapUserMS = secNSec2ms(elapUsage.user);
    var elapSystMS = secNSec2ms(elapUsage.system);
    var cpuElap = (100 * (elapUserMS + elapSystMS)) / elapTimeMS;
    var curTime = Date.now();
    procData.cpuPercent = cpuElap.toFixed(1) + '%';
    procData.memUsage = process.memoryUsage();
    procData.updateTime = curTime;
    if (cpuElap > maxCpuElap) {
      maxCpuElap = cpuElap;
      procData.maxCpu = cpuElap.toFixed(1) + '%';
      procData.maxCpuTime = curTime;
    }
    if (procData.memUsage.rss > procData.maxRss) {
      procData.maxRss = procData.memUsage.rss;
      process.maxRssTime = curTime;
    }
    proxy && proxy.emit('perfDataChange', procData);
  }, 3000);
  setInterval(function () {
    var curTime = Date.now();
    var costTime = curTime - preData.now || 1;
    var newHttpReqs = procData.totalHttpRequests - preData.totalHttpRequests;
    var newTunnelReqs =
      procData.totalTunnelRequests - preData.totalTunnelRequests;
    var newWsReqs = procData.totalWsRequests - preData.totalWsRequests;
    var newHttpUIReqs =
      procData.totalAllHttpRequests - preData.totalAllHttpRequests;
    var newWsUIReqs = procData.totalAllWsRequests - preData.totalAllWsRequests;
    preData.now = curTime;
    preData.totalHttpRequests = procData.totalHttpRequests;
    preData.totalTunnelRequests = procData.totalTunnelRequests;
    preData.totalWsRequests = procData.totalWsRequests;
    preData.totalAllHttpRequests = procData.totalAllHttpRequests;
    preData.totalAllWsRequests = procData.totalAllWsRequests;
    procData.uptime = curTime - now;
    procData.httpQps = Math.floor((newHttpReqs * 100000) / costTime);
    procData.tunnelQps = Math.floor((newTunnelReqs * 100000) / costTime);
    procData.wsQps = Math.floor((newWsReqs * 100000) / costTime);
    procData.allHttpQps = Math.floor((newHttpUIReqs * 100000) / costTime);
    procData.allWsQps = Math.floor((newWsUIReqs * 100000) / costTime);
    var totalQps = procData.httpQps + procData.tunnelQps + procData.wsQps;
    var totalAllQps =
      procData.allHttpQps + procData.allWsQps + procData.tunnelQps;
    procData.totalQps = totalQps;
    procData.totalAllQps = totalAllQps;
    if (procData.maxQps < totalQps) {
      procData.maxQps = totalQps;
      procData.maxQpsTime = curTime;
    }
    if (procData.maxAllQps < totalAllQps) {
      procData.maxAllQps = totalAllQps;
      procData.maxAllQpsTime = curTime;
    }
  }, 1000);
}
exports.procData = procData;
exports.setProxy = function (p) {
  proxy = p;
};
