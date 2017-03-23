let _  = require('lodash')
let $request = require('./Utils').$request
let EventEmitter = require('events')
let ModelRegistry, Instance, registry

class Model extends EventEmitter {
  constructor(options) {
    super()
    ModelRegistry = require('./ModelRegistry')
    registry = ModelRegistry.getRegistry()
    Instance = ModelRegistry.Instance
    this.config = options
  }

  get name() {
    return this.config.name
  }

  get pk() {
    return this.config.pk
  }

  get endpoint() {
    if(_.isUndefined(this._endpoint))
      this._endpoint = this.config.endpoint ? '/' + this.config.endpoint.replace(/^\/|\/$/,'') : null
    return this._endpoint
  }

  get attributes() {
    return this.config.attributes
  }

  get associations() {
    return this.config.associations
  }

  get config() {
    return this._config
  }

  set config(options) {
    this._config = options
  }

  mergeConfig(options) {
    _.merge(this.config, options)
  }

  build(data) {
    return new Instance(this, data)
  }

  async findAll() {
    if(!this.endpoint) throw new Error(`No endpoint defined for model "${this.name}"`)
    let results = await $request(this.endpoint, 'GET')
    return _.map(results.body, (data)=> this.build(data))
  }

  async findById(id) {
    if(!this.endpoint) throw new Error(`No endpoint defined for model "${this.name}"`)
    let results = await $request(this.endpoint + '/' + id, 'GET')
    this.build(results.body)
  }

  defaults(options){
    options = _.defaults(options, { strict: false, deep: true })
    var result = {}
    var attributes = this.config.attributes
    var associations = this.config.associations

    for(var attr in attributes) {
      if(attr == this.pk) continue
      var defVal = attributes[attr].defaultValue
      var type = attributes[attr].type
      if(defVal != undefined)
        result[attr] = defVal
      else if(!options.strict){
        switch(true) {
          case /STRING|CHAR|TEXT|UUID|DATE|BLOB/.test(type):
            result[attr] = ''
            break
          case /INTEGER|BIGINT|FLOAT|REAL|DOUBLE|DECIMAL/.test(type):
            result[attr] = 0
            break
          case /BOOLEAN/.test(type):
            result[attr] = false
            break
        }
      }
    }
    if(options.deep) {
      for (var alias in associations) {
        var assoc = associations[alias]
        var type = assoc.type

        if (!assoc.type.endsWith('Many') && !_.find(options._relationPath, assoc.model) ) {
          var model = registry[assoc.model]
          if (!model) {
            console.warn('Unknown model "' + assoc.model + '"')
            continue
          }
          options._relationPath = (options._relationPath || []).concat(assoc.model)
          result[alias] = model.defaults(options)
        }
      }
    }
    return result
  }
}

module.exports = Model