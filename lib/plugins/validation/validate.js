let _ = require('lodash')
let traverse = require('traverse')
let Messages = {
  get: function(error){
    return "Unspecified Error "
  }
}
//let Messages = require('valeryweb-i18n')
let validator = require('./validator-ext')

let DEFAULT_ERROR_MSG_KEY = 'errors.validation.default'

module.exports = function(models) {
  let { Instance, InstanceSet, Utils} = models.getClass()

  Instance.prototype.validate = function(path, options={ plain: false }) {
    if(_.isObject(path)) {
      options = path
      path = undefined
    }
    // TODO: Validate specific deep property
    // if(!_.isEmpty(path)){
    //   let instance = Utils.$getPropertyDeep(this, path)
    //   return instance instanceof Instance ? instance.validate() : instance
    // }

    let associations = this.model().associations
    let attributes = this.model().attributes
    let pk = this.model().pk
    let model = this.model()

    let errors = {}

    for(let attrName in attributes) {
      let attr = attributes[attrName]
      if(attr.primaryKey) continue

      let attrVal = ''
      if(this[attrName] == undefined || this[attrName] == null) {
        if(attr.allowNull) continue  //No correr validaciones si el valor es nulo y allowNull=true
      } else {
        attrVal = this[attrName]
      }

      for(let validationName in attr.validate) {
        let validation = attr.validate[validationName]
        let fn, args, msg, msgKey, errorKind

        if (_.isPlainObject(validation)) {
          if (validation.fn) {
            //Es funcion custom
            fn = validation.fn
            //En funciones custom el unico argumento es el valor del atributo
            args = [attrVal]
          }
          else {
            //Es funcion de validator
            fn = validator[validationName]
            args = _.isArray(validation.arg) ? validation.arg : [validation.arg]
            //El primer argumento en funciones de validator debe ser el valor
            //en cadena del atributo. Si el primero argumento es un valor booleano
            //debe ignorarse
            args = _.isBoolean(args[0]) ? ['' + attrVal] : ['' + attrVal].concat(args)
          }

          msg = validation.msg
          errorKind = validation.kind || 'error'
          msgKey = validation.msgKey
        }

        else if (_.isArray(validation) || _.isBoolean(validation)) {
          //Es funcion de validator
          fn = validator[validationName]
          args = _.isArray(validation) ? validation : [validation]
          //El primer argumento en funciones de validator debe ser el valor
          //en cadena del atributo. Si el primero argumento es un valor booleano
          //debe ignorarse
          args = _.isBoolean(args[0]) ? ['' + attrVal] : ['' + attrVal].concat(args)
        }

        else if (_.isFunction(validation)) {
          //Es funcion custom
          fn = validation
          //En funciones custom el unico argumento es el valor del atributo
          args = [attrVal]
        }

        let valid = fn.apply(validator, args)

        if (!valid) {
          msg = msg || Messages.get(msgKey) || Messages.get(DEFAULT_ERROR_MSG_KEY)
          errors[attrName] = (errors[attrName]||[]).concat({msg: msg, kind: errorKind})
        }
      }
    }

    let assocAliases = _.union(_.keys(associations), _.keys(this.$associations()))
    for( let alias of assocAliases ) {
      let assoc = associations[alias]
      if (this[alias]) {
        let isToMany = assoc && assoc.kind.endsWith('Many')
        let items = isToMany ? this[alias].toArray() : [this[alias]]
        for(let item of items) {
          let assocErrors = item.validate()
          if(!_.isEmpty(assocErrors)) {
            errors[alias] = assocErrors && isToMany ?
                (errors[alias] || []).concat(assocErrors) : assocErrors
          }
        }
      } else {
        // TODO: I think it's not necessary
        if(!assoc.allowNull) {
          errors[alias] = [{ msg: 'Required association', kind: 'error' }]
        }
      }
    }

    if(options.plain) {
      errors = traverse(errors).reduce(function(memo, x) {
        if (this.isLeaf){
          memo[this.path.join('.')
              .replace(/\.\d+\.(msg|kind)$/,'')
              .replace(/(?:\.?)(\d+)(\.?)/g, (match, $1, $2)=> '[' + $1 + ']' + $2 || '')] = this.parent.parent.node
        }
        return memo
      }, {})
    }

    return errors
  }
}
