let _ = require('lodash')
let Messages = {
  get: function(error){
    return "Error " + error 
  }
}
//let Messages = require('valeryweb-i18n')
let validator = require('./validator-ext')

let DEFAULT_ERROR_MSG_KEY = 'errors.validation.default'

module.exports = function(models) {
  let Instance = models.getClass().Instance
  let InstanceSet = models.getClass().InstanceSet

  Instance.prototype.validate = function() {
    let associations = this.model().associations
    let attributes = this.model().attributes
    let pk = this.model().pk
    let model = this.model()

    let errors = {}

    for(attrName in attributes) {
      let attr = attributes[attrName]
      let attrVal = this[attrName]
      if (attrVal === undefined) continue

      for(validationName in attr.validate) {
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

    for(alias in associations) {
      let assoc = associations[alias]
      if (this[alias]) {
        if (this[alias] instanceof InstanceSet) {
          for(let item of this[alias].iterator()) {
            let assocErrors = item.validate()
            if (assocErrors)
              errors[item.name] = assocErrors
          }
        }
        else {
          let assocErrors = this[alias].validate()
          if (assocErrors)
            errors[alias] = assocErrors
        }
      }
    }

    return _.keys(errors).length > 0 ? errors : undefined
  }
}
