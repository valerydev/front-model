let _  = require('lodash')
let ModelRegistry = require('./ModelRegistry')
let Model, Utils, InstanceSet, registry, $request, $guid

class Instance {

  constructor(model, values) {
    registry = ModelRegistry.getRegistry()
    Model = ModelRegistry.Model
    Utils = ModelRegistry.Utils
    InstanceSet = ModelRegistry.InstanceSet
    $request = Utils.$request
    $guid = Utils.$guid
    if(!_.isString(model) && !(model instanceof Model))
      throw new Error('The name of a model or a model instance should be specified')
    else if(_.isString(model)) {
      let modelName = model
      model = registry[model]
      if (!model) throw new Error(`Model ${modelName} not defined`)
    }

    this._model = model
    this._dataValues = {}
    this._associations = {}
    // If values is an empty object do not set default values
    // if values is null or undefined set default values
    if(values == null || values == undefined) {
      values = _.defaults(values, this.model().defaults({strict: true, deep: false}))
    }
    this._oid = values._oid || $guid()
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
        let checkTypes = function(val){
          return _.isInteger(val) && val != 0 ||
          val instanceof Instance ||
          _.isPlainObject(val) ||
          val instanceof InstanceSet ||
          _.isArray(val) && _.every(val, checkTypes)
        }

        if(!checkTypes(value)) throw new Error(
          'Valid value types for associations include integer, Instance, Object, ' +
          'InstanceSet, or Array with the same types'
        )

        let assocModel = registry[assoc.model]
        if(!assocModel) throw new Error(`Model "${assoc.model}" is not defined`)
        if(assoc.kind.endsWith('Many')) {
          if(!_.isArray(value)) throw new Error('The value for a x:M association should be an array')
          let instanceSet = new InstanceSet(value, assoc)
          let currAssoc = this._associations[key]
          if( currAssoc instanceof InstanceSet ) {
            // update current instances and add new ones
            instanceSet = currAssoc.intersection(instanceSet).addEach(instanceSet)
          }
          this._associations[key] = instanceSet
        }
        else {
          if(_.isPlainObject(value)){
            if(!_.isUndefined(value[assocModel.pk]) && _.get(this._associations[key], assocModel.pk) === value[assocModel.pk]) {
              this._associations[key].set(value)
            } else {
              this._associations[key] = new Instance(assocModel, value)
            }
          } else if(value instanceof Instance && this._associations[key] instanceof Instance) {
            this._associations[key].set(value)
          } else {
            this._associations[key] = value
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
      _.union(attrs, _.difference( _.keys(values), _.keys(this.model().associations).concat('_oid') )))
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
    let method, requestData
    let pk = this.model().pk
    if (this[pk]) {
      method = 'PUT'
      let modifiedData = this.modified
      if(_.isEmpty(modifiedData))
        return Promise.resolve()
      requestData = modifiedData
    }
    else {
      method = 'POST'
      requestData = this.get({deep:true})
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

    for (let prop in this.values) {
      this[prop] = original[prop]
    }
  }

  exists() {
    return  this.data //!!expr(this, this.$model().$config().identity).get()
  }

  isDirty() {
    return !_.isEmpty(this.modified())
  }

  modified(previousDataValues) {
    let diff = {}
    let attributes = this.model().attributes
    previousDataValues = previousDataValues || this._previousDataValues
    for (let prop in this.$attributes()) {
      if (_.isFunction(this[prop]))
        continue
      if (!_.isUndefined(this[prop]) && !_.isEqual(this[prop], previousDataValues[prop]))
        diff[prop] = this[prop]
    }

    let associations = this.model().associations
    for (let alias in associations) {
      let current = this[alias]
      if (_.isUndefined(current)) continue
      let assoc = associations[alias]
      let assocModel = registry[assoc.model]
      if(assocModel === undefined)
        throw new Error('Model "' + assoc.model + '" is not defined.')

      let assocPk = assocModel.pk
      let prev = previousDataValues[alias]

      let trackChanges = function(c, p) {
        if(!c || !p) return undefined
        if(_.isInteger(c)) {
          return _.isInteger(p) && c === p ? undefined : c
        } else {
          if(_.isInteger(p)) {
            return c.get({strict: true, deep: true})
          } else {
            let modified = c.modified(p)
            return !_.isEmpty(modified) ? modified : undefined
          }
        }
      }

      if (assoc.kind.endsWith('Many')){
        prev = new InstanceSet(prev, assoc)
        //The modified set is a union of newly added items
        let modified = current.difference(prev).union(
          //and deleted items (here we ensure conformance to RESTful delete association protocol)
          prev.difference(current).map((it)=> _.pick(it, assocPk)).union(
            current.intersection(prev).map((c)=> {
              let p = prev.find(c)
              return trackChanges(c, p)
            })
          )
        ).toArray().map((it)=> it instanceof Instance ? it.get({ strict: true, deep: true }) : it)

        if(modified.length > 0)
          diff[alias] = modified.toArray()
      }
      else {
        let modified = trackChanges(current, prev)
        if(_.isInteger(modified) || !_.isEmpty(modified))
          diff[alias] = modified
      }
    }

    // A through association is not defined on the inverse model of a belongsToMany association,
    // though it is added as association on each inverse instance of the relation at the time
    // they where set; thus here we look for a through association if it's found in the instance
    // but not on its model
    let throughAlias = _.difference(_.keys(this._associations), _.keys(associations))[0]
    if(!_.isEmpty(throughAlias)) {
      let throughInstance = this._associations[throughAlias]
      let modified = throughInstance.modified()
      if(!_.isEmpty(modified))
        diff[throughAlias] = modified
    }

    if(!_.isEmpty(diff)) {
      let pk = this.model().pk
      if(pk != undefined) diff[pk] = this[pk]
    }
    return diff
  }
}

module.exports = Instance