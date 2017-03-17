'use strict'
let EventEmitter = require('events')
let path = require('path')
let _  = require('lodash')
require('collections/set')

function $request(endpoint, method, payload, headers) {

  if(/PUT|POST/.test(method) && (!_.isPlainObject(payload) || _.isEmpty(payload))) return Promise.resolve()
  if(payload) headers = _.extend({}, headers, {'Content-Type': 'application/json;charset=UTF-8'})

  var config = { method, endpoint, payload, headers }

  return new Promise(function(resolve, reject) {
    let xhr = new XMLHttpRequest()
    xhr.open('POST', config.endpoint, true)
    xhr.setRequestHeader('X-HTTP-Method-Override', config.method)
    _.each(config.headers, function(value, key){ xhr.setRequestHeader(key, value) })
    xhr.onreadystatechange = function() {
      if(this.readyState == 4) {
        if(this.status == 200) {
          resolve({
            body: this.responseText.length > 0 ? JSON.parse(this.responseText) : null,
            headers: this.getAllResponseHeaders()
          })
        } else {
          reject(new Error('Non 200 response (' + this.status + ' ' + this.statusText + ')'))
        }
      }
    }
    try {
      xhr.send()
    } catch(err) {
      reject(err)
    }
  })
}

// UUID generator
function $guid() {
  let s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

class Model extends EventEmitter {
  constructor(options) {
    super()
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
    var result = {}
    var attributes = this.config.attributes
    var associations = this.config.associations

    for(var attr in attributes) {
      var defVal = attributes[attr].defaultValue
      var type = attributes[attr].type
      if(defVal)
        result[attr] = defVal
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
    for(var alias in associations) {
      var assoc = associations[alias]
      var type = assoc.type

      if(!/^(HasOne|HasMany|BelongsTo|BelongsToMany)$/.test(type))
        throw new Error('Unknown association type "' + type +
          '" in model "' + this.config.name + '" attribute "' + alias +'"')

      if(!assoc.type.endsWith('Many')) {
        var model = registry[assoc.model]
        if (!model) {
          console.warn('Unknown model "' + assoc.model + '"')
          continue
        }

        result[alias] = model.default()
      }
      else if(assoc.type == 'BelongsToMany') {
        result[assoc.through] = registry[assoc.through]
      }
    }
    return this.build(result)
  }
}

class Instance {

  constructor(model, values) {
    if(!_.isString(model) && !(model instanceof Model))
      throw new Error('The name of a model or a model instance should be specified')
    else if(_.isString(model)) {
      let modelName = model
      model = ModelRegistry.getRegistry()[model]
      if (!model) throw new Error(`Model ${modelName} not defined`)
    }
    this._model = model
    this._dataValues = {}
    this._associations = {}
    this._oid = $guid()
    this.set(values, {deep: true})
    this._previousDataValues = this.get({deep: true, oids: true})
  }

  isNewRecord() {
    return _.isUndefined(this[this.model().pk])
  }

  model() {
    return this._model
  }

  get(key, options) {
    options = _.isPlainObject(key) ? key : options || {}
    options = _.defaults(options, { strict: false, deep: false, oids: false })
    key = _.isString(key) ? key : undefined
    if(key != undefined) {
      if(this._dataValues[key] != undefined)
        return this._dataValues[key]
      else
        return this._associations[key]
    } else {
      return this.$raw(options)
    }
  }

  set(key, val, options) {
    if(!_.isString(key)) {
      if(_.isInteger(key) || _.isPlainObject(key) || key instanceof Instance) {
        options = val
        val = key
        key = undefined
      }
      else throw new Error(
          'First argument must be the name of an attribute,' +
          ' a value object or an integer'
      )
    } else {
      val = {[key]: val}
    }
    options = _.defaults(options, { strict: false, deep: false })

    _.each(val, (value, key)=> {
      if(options.strict && _.isUndefined(this.model().attributes[key] || this.model().associations[key])) return

      let assoc = _.get(this.model(), `associations[${key}]`)
      if(assoc) {
        let assocModel = ModelRegistry.getRegistry()[assoc.model]
        if(!assocModel) throw new Error(`Model "${assoc.model}" is not defined`)
        if(assoc.type.endsWith('Many')) {
          if(!_.isArray(value)) throw new Error('The value for a x:M association should be an array')
          let valueSet = new Set.CollectionsSet(value, (a,b)=> {
            _.isInteger(a)?a:a[assocModel.pk] === _.isInteger(b)?b:b[assocModel.pk]
          },(obj)=> {
            return _.isInteger(obj) ? obj : obj[assocModel.pk] || obj._oid
          })

          let processThrough = (assoc, instance, values)=> {
            if(assoc.through) {
              let throughValues = values[assoc.through]
              if(!throughValues) { //M:N asociations should always have through, we warn if it doesn't
                console.warn('Many To Many associations should have a through currAssoc')
                return
              }
              let throughModel = ModelRegistry.getRegistry()[assoc.through]
              if(!throughModel) throw new Error(`Model "${assoc.through}" is not defined`)

              if(instance[assoc.through] instanceof Instance) { //If a through instance have been set before
                instance[assoc.through].set(throughValues) //we call set on it with the values
              }
              else { //we create a through instance and add it as association
                let throughInstance = new Instance(throughModel, throughValues)
                // Set will define a property and set the currAssoc as an attribute because
                // it doesn't recognize it as association
                instance.set(assoc.through, throughInstance)
                // We manually set the through instance as association an not as an attribute
                instance._associations[assoc.through] = instance._dataValues[assoc.through]
                delete instance._dataValues[assoc.through]
              }
            }
          }

          _.difference( valueSet,
            _.compact(_.map( valueSet, (values)=> {
              // Search if there is already an instance associated with the same id
              let currAssoc = _.find(this._associations[key], (curr)=> {
                let valId  = Math.abs(_.isInteger(values) ? values : values[assocModel.pk])
                let currId = Math.abs(_.isInteger(curr) ? curr : curr[assocModel.pk])
                return valId === currId
              })
              return _.isUndefined(currAssoc) ? undefined : { currAssoc, values }
            })).map((it)=> {
              let { currAssoc, values } = it
              if(_.isInteger(values) || values instanceof Instance) {
                this._associations[key][this._associations[key].indexOf(currAssoc)] = values
              } else {
                currAssoc.set(_.omit(values, assoc.through))
              }
              processThrough(assoc, currAssoc, values)
              return values
            })
          ).forEach((values)=> {
            if(_.isInteger(values) || values instanceof Instance) {
              this._associations[key] = this._associations[key] || []
              this._associations[key].push(values)
            } else {
              let instance = new Instance(assocModel, _.omit(values, assoc.through))
              processThrough(assoc, instance, values)
              this._associations[key] = this._associations[key] || []
              this._associations[key].push(instance)
            }
          })
        }
        else {
          if(_.isInteger(value) || value instanceof Instance) {
            this._associations[key] = value
          }
          else {
            if(!_.isUndefined(value[assocModel.pk]) && _.get(this._associations[key], assocModel.pk) === value[assocModel.pk]) {
              this._associations[key].set(value)
            } else {
              this._associations[key] = new Instance(assocModel, value)
            }
          }
        }
      } else {
        this._dataValues[key] = value
      }

      // Definir una propiedad de acceso para cada atributo
      if(!this.hasOwnProperty(key)) {
        // T0do acceso a los valores de la instancia se realiza mediante los metodos get() y set()
        Object.defineProperty(this, key, {
          get: ()=> this.get(key),
          set: (val)=> this.set(key, val),
          enumerable: true,
          configurable: true
        })
      }
    })
  }

  $associations(values) {
    if(!values) return this._associations
    else return _.pick(values, _.keys(this.model().associations))
  }

  $attributes(values, strict) {
    if(_.isBoolean(values)) {
      strict = values
      values = undefined
    }
    values = values || this._dataValues
    let attrs = _.keys(this.model().attributes)
    return _.pick(values, strict ? attrs :
      _.union(attrs, _.difference( _.keys(values), _.keys(this.model().associations) )))
  }

  /**
   *
   * @param options Las opciones
   *    - strict: ¿Solo tomar en cuenta atributos definidos en el modelo? (false por defecto)
   *    - deep: ¿Procesar tambien las asociaciones recursivamente? (true por defecto)
   * @returns Object Un objeto plano con los valores de la instancia
   */
  $raw(options) {
    options = _.defaults(options, { strict: false, deep: false, oids: false })
    return _.cloneDeep(
      _.merge({},
        options.oids ? {_oid: this._oid} : {},
        // Tomar en cuenta solo atributos definidos en el modelo si strict = true
        this.$attributes(options.strict),
        // Procesar tambien recursivamente las asociaciones si deep = true
        options.deep ?
          _.mapValues( this.$associations(), (it)=> {
            if(it instanceof Instance) {
              return it.$raw(options)
            } else if(it instanceof Set.CollectionsSet) {
              return _.map(it.toArray(), (it)=> it instanceof Instance ? it.$raw(options) : it)
            } else {
              return it
            }
          }) : {}
      )
    )
  }

  save() {
    var method, requestData
    var pk = this.model().pk
    if (this[pk]) {
      method = 'PUT'
      var modifiedData = this.modified
      if(_.isEmpty(modifiedData))
        return Promise.resolve()
      requestData = modifiedData
    } else {
      method = 'POST'
      requestData = this.raw
    }
    if (_.isEqual({}, requestData)) {
      return Promise.resolve(this)
    }
    return $request(this.model, method, requestData).then(function(response){
      response
    })
  }

  delete() {
    return $request(this.model, 'DELETE')
  }

  reload() {
    return $request(this.model, 'GET')
  }

  revert() {
    this._dataValues = _.merge(this._dataValues, _.cloneDeep(
      _.pick(this._previousDataValues, _.union(
        _.keys(this.model.config.attributes),
        _.keys(this.model.config.associations)
      ))
    ))

    for (var prop in this.values) {
      this[prop] = original[prop]
    }
  }

  exists() {
    return  this.data //!!expr(this, this.$model().$config().identity).get()
  }

  isDirty() {
    return !_.isEmpty(this.modified())
  }

  modified() {
    var diff = {}
    let attributes = this.model().attributes

    for (var prop in attributes) {
      if (_.isFunction(this[prop]))
        continue
      if (!_.isUndefined(this[prop]) && !_.isEqual(this[prop], this._previousDataValues[prop]))
        diff[prop] = this[prop]
    }

    let associations = this.model().associations
    for (var alias in associations) {
      var current = this[alias]
      if (_.isUndefined(current)) continue

      var assocModel = ModelRegistry.getRegistry()[associations[alias].model]
      if(assocModel === undefined)
        throw new Error('Model "' + associations[alias].model + '" is not defined.')

      var assocPk = assocModel.pk

      if (associations[alias].type.endsWith('Many')){
        //Nota: En los valores previos solo deben existir objetos plano con ID
        var prev    = this._previousDataValues[alias]
        let modified = _.union(
          // Asociaciones por Eliminar
          _.differenceWith(prev, current, (p,c)=> (p[assocPk] == undefined && p._oid == c._oid) || (p[assocPk] == (_.isInteger(c)?c:c[assocPk])) ).map((it)=> _.pick(it, assocPk)),
          // Asociaciones nuevas
          _.differenceWith(current, prev, (c,p)=> (p[assocPk] == undefined && p._oid == c._oid) || (p[assocPk] == (_.isInteger(c)?c:c[assocPk])) ).map((it)=> _.isInteger(it)?it:it.get({deep:true})),
          _.filter(prev, (it)=> it[assocPk] == undefined ),
          _.filter(current, (it)=> _.isInteger(it) ? false : it[assocPk] == undefined ),
          // Asociaciones con modificaciones
          _.compact(
            _.intersectionWith(current, prev , (c,p)=> (p[assocPk] != undefined) && (p[assocPk] == (_.isInteger(c)?c:c[assocPk])) ).map((it)=> {
              if(_.isInteger(it)) return it
              let modified = it.modified()
              return !_.isEmpty(modified) ? modified : undefined
            })
          )
        )
        if(!_.isEmpty(modified))
          diff[alias] = modified
      }
      else {
        var modified = _.isInteger(current) ? current : current.modified()
        if(_.isInteger(modified) || !_.isEmpty(modified))
          diff[alias] = modified
      }
    }

    // A through association is not defined on the inverse model of a belongsToMany association,
    // though it is added as association on each inverse instance of the relation at the time
    // they where set; thus here we look for a through association if it's in the instance but not on its model
    let throughAlias = _.difference(_.keys(this._associations), _.keys(associations))[0]
    if(!_.isEmpty(throughAlias)) {
      let throughInstance = this._associations[throughAlias]
      var modified = throughInstance.modified()
      if(!_.isEmpty(modified))
        diff[throughAlias] = modified
    }

    if(!_.isEmpty(diff)) {
      let pk = this.model().pk
      diff[pk] = this[pk]
    }
    return diff
  }
}

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
    if(this[name] instanceof Model) console.warn(`Modelo "${name}" redefinido`)
    Object.defineProperty(this, name, {
      configurable: true,
      enumerable: true,
      value: (()=> {
        let model = new Model(options)
        model.on('beforeRequest', (instance, url)=> {
          this.emit('beforeRequest', instance, url)
        })
        return model
      })()
    })
  }
  undefine(name) {
    if(this[name] instanceof Model) {
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
    _.forEach(this, (val, key)=> this.undefine(key))
    _.forEach(schema, (modelDef, modelName)=> this.define(modelName, modelDef))
  }
  static $request(...args) {
    return $request(...args)
  }
  static get Model() {
    return Model
  }
  static get Instance() {
    return Instance
  }
  static getRegistry() {
    return ModelRegistry.$registry;
  }
}

module.exports = (schema)=> {
  ModelRegistry.$registry = new ModelRegistry(schema)
  return ModelRegistry.$registry
}