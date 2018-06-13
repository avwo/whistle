var JSON_RE = /^\s*(?:\{[\w\W]*\}|\[[\w\W]*\])\s*$/;

function evalJson(str) {
  if (!JSON_RE.test(str)) {
    return;
  }
  var ctx = { console: undefined };
  for (var i in window) {
    ctx[i] = undefined;
  }
  with(ctx) {
    try {
      return eval('(' + str + ')');
    } catch(e) {}
  }
}

module.exports = evalJson;