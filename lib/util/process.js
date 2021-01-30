var now = Date.now();
var procInfo = {
  memUsage: process.memoryUsage(),
  uptime: 0,
  startupTime: now,
  httpRequests: 0,
  wsRequests: 0,
  tunnelRequests: 0,
  totalHttpRequests: 0,
  totalWsRequests: 0,
  totalTunnelRequests: 0
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
    procInfo.cpuPercent = (100 * (elapUserMS + elapSystMS) / elapTimeMS).toFixed(1) + '%';
    procInfo.memUsage = process.memoryUsage();
  }, 3000);
  setInterval(function() {
    procInfo.uptime = Date.now() - now;
  }, 1000);
}

module.exports = procInfo;
