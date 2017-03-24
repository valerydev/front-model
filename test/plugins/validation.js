let _ = require('lodash')
let chai = require('chai')
let assert = chai.assert
let expect = chai.expect
let sinon = require('sinon')
let sinonChai = require('sinon-chai')
let chaiAsPromised = require('chai-as-promised')
let chaiThings = require('chai-things')
let chaiSubset = require('chai-subset')
chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)
chai.use(chaiThings)
chai.use(chaiSubset)

let schema = require('../harness/resources/schema.json')
let models = require('../../')(schema);
let ModelRegistry = models.getClass()
let { Instance, InstanceSet, Model } = ModelRegistry


describe.only('Validation Plugin', function() {
  it('Debe generar error de validacion si falta algun atributo requerido', function(){
    let user = models.User.build({})
    let validation = user.validate()
    console.log(validation)
  })
  it('Debe agregar error de validacion si falta una asociacion requerida', function() {
    let user = models.Property.build({})
  })
  it('Debe agregar dos o mas errores de validacion para un solo attributo/asociacion')
})
