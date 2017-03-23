let _ = require('lodash')
var chai = require('chai')
var assert = chai.assert
var expect = chai.expect
var sinon = require('sinon')
var sinonChai = require('sinon-chai')
var chaiAsPromised = require('chai-as-promised')
var chaiThings = require('chai-things')
var chaiSubset = require('chai-subset')
chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)
chai.use(chaiThings)
chai.use(chaiSubset)

let schema = require('./harness/resources/schema.json')
let models = require('../')(schema);
let ModelRegistry = models.getClass()
let { Instance, InstanceSet, Model } = models.getClass()

describe('ModelRegistry', function() {
  it('Establecer/Restablecer esquemas')
  it('Registrar/Deregistrar nuevas definiciones de modelo')
  it('Escuchar y reemitir eventos de modelos')
  it('Propiedad "schema" retorna las definiciones de los modelos')
})