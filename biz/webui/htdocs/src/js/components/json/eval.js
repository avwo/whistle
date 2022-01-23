var JSON_RE = /^\s*(?:\{[\w\W]*\}|\[[\w\W]*\])\s*$/;
var ctx = {};
var throwError = {
  get: function () {
    throw new Error('undefined');
  }
};

if (Object.defineProperty) {
  Object.defineProperty(ctx, 'console', throwError);
  for (var i in window) {
    ctx[i] = undefined;
    Object.defineProperty(ctx, i, throwError);
  }
}

function evalJson(str) {
  if (!JSON_RE.test(str)) {
    return;
  }
  with (ctx) {
    try {
      return eval('(' + str + ')');
    } catch (e) {}
  }
}

module.exports = evalJson;
