let installPlugins = require('./lib/plugins')
let models =  require('./lib/model')
installPlugins(models);
module.exports = models;



