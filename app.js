var colors = require('colors/safe');

/*eslint no-console: "off"*/
require('./index')(function() {
  console.log(colors.green('whistle is listening on ' + this.address().port + '.'));
});
