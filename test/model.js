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
let models = require('../lib/model')(schema);
let ModelRegistry = models.getClass()
let { Instance, Model } = models.getClass()
let $request = ModelRegistry.$request
let xhr, requests

before(()=> {
  xhr = global.XMLHttpRequest = sinon.useFakeXMLHttpRequest()
  xhr.onCreate = function (req) { requests.push(req) }
})

beforeEach(function () { requests = [] })

//afterEach(()=> xhr.restore(true))

// it('request', function() {
//   $request('/users', 'GET').should.eventually.become({body:{"name":"raul"}})
//   requests[0].respond(200, {"x-fuckyou":"dieBitch"}, JSON.stringify({"name":"raul"}))
// })

describe('Protocolo REST de operaciones CRUD', function() {
  describe('GET', function() {
    it('Debe leer todos', async function() {
      let users = [{
        "id": 1,
        "password": "123",
        "username": "user1",
        "email": "user1@cvxven.com"
      },{
        "id": 2,
        "password": "456",
        "username": "user2",
        "email": "user2@cvxven.com"
      }]

      let results = models.User.findAll()
      requests[0].respond(200, {}, JSON.stringify(users))
      results = await results
      expect(results).to.be.ok
      expect(results).to.all.be.instanceOf(models.Instance)
    })
    it('Debe leer un registro especifico')
  })
  describe('POST', function() {
    it('Debe crear un registro')
    it('Debe crear varios registros')
  })
  describe('PUT', function() {
    it('Debe actualizar un registro especifico')
    it('Debe actualizar varios registros')
  })
  describe('DELETE', function() {
    it('Debe eliminar un registro')
    it('Debe eliminar varios registros')
  })
})

describe('Clase "Instance"', function() {
  describe('Metodo "set"', function() {
    it('Debe establecer el valor de un atributo especifico de la instancia', function() {
      let user = new Instance('User', { username: '' })
      user.set('username', 'user1')
      expect(user.username).to.be.equal('user1')
    })
    it('Debe establecer una asociacion especifica de la instancia', function() {
      // M:1 or 1:1
      let prop = new Instance('Property', {})
      prop.set('category', { name: 'cat1' }) // It can be a plain object
      expect(prop.category).to.be.an.instanceOf(Instance).and.to.have.a.property('name').that.equal('cat1')

      prop.set('category', new Instance('PropertyCategory', { name: 'cat2'})) // an Instance
      expect(prop.category).to.be.an.instanceOf(Instance).and.to.have.a.property('name').that.equal('cat2')

      prop.set('category', 1) // Or an integer
      expect(prop.category).to.be.a('number')

      //M:N
      let user = new Instance('User', {properties:[
        { id: 1, name: 'prop1', UserProperty: { value: 1 } }, //It can be a plain object
        new Instance('Property',  {id: 2, name: 'prop2', UserProperty: { value: 2 } } ), // An instance
      ]})
      // let properties = [
      //   { name: 'prop1', UserProperty: { value: 1 } }, //It can be a plain object
      //   new Instance('Property',  { name: 'prop2', UserProperty: { value: 2 } } ), // An instance
      //   1                                              //or an integer
      // ]
      user.properties[0].UserProperty.value = 10
      user.modified()
      user.properties = [1,2,3]
      user.modified()

      let prop1 = _.find( user.properties, { name: 'prop1' } )
      let prop2 = _.find( user.properties, { name: 'prop2' } )

      expect(prop1).to.be.an.instanceOf(Instance)
      expect(prop2).to.be.an.instanceOf(Instance)
      expect(prop1).to.be.ok.and.to.have.deep.property('UserProperty.value').that.is.equal(1)
      expect(prop2).to.be.ok.and.to.have.deep.property('UserProperty.value').that.is.equal(2)
    })
    it('Debe establecer los valores por defecto de la instancia', function() {
      let user = new Instance('User', {})
      expect(user.username).to.be.equal('unnamed')
      expect(user.password).to.be.equal('secret' )
    })
    it('Debe reestablecer los valores de una instancia', function() {
      let user = new Instance('User', {
        password: '123',
        username: 'user1',
        properties: [{
          id: 1,
          name: 'prop1',
          defaultValue: 0,
          UserProperty: {
            value: 0
          }
        }]
      })

      let prop1 = _.find(user.properties, {id: 1})

      user.set({
        password: 'xxx',
        properties: [ 2, 3,
          {
            id: 1,
            name: 'updatedName',
            UserProperty: { value: 1 }
          },
          { name: 'newName' }
        ]
      }, { deep: true })

      expect(user.password).to.be.equal('xxx')
      expect(user.properties).to.be.an('array').and.to.have.lengthOf(4)
      expect( prop1 === _.find(user.properties, { id: 1 }) ).to.be.ok
      expect( prop1 ).to.be.ok.and.to.have.property('name').that.equal( 'updatedName' )
      expect( prop1 ).to.have.deep.property('UserProperty.value').that.equal(1)
      expect( prop1 ).to.have.property('defaultValue').that.equal( 0 )
      expect( _.find(user.properties, {name: 'newName'}) ).to.be.ok

      let prop2 = new Instance('Property', {
        id: 1,
        name: 'new',
        UserProperty: { value: 1 }
      })

      user.properties = [prop2]

      console.log(JSON.stringify(user.get({deep: true}),null,2))

    })
    it('Debe definir una propiedad para cada atributo y asociacion', function() {
      let user = new Instance('User', {
        password: '123',
        username: 'user1',
        xxx: 'xxx',  //Atributo añadido no definido en el modelo
        properties: [{
          name: 'prop1'
        }]
      })
      let expectedDescriptor = { enumerable: true, configurable: true }
      expect(user).to.have.ownPropertyDescriptor('username'  ).to.containSubset(expectedDescriptor).and.include.keys('get', 'set')
      expect(user).to.have.ownPropertyDescriptor('xxx'       ).to.containSubset(expectedDescriptor).and.include.keys('get', 'set')
      expect(user).to.have.ownPropertyDescriptor('properties').to.containSubset(expectedDescriptor).and.include.keys('get', 'set')
      expect(user.properties).all.to.be.instanceOf(Instance)
        .with.property('0')
          .that.have.ownPropertyDescriptor('name')
          .that.containSubset(expectedDescriptor).and.include.keys('get', 'set')
    })
    it('Debe interceptar asignaciones a propiedades de la instancia', function() {
      let user = new Instance('User', { username: '', xxx: '' })
      sinon.spy(user, 'set')
      user.username = 'user1'
      user.xxx = '123'

      expect(user.set).to.have.been.calledTwice
    })
    it('Debe aceptar entero como asociacion (para soportar operacion CRUD "asociar")', function() {
      //1:1 or M:1
      let property = new Instance('Property', {})
      property.set('category', 1)
      expect(property.category).to.be.a('number').that.equal(1)
      //1:M or M:N
      let user = new Instance('User', {})
      user.set('properties', [1, 2, 3])
      expect( user.properties ).to.be.an('array').that.deep.equal([1, 2, 3])
    })
    it('Debe reconocer la instancia de junta en una relacion M:N y definirlo como asociacion en la instancia asociada', function(){
      let user = new Instance('User', {})
      let properties = [
        { name: 'prop1', UserProperty: { value: 1 } }, //as a plain object
        new Instance('Property',                       //as an instance
            { name: 'prop2', UserProperty: { value: 2 } }
        )
      ]
      user.set('properties', properties)

      let prop1 = _.find( user.properties, { name: 'prop1' } )
      let prop2 = _.find( user.properties, { name: 'prop2' } )

      expect(prop1).to.be.ok
          .to.be.an.instanceOf(Instance)
          .and.to.have.deep.property('UserProperty.value').that.is.equal( 1 )
      expect(prop2).to.be.ok
          .to.be.an.instanceOf(Instance)
          .and.to.have.deep.property('UserProperty.value').that.is.equal( 2 )
    })
  })
  describe('Metodo "get"', function() {
    it('Debe interceptar acceso a propiedades de la instancia', function() {
      let user = new Instance('User', { username: 'user1', xxx: 'xxx' })
      sinon.spy(user, 'get')
      user.username
      user.xxx

      expect(user.get).to.have.been.calledTwice
    })
    it('Debe leer un atributo especifico de la instancia', function() {
      let rawUser = { username: 'user1' }
      let user = new Instance('User', rawUser)
      expect(user.get('username')).to.be.equal(rawUser.username)
    })
    it('Debe generar un objeto plano de la instancia', function() {
        let rawUser = {
          password: '123',
          username: 'user1',
          xxx: 'xxx',
          properties: [{
            UserProperty: { //Modelo de junta de la asociacion M:N entre usuario y propiedad
              userId: 1,
              propertyId: 2,
              value: 'val2'
            },
            category: {
              name: 'cat1'
            }
          }]
        }
        let user = new Instance('User', rawUser)

        //Por defecto toma en cuenta solo los atributos, ignora las asociaciones
        expect( user.get() ).to.containSubset( _.omit(rawUser, 'properties') )
        //Si strict = true solo toma en cuenta los atributos definidos en el modelo, ignora los añadidos
        expect( user.get({strict: true}) ).to.containSubset( _.omit(rawUser, 'xxx', 'properties') )
        //Si deep = true procesa recursivamente las asociaciones
        expect( user.get({deep: true}) ).to.containSubset(rawUser)
    })
    it('Debe aceptar entero como asociacion (para soportar operacion CRUD "asociar")', function() {
      let rawUser = { properties: [1, 2, 3] }
      let user = new Instance('User', rawUser)
      expect( user.get({deep: true}) ).to.containSubset(rawUser)
    })
  })
  describe.only('Metodo "modified"', function(){
    it('Debe detectar modificaciones en atributos')
    it('Debe detectar modificaciones en asociaciones a uno')
    it('Debe aceptar entero como asociacion', function(){
      let prop = new Instance('Property', { category: { id: 1, name: 'oldCategory' } })
      prop.category = 1
      expect(prop.modified()).to.have.property('category').to.be.equal(1)
    })
    describe('En asociaciones a uno', function() {
      it('Debe considerar nuevo un elemento que no tenga pk', function() {
        let prop = new Instance('Property', { category: { id: 1, name: 'category1' } })
        expect(prop.modified()).to.be.ok.and.to.have.deep.property('category.name').that.equal('category1')
      })
    })
    describe('En asociaciones a Muchos', function() {
      it('Debe detectar elementos añadidos al arreglo')
      it('Debe considerar eliminado un elemento que se quitó del arreglo')
      it('Debe detectar modificaciones en elementos segun su pk')
      it('Debe ignorar un elemento que no tenga pk', function() {
        let user = new Instance('User', { properties: [{ name: 'prop1' }] })
        user.properties[1] = new Instance('Property', { name: 'prop2' })

        expect(user.modified()).to.have.property('properties').that.is.an('array').with.lengthOf(2)
      })
      it('Debe detectar modificaciones en la instancia de junta en asociaciones muchos a muchos', function(){
        let user = new Instance('User', {
          properties:[
            { id: 1, name: 'prop1', UserProperty: { value: 1 } }, //It can be a plain object
            new Instance('Property',  {id: 2, name: 'prop2', UserProperty: { value: 2 } } ), // An instance
          ]
        })

        user.properties[0].UserProperty.value = 10
        let modified = user.modified()

        expect(modified.properties).to.be.ok.and.to.be.an('array').with.lengthOf(1)
        expect(modified.properties).to.have.deep.property('[0].UserProperty.value').that.equal(10)
      })
    })
  })
  it('Debe considerarse "nueva" una instancia cuyo valor de clave primaria este indefinido', function() {
    let user = new Instance('User', {username: 'user1'})
    expect(user.isNewRecord()).to.be.True
  })
})

describe('ModelRegistry', function() {
  it('Establecer/Restablecer esquemas')
  it('Registrar/Deregistrar nuevas definiciones de modelo')
  it('Escuchar y reemitir eventos de modelos')
  it('Propiedad "schema" retorna las definiciones de los modelos')
})

// describe('Model')
// describe('Instance')
