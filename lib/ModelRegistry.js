let _  = require('lodash')
let EventEmitter = require('events')

class ModelRegistry extends EventEmitter {
  constructor(schema) {
    super()
    this.setSchema(schema)
  }
  define(name, options) {
    options = options || name
    name =  typeof name === 'string' ? name :  options.name
    if(!name) throw new Error('A name must be provided for the model.')
    options.name = name
    if(this[name] instanceof ModelRegistry.Model) console.warn(`Model "${name}" redefined`)
    Object.defineProperty(this, name, {
      configurable: true,
      enumerable: true,
      value: (()=> {
        let model = new ModelRegistry.Model(options)
        model.on('beforeRequest', (instance, url)=> {
          this.emit('beforeRequest', instance, url)
        })
        return model
      })()
    })
  }
  undefine(name) {
    if(this[name] instanceof ModelRegistry.Model) {
      this[name].removeAllListeners('beforeRequest')
      delete this[name]
    }
    //throw Error(`No existe el modelo ${name}`)
  }
  getClass() {
    return ModelRegistry
  }
  getSchema() {
    return _.mapValues(_.pickBy(this, (val)=> val instanceof Model), 'config')
  }
  setSchema(schema) {
    _.forIn(this, (val, key)=> this.undefine(key))
    _.forIn(schema, (modelDef, modelName)=> this.define(modelName, modelDef))
  }
  static $request(...args) {
    return $request(...args)
  }
  static get Model() {
    return require('./Model')
  }
  static get Instance() {
    return require('./Instance')
  }
  static get InstanceSet() {
    return require('./InstanceSet')
  }
  static get Utils() {
    return require('./Utils')
  }
  static getRegistry() {
    return ModelRegistry.$registry;
  }
}

module.exports = ModelRegistry
