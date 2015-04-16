
module.exports = ['./file-proxy', 
                  './http-proxy', 
                  './final-handler', 
                  './error-handler'].map(function(mod) {
                	  return require(mod);
                  });