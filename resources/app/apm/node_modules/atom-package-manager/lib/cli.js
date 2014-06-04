(function() {
  var apm;

  apm = require('./apm-cli');

  apm.run(process.argv.slice(2));

}).call(this);
