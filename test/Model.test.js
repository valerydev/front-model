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

let schema = require('./harness/resources/schema.json')
let models = require('../index')(schema);
let ModelRegistry = models.getClass()
let { Instance, InstanceSet, Model } = ModelRegistry

describe('Clase "Model"', function() {
  describe('Metodo "defaults"', function() {
    it('Debe seleccionar entre instancia u objeto plano como valor de retorno', function() {
      expect( models.User.defaults({ plain: false }) ).to.be.an.instanceOf(Instance)
      expect( _.isPlainObject(models.User.defaults({ plain: true }) )).to.be.true
    })
    it('No debe generar valor por defecto para el pk, aunque lo defina el modelo', function() {
      let defaults = models.User.defaults()
      expect(defaults).not.to.have.property('id')
    })
    it('Debe permitir obtener solo valores por defecto en atributos requeridos', function() {
      let defaults = models.User.defaults({ strict: true, deep: false })
      expect(defaults.get()).to.eql({
        username: 'unnamed',
        password: 'secret'
      })
    })
    it('Debe permitir obtener valores por defecto segun el tipo de dato, si no se definio uno en el modelo', function() {
      let defaults = models.User.defaults({ strict: false })
      expect(defaults).to.have.property('email').that.equal('')
      expect(defaults).to.have.property('createdAt').that.equal('')
      expect(defaults).to.have.property('code').that.equal(0)
    })
    it('Debe generar valores por defecto de asociaciones a uno', function() {
      let defaults = models.Property.defaults({ deep: true })
      expect(defaults).to.have.deep.property('category.name').that.equal('')
    })
    it('Debe permitir generar valores por defecto solo en asociaciones requeridas', function() {
      let defaults = models.Property.defaults({ strict: false, deep: true, plain: true })
      expect(defaults).to.have.property('category')

      defaults = models.Property.defaults({ strict: true, deep: true, plain: true })
      expect(defaults).not.to.have.property('category')

      defaults = models.User.defaults({ strict: true, deep: true, plain: true })
      expect(defaults).to.have.property('profile')
    })
    it('Debe retornar un objeto plano')
  })
})
