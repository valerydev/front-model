var _ = require('lodash');
var Messages = {
  get: function(error){
    return "Error " + error; 
  }
};
//var Messages = require('valeryweb-i18n');
var validator = require('./validator-ext');

var DEFAULT_ERROR_MSG_KEY = 'errors.validation.default';

module.exports = function(models) {

  models.on('afterInit', function(){
    var ModelInstance = models.cvxModel.ModelInstance;

    ModelInstance.prototype.validate = function () {
      var self = this;
      var associations = self.$model().$config().associations;
      var attributes = self.$model().$config().attributes;
      var pk = self.$model().$config().pk;
      var model = self.$model();

      var errors = {};

      _.forIn(attributes, function (attr, attrName) {

        var attrVal = self[attrName];
        if (attrVal === undefined) return;

        _.forIn(attr.validate, function (validation, validationName) {
          var fn, args, msg, msgKey;

          if (_.isPlainObject(validation)) {
            if (validation.fn) {
              //Es funcion custom
              fn = validation.fn;
              //En funciones custom el unico argumento es el valor del atributo
              args = [attrVal];
            }
            else {
              //Es funcion de validator
              fn = validator[validationName];
              args = _.isArray(validation.arg) ? validation.arg : [validation.arg];
              //El primer argumento en funciones de validator debe ser el valor
              //en cadena del atributo
              args = ['' + attrVal].concat(args);
            }

            msg = validation.msg;
            msgKey = validation.msgKey;
          }

          else if (_.isArray(validation) || _.isBoolean(validation)) {
            //Es funcion de validator
            fn = validator[validationName];
            args = _.isArray(validation) ? validation : [validation];
            //El primer argumento en funciones de validator debe ser el valor
            //en cadena del atributo
            args = ['' + attrVal].concat(args);
          }

          else if (_.isFunction(validation)) {
            //Es funcion custom
            fn = validation;
            //En funciones custom el unico argumento es el valor del atributo
            args = [attrVal];
          }

          var valid = fn.apply(validator, args);

          if (!valid) {
            if (!_.isEmpty(msg))
              errors[attrName] = msg;
            else if (!_.isEmpty(msgKey))
              errors[attrName] = Messages.get(msgKey);
            else
              errors[attrName] = Messages.get(DEFAULT_ERROR_MSG_KEY);
          }
        })
      });

      _.forIn(associations, function (assoc, alias) {
        if (self[alias]) {
          if (_.isArray(self[alias])) {
            _.forEach(self[alias], function(item) {
              var assocErrors = item.validate();
              if (assocErrors)
                errors[item.name] = assocErrors;
            })  
          }
          else {
            var assocErrors = self[alias].validate();
            if (assocErrors)
              errors[alias] = assocErrors;
          }
        }
      });

      return _.keys(errors).length > 0 ? errors : undefined;
    };
  });
};
