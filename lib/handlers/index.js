
module.exports = ['./file-proxy', 
                  './http-proxy', 
                  './plugin-handler', 
                  './final-handler', 
                  './error-handler'].map(function(mod) {
                	  return require(mod);
                  });