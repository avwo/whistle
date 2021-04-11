var now = Date.now();
var preData = {
  now: now,
  totalHttpRequests: 0,
  totalWsRequests: 0,
  totalTunnelRequests: 0
};
var memUsage = process.memoryUsage();
var maxCpuElap = 0;
var procInfo = {
  memUsage: memUsage,
  uptime: 0,
  cpuPercent: '0.0%',
  startupTime: now,
  updateTime: now,
  httpRequests: 0,
  wsRequests: 0,
  tunnelRequests: 0,
  totalHttpRequests: 0,
  totalWsRequests: 0,
  totalTunnelRequests: 0,
  httpQps: 0,
  tunnelQps: 0,
  wsQps: 0,
  totalQps: 0,
  maxQps: 0,
  maxRss: memUsage.rss,
  maxCpu: 0
};
var startTime = typeof process.hrtime === 'function' && process.hrtime();
var startUsage = typeof process.cpuUsage === 'function' && process.cpuUsage();

function secNSec2ms (secNSec) {
  if (Array.isArray(secNSec)) { 
    return secNSec[0] * 1000 + secNSec[1] / 1000000; 
  }
  return secNSec / 1000; 
}

if (startTime !== false && startUsage !== false) {
  setInterval(function() {
    var elapTime = process.hrtime(startTime);
    var elapUsage = process.cpuUsage(startUsage);
    startTime = process.hrtime();
    startUsage = process.cpuUsage();
    var elapTimeMS = secNSec2ms(elapTime) || 1;
    var elapUserMS = secNSec2ms(elapUsage.user);
    var elapSystMS = secNSec2ms(elapUsage.system);
    var cpuElap = 100 * (elapUserMS + elapSystMS) / elapTimeMS;
    procInfo.cpuPercent = cpuElap.toFixed(1) + '%';
    procInfo.memUsage = process.memoryUsage();
    procInfo.updateTime = Date.now();
    if (cpuElap > maxCpuElap) {
      maxCpuElap = cpuElap;
      procInfo.maxCpu = cpuElap.toFixed(1) + '%';
    }
    if (procInfo.memUsage.rss > procInfo.maxRss) {
      procInfo.maxRss = procInfo.memUsage.rss;
    }
  }, 3000);
  setInterval(function() {
    var curTime = Date.now();
    var costTime = curTime - preData.now || 1;
    var newHttpReqs = procInfo.totalHttpRequests - preData.totalHttpRequests;
    var newTunnelReqs = procInfo.totalTunnelRequests - preData.totalTunnelRequests;
    var newWsReqs = procInfo.totalWsRequests - preData.totalWsRequests;
    preData.now = curTime;
    preData.totalHttpRequests = procInfo.totalHttpRequests;
    preData.totalTunnelRequests = procInfo.totalTunnelRequests;
    preData.totalWsRequests = procInfo.totalWsRequests;
    procInfo.uptime = curTime - now;
    procInfo.httpQps = Math.floor(newHttpReqs * 100000 / costTime);
    procInfo.tunnelQps = Math.floor(newTunnelReqs * 100000 / costTime);
    procInfo.wsQps = Math.floor(newWsReqs * 100000 / costTime);
    var totalQps = procInfo.httpQps + procInfo.tunnelQps + procInfo.wsQps;
    procInfo.totalQps = totalQps;
    if (procInfo.maxQps < totalQps) {
      procInfo.maxQps = totalQps;
    }
  }, 1000);
}

module.exports = procInfo;
