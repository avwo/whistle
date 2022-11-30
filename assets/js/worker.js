
var exports = {};
var module = { exports: exports };

;(function() {
  var self = null;
  try {
    (function() {
      /*sourcecode*/
    })();
  } catch (e) {
    setTimeout(function() {
      throw e;
    }, 20);
  }
})();

;(function() {
  !function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){"use strict";function r(e){try{return i(e)}catch(t){}}var o,i=n(1).toByteArray,a=n(2).Base64.decode,s=n(3);if(self.TextDecoder)try{o=new self.TextDecoder("GB18030")}catch(l){}self.getText=function(e){var t=e&&r(e);if(!t)return"";if(!s(t))try{if(o)return o.decode(t)}catch(n){}try{return a(e)}catch(n){}return""}},function(e,t){"use strict";function n(e){var t=e.length;if(t%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var n=e.indexOf("=");-1===n&&(n=t);var r=n===t?0:4-n%4;return[n,r]}function r(e){var t=n(e),r=t[0],o=t[1];return 3*(r+o)/4-o}function o(e,t,n){return 3*(t+n)/4-n}function i(e){var t,r,i=n(e),a=i[0],s=i[1],l=new d(o(e,a,s)),c=0,p=s>0?a-4:a;for(r=0;p>r;r+=4)t=u[e.charCodeAt(r)]<<18|u[e.charCodeAt(r+1)]<<12|u[e.charCodeAt(r+2)]<<6|u[e.charCodeAt(r+3)],l[c++]=t>>16&255,l[c++]=t>>8&255,l[c++]=255&t;return 2===s&&(t=u[e.charCodeAt(r)]<<2|u[e.charCodeAt(r+1)]>>4,l[c++]=255&t),1===s&&(t=u[e.charCodeAt(r)]<<10|u[e.charCodeAt(r+1)]<<4|u[e.charCodeAt(r+2)]>>2,l[c++]=t>>8&255,l[c++]=255&t),l}function a(e){return c[e>>18&63]+c[e>>12&63]+c[e>>6&63]+c[63&e]}function s(e,t,n){for(var r,o=[],i=t;n>i;i+=3)r=(e[i]<<16&16711680)+(e[i+1]<<8&65280)+(255&e[i+2]),o.push(a(r));return o.join("")}function l(e){for(var t,n=e.length,r=n%3,o=[],i=16383,a=0,l=n-r;l>a;a+=i)o.push(s(e,a,a+i>l?l:a+i));return 1===r?(t=e[n-1],o.push(c[t>>2]+c[t<<4&63]+"==")):2===r&&(t=(e[n-2]<<8)+e[n-1],o.push(c[t>>10]+c[t>>4&63]+c[t<<2&63]+"=")),o.join("")}t.byteLength=r,t.toByteArray=i,t.fromByteArray=l;for(var c=[],u=[],d="undefined"!=typeof Uint8Array?Uint8Array:Array,p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",f=0,g=p.length;g>f;++f)c[f]=p[f],u[p.charCodeAt(f)]=f;u["-".charCodeAt(0)]=62,u["_".charCodeAt(0)]=63},function(e,t,n){var r,o;(function(n){!function(t,n){e.exports=n(t)}("undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof n?n:this,function(n){"use strict";n=n||{};var i,a=n.Base64,s="2.6.4",l="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",c=function(e){for(var t={},n=0,r=e.length;r>n;n++)t[e.charAt(n)]=n;return t}(l),u=String.fromCharCode,d=function(e){if(e.length<2){var t=e.charCodeAt(0);return 128>t?e:2048>t?u(192|t>>>6)+u(128|63&t):u(224|t>>>12&15)+u(128|t>>>6&63)+u(128|63&t)}var t=65536+1024*(e.charCodeAt(0)-55296)+(e.charCodeAt(1)-56320);return u(240|t>>>18&7)+u(128|t>>>12&63)+u(128|t>>>6&63)+u(128|63&t)},p=/[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g,f=function(e){return e.replace(p,d)},g=function(e){var t=[0,2,1][e.length%3],n=e.charCodeAt(0)<<16|(e.length>1?e.charCodeAt(1):0)<<8|(e.length>2?e.charCodeAt(2):0),r=[l.charAt(n>>>18),l.charAt(n>>>12&63),t>=2?"=":l.charAt(n>>>6&63),t>=1?"=":l.charAt(63&n)];return r.join("")},h=n.btoa&&"function"==typeof n.btoa?function(e){return n.btoa(e)}:function(e){if(e.match(/[^\x00-\xFF]/))throw new RangeError("The string contains invalid characters.");return e.replace(/[\s\S]{1,3}/g,g)},m=function(e){return h(f(String(e)))},A=function(e){return e.replace(/[+\/]/g,function(e){return"+"==e?"-":"_"}).replace(/=/g,"")},M=function(e,t){return t?A(m(e)):m(e)},w=function(e){return M(e,!0)};n.Uint8Array&&(i=function(e,t){for(var n="",r=0,o=e.length;o>r;r+=3){var i=e[r],a=e[r+1],s=e[r+2],c=i<<16|a<<8|s;n+=l.charAt(c>>>18)+l.charAt(c>>>12&63)+("undefined"!=typeof a?l.charAt(c>>>6&63):"=")+("undefined"!=typeof s?l.charAt(63&c):"=")}return t?A(n):n});var b,y=/[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g,v=function(e){switch(e.length){case 4:var t=(7&e.charCodeAt(0))<<18|(63&e.charCodeAt(1))<<12|(63&e.charCodeAt(2))<<6|63&e.charCodeAt(3),n=t-65536;return u((n>>>10)+55296)+u((1023&n)+56320);case 3:return u((15&e.charCodeAt(0))<<12|(63&e.charCodeAt(1))<<6|63&e.charCodeAt(2));default:return u((31&e.charCodeAt(0))<<6|63&e.charCodeAt(1))}},T=function(e){return e.replace(y,v)},x=function(e){var t=e.length,n=t%4,r=(t>0?c[e.charAt(0)]<<18:0)|(t>1?c[e.charAt(1)]<<12:0)|(t>2?c[e.charAt(2)]<<6:0)|(t>3?c[e.charAt(3)]:0),o=[u(r>>>16),u(r>>>8&255),u(255&r)];return o.length-=[0,0,2,1][n],o.join("")},N=n.atob&&"function"==typeof n.atob?function(e){return n.atob(e)}:function(e){return e.replace(/\S{1,4}/g,x)},C=function(e){return N(String(e).replace(/[^A-Za-z0-9\+\/]/g,""))},I=function(e){return T(N(e))},E=function(e){return String(e).replace(/[-_]/g,function(e){return"-"==e?"+":"/"}).replace(/[^A-Za-z0-9\+\/]/g,"")},D=function(e){return I(E(e))};n.Uint8Array&&(b=function(e){return Uint8Array.from(C(E(e)),function(e){return e.charCodeAt(0)})});var L=function(){var e=n.Base64;return n.Base64=a,e};if(n.Base64={VERSION:s,atob:C,btoa:h,fromBase64:D,toBase64:M,utob:f,encode:M,encodeURI:w,btou:T,decode:D,noConflict:L,fromUint8Array:i,toUint8Array:b},"function"==typeof Object.defineProperty){var S=function(e){return{value:e,enumerable:!1,writable:!0,configurable:!0}};n.Base64.extendString=function(){Object.defineProperty(String.prototype,"fromBase64",S(function(){return D(this)})),Object.defineProperty(String.prototype,"toBase64",S(function(e){return M(this,e)})),Object.defineProperty(String.prototype,"toBase64URI",S(function(){return M(this,!0)}))}}return n.Meteor&&(Base64=n.Base64),"undefined"!=typeof e&&e.exports?e.exports.Base64=n.Base64:(r=[],o=function(){return n.Base64}.apply(t,r),!(void 0!==o&&(e.exports=o))),{Base64:n.Base64}})}).call(t,function(){return this}())},function(e,t){"use strict";function n(e,t){t=t||0;for(var n=Math.min(e.length,r);n>t;t++){var o=e[t];if(!(9==o||10==o||13==o||o>=32&&127>=o)){++t;var i=e[t];if(o>=194&&223>=o){if(i>=128&&191>=i)continue;return!i}++t;var a=e[t];if(224==o){if(i>=160&&191>=i&&a>=128&&191>=a)continue;return!a}if(o>=225&&236>=o||238==o||239==o){if(i>=128&&191>=i&&a>=128&&191>=a)continue;return!a}if(237==o){if(i>=128&&159>=i&&a>=128&&191>=a)continue;return!a}++t;var s=e[t];if(240==o){if(i>=144&&191>=i&&a>=128&&191>=a&&s>=128&&191>=s)continue;return!s}if(o>=241&&243>=o){if(i>=128&&191>=i&&a>=128&&191>=a&&s>=128&&191>=s)continue;return!s}if(244==o){if(i>=128&&143>=i&&a>=128&&191>=a&&s>=128&&191>=s)continue;return!s}return!1}}return!0}var r=32768;e.exports=function(e){return n(e)?!0:0===e[0]&&n(e,5)}}]);

  var getText = function(obj) {
    return self.getText(obj.base64);
  };
  var parseJson = function(str) {
    if (!str || !/^(?:\{[\s\S]*\}|\[[\s\S]*\])$/) {
      return;
    }
    try {
      return JSON.parse(str);
    } catch (e) {}
  };
  
  var defineProps = function (obj) {
    if (Object.defineProperties) {
      var body, json;
      var getBody = function () {
        if (body === undefined) {
          body = getText(obj);
        }
        return body;
      }
      Object.defineProperties(obj, {
        body: {  get: getBody  },
        json: {
          get: function () {
            if (json === undefined) {
              json = parseJson(getBody()) || null;
            }
            return json;
          }
        }
      });
    } else {
      obj.body = getText(obj) || '';
      obj.json = parseJson(obj) || null;
    }
    return obj;
  };
  var handle = module.exports;
  if (typeof handle !== 'function') {
    handle = null;
  }
  
  self.onmessage = function(e) {
    var data = handle && e.data;
    var id = data && data.id;
    if (!id) {
      return;
    }
    data.res = defineProps(data.res || {});
    data.req = defineProps(data.req || {});
    data.req.headers = data.req.headers || {};
    data.res.headers = data.res.headers || {};
    handle(data, function(result) {
      result && self.postMessage({
        id: id,
        data: result
      });
    });
  };
})();

self.postMessage(true);

