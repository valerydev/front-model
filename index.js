let installPlugins = require('./lib/plugins')
let ModelRegistry = require('./lib/ModelRegistry')

module.exports = function(schema) {
  ModelRegistry.$registry = new ModelRegistry(schema)
  installPlugins(ModelRegistry.$registry)
  return ModelRegistry.$registry
}



