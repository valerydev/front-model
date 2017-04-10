let _  = require('lodash')
let $request = require('./Utils').$request
let EventEmitter = require('events')
let ModelRegistry, Instance

class Model extends EventEmitter {
  constructor(options) {
    super()
    ModelRegistry = require('./ModelRegistry')
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

  async findAll(options={ plain: false }) {
    if(!this.endpoint) throw new Error(`No endpoint defined for model "${this.name}"`)
    let results = await $request(this.endpoint, 'GET')
    return !options.plain && results.body != undefined ? _.map(results.body, (data)=> this.build(data)) : results.body
  }

  async findById(id, options={ plain: false }) {
    if(!this.endpoint) throw new Error(`No endpoint defined for model "${this.name}"`)
    let results = await $request(this.endpoint + '/' + id, 'GET')
    return !options.plain && results.body != undefined ? this.build(results.body) : results.body
  }

  defaults(options){
    options = _.defaults(options, { strict: false, deep: true, plain: false })
    let result = {}
    let attributes = this.config.attributes
    let associations = this.config.associations

    for(let attr in attributes) {
      if(attr == this.pk) continue
      if(options.strict && attributes[attr].allowNull) continue
      let defVal = attributes[attr].defaultValue
      let isForeignKey = attributes[attr].foreignKey
      let type = attributes[attr].type
      if(defVal != undefined)
        result[attr] = defVal
      else if(isForeignKey) continue
      else {
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
      for (let alias in associations) {
        if(options.strict && associations[alias].allowNull) continue
        let assoc = associations[alias]
        let kind = assoc.kind

        if (!kind.endsWith('Many') && !_.includes(options._relationPath, assoc.model) ) {
          let model = this.$registry[assoc.model]
          if (!model) {
            console.warn('Unknown model "' + assoc.model + '"')
            continue
          }
          options._relationPath = (options._relationPath || []).concat(assoc.model)
          result[alias] = model.defaults(options)
        }
      }
    }
    return options.plain ? result : this.build(result, options)
  }
  get $registry() {
    return ModelRegistry.getRegistry()
  }
}

module.exports = Model