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
let models = require('../')(schema);
let ModelRegistry = models.getClass()
let { Instance, InstanceSet, Model } = models.getClass()

describe('Clase InstanceSet', function(){
  describe('Igualdad', function() {
    it('Debe considerar iguales dos objetos con el mismo pk', function() {
      expect(InstanceSet.contentEquals({id:1}, {id:1})).to.be.true
      expect(InstanceSet.contentEquals({id:1}, {id:2})).not.to.be.true
    })
    it('Debe considerar iguales dos objetos sin pk con mismo oid', function(){
      expect(InstanceSet.contentEquals({_oid:1}, {_oid:1})).to.be.true
      expect(InstanceSet.contentEquals({_oid:1}, {_oid:2})).not.to.be.true
    })
    it('Debe considerar iguales dos enteros aunque sean de signos diferentes', function(){
      expect(InstanceSet.contentEquals(1, -1)).to.be.true
    })
    it('Debe considerar iguales un entero y un objeto con pk de igual valor', function(){
      expect(InstanceSet.contentEquals(1, {id:1})).to.be.true
      expect(InstanceSet.contentEquals({id:1}, 2)).not.to.be.true
    })
    it('Debe comparar por pk y recurrir a comparar oids si algun objeto no define pk', function(){
      expect(InstanceSet.contentEquals({}, {})).not.to.be.true
      expect(InstanceSet.contentEquals({id: 1}, {_oid: 1})).not.to.be.true
      expect(InstanceSet.contentEquals({id: 1, _oid: 2}, {id: 2, _oid: 2})).not.to.be.true
      expect(InstanceSet.contentEquals({id: 1, _oid: 2}, {_oid: 2})).to.be.true
    })
  })
  describe('Añadir', function() {
    it('Debe solo aceptar objetos planos, Instances, y enteros mayores que cero', function() {
      let testSet = new InstanceSet(null, {
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      })
      testSet.add(undefined)
      testSet.add(null)
      testSet.add('string')
      testSet.add(0)

      expect( testSet ).to.have.lengthOf(0)

      testSet.add(1)
      testSet.add({id:2})
      testSet.add(new Instance('User', {name: 'user1'}))

      expect( testSet ).to.have.lengthOf(3)
    })
    it('Debe convertir objetos plano en instancias', function() {
      let testSet = new InstanceSet(null, {
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      })
      testSet.add({ id: 1 })
      expect( testSet.find(1) ).to.be.an.instanceOf(Instance)
    })
    it('Debe añadir elementos sin permitir duplicados', function(){
      let testSet = new InstanceSet(null, {
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      })
      testSet.addEach([
        1,      //Entero
        {id:1}, //Objeto plano
        new Instance('Property', {id:1, name: 'prop1'}) //Instancia
      ])

      expect(testSet).to.have.lengthOf(1)
      expect(testSet.get(0)).to.be.instanceOf(Instance)
      //el ultimo prevalece
        .and.to.have.property('name').that.is.equal('prop1')
    })
    it('Debe reconocer la junta en una relacion M:N', function(){
      let testSet = new InstanceSet(null, {
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      })
      testSet.addEach([
        { name: 'prop1', UserProperty: { value: 1 } },
        new Instance('Property',
          { name: 'prop2', UserProperty: { value: 2 } }
        )
      ])

      let prop1 = testSet.where({ name: 'prop1' })
      let prop2 = testSet.where({ name: 'prop2' })

      expect(prop1).to.be.ok
        .to.be.an.instanceOf(Instance)
        .and.to.have.deep.property('UserProperty.value').that.is.equal( 1 )
      expect(prop2).to.be.ok
        .to.be.an.instanceOf(Instance)
        .and.to.have.deep.property('UserProperty.value').that.is.equal( 2 )
    })
    it('Debe actualizar una instancia existente sin modificar su oid', function(){
      let testSet = new InstanceSet([{
        id: 1,
        name: 'prop1',
        UserProperty: {id: 1, value: 0}}
      ], {
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      })

      let old = testSet.find(1)
      testSet.add({
        id:1,
        name: 'updatedProp',
        UserProperty: {
          id: 1,
          value: 1
        }
      })
      expect(testSet).to.have.lengthOf(1)
      expect(testSet.find(1)._oid == old._oid).to.be.true
      expect(testSet.find(1)).to.have.property('name').which.equal('updatedProp')
      expect(testSet.find(1)).to.have.deep.property('UserProperty.value').which.equal(1)
    })
    it('Debe reemplazar el elemento existente', function(){
      let testSet = new InstanceSet([1, { id:2 }], {
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      })

      testSet.add({ id: 1 })
      testSet.add(2)

      expect( testSet ).to.have.lengthOf(2)
      expect( testSet.find(1) ).to.be.ok.and.to.be.an.instanceOf(Instance)
      expect( testSet.find(2) ).to.be.ok.and.to.be.a('number')
    })
  })
  describe('Busqueda', function() {
    let testSet
    beforeEach(function(){
      testSet = new InstanceSet(null, {
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      })
      testSet = testSet.addEach([
        1, //Entero
        new Instance('Property', { id:2, name: 'prop2' }) //Instancia
      ])
    })

    it('Debe encontrar una instancia por pk', function() {
      expect( testSet.find(1) ).to.be.ok.and.to.be.a('number').that.equal(1)
      expect( testSet.find({id:2}) ).to.be.ok.and.to.be.an.instanceOf(Instance)
        .that.have.property('name').that.equal('prop2')
    })
    it('Debe buscar una instancia que se corresponda con los valores de un objeto', function(){
      expect( testSet.where({name: 'prop2'}) )
        .to.be.ok.and.to.be.an.instanceOf(Instance)
        .that.have.property('name').that.equal('prop2')
    })
  })
  describe('Operaciones Booleanas', function() {
    it('Deben retornar siempre un InstanceSet', function(){
      let assocDescriptor = {
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      }
      testSet1 = new InstanceSet([1,2,3], assocDescriptor)
      testSet2 = new InstanceSet([3,4,5], assocDescriptor)

      expect(testSet1.symmetricDifference(testSet2)).to.be.instanceOf(InstanceSet)
      expect(testSet1.union(testSet2)).to.be.instanceOf(InstanceSet)
      expect(testSet1.difference(testSet2)).to.be.instanceOf(InstanceSet)
      expect(testSet1.intersection(testSet2)).to.be.instanceOf(InstanceSet)
      expect(testSet1.map((it)=> it)).to.be.instanceOf(InstanceSet)
      expect(testSet1.filter((it)=> true)).to.be.instanceOf(InstanceSet)
    })
  })
  describe('Contertir a arreglo', function() {
    it('Debe convertir a arreglo', function() {
      let testSet = new InstanceSet([1,2,3],{
        model: 'Property',
        type: 'BelongsToMany',
        through: 'UserProperty'
      })

      expect(testSet.toArray()).to.be.an('array')
    })
  })
})