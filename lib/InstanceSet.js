let _  = require('lodash')
require('collections/set')
let ModelRegistry = require('./ModelRegistry')
let Instance

class InstanceSet extends Set.CollectionsSet {

  constructor(values, assoc) {
    super( null, InstanceSet.contentEquals, InstanceSet.contentHash )
    if(!_.isPlainObject(assoc)
        || _.isUndefined(this.$registry[assoc.model])
        || !/^(BelongsTo|BelongsToMany|HasMany|HasOne)$/i.test(assoc.kind)
        || assoc.kind === 'BelongsToMany' && _.isEmpty(assoc.through))
      throw new Error('InstanceSet requires a valid association descriptor')
    Instance = ModelRegistry.Instance
    this._assocDesc = assoc
    this.addEach(values)
  }

  static contentEquals(a,b) {
    let idA  = Math.abs(_.isInteger(a)?a:_.get(a,'id')) || undefined
    let idB  = Math.abs(_.isInteger(b)?b:_.get(b,'id')) || undefined
    let oidA = _.get(a, '_oid')
    let oidB = _.get(b, '_oid')
    if(idA != undefined && idB != undefined ) return idA == idB
    else if(oidA != undefined && oidB != undefined) return oidA == oidB
  }

  static contentHash(obj) {
    return '-'
  }

  get(index) {
    return this.toArray()[index]
  }

  find(values) {
    return (this.order.find(values)||{}).value
  }

  where(values) {
    return _.filter(this.toArray(), _.matches(values))
  }

  first(values) {
    return _.find(this.toArray(), values)
  }

  add(values) {
    if(! (_.isInteger(values) && values > 0 || values instanceof Instance || _.isPlainObject(values)))
      return false
    let a = _.get(this.order.find(values, this.contentEquals), 'value')
    let b = values
    let assoc = this._assocDesc

    let processThrough = (assoc, instance, values)=> {
      if(assoc.through) {
        let throughValues = values[assoc.through]
        if(!throughValues) { //M:N asociations should always have through, we warn if it doesn't
          console.warn('Many To Many associations should have a through')
          return instance
        }
        let throughModel = this.$registry[assoc.through]
        if(!throughModel) throw new Error(`Model "${assoc.through}" is not defined`)

        let Instance = require('./Instance')
        if(instance[assoc.through] instanceof Instance) { //If a through instance have been set before
          instance[assoc.through].$set(throughValues) //we call set on it with the values
        }
        else { //we create a through instance and add it as association
          let throughInstance = new Instance(throughModel, throughValues)
          // Set will define a property and set the currAssoc as an attribute because
          // it doesn't recognize it as association
          instance.$set(assoc.through, throughInstance)
          // We manually set the through instance as association an not as an attribute
          instance._associations[assoc.through] = instance._dataValues[assoc.through]
          delete instance._dataValues[assoc.through]
        }
      }
      return instance
    }

    if(!_.isUndefined(a) && !_.isUndefined(b)) {
      if(a instanceof Instance && (b instanceof Instance || _.isPlainObject(b))) {
        let values = _.omit( b instanceof Instance ? b.$get() : b, assoc.pk, '_oid', assoc.through)
        a.$set(values)
        processThrough(assoc, a, b)
        return true
      } else {
        this.delete(a)
      }
    }

    if(_.isPlainObject(b)) {
      let newInstance = new Instance(assoc.model, _.omit(b, assoc.through))
      b = processThrough(assoc, newInstance, b)
    }
    return super.add(b)
  }

  toArray() {
    return super.map(Function.identity)
  }

  [Symbol.iterator]() {
    return super.toArray()
  }

  map(callback, thisp) {
    let res = super.map(callback, thisp)
    if(Array.isArray(res))
      return new InstanceSet(res, this._assocDesc)
    return res
  }

  filter(callback, thisp) {
    let res = super.filter(callback, thisp)
    if(Array.isArray(res))
      return new InstanceSet(res, this._assocDesc)
    return res
  }

  constructClone(values) {
    return new this.constructor(values, this._assocDesc);
  };

  get $registry() {
    return ModelRegistry.getRegistry()
  }
}
module.exports = InstanceSet