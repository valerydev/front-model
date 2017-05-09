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
let models = require('../index')(schema)
let ModelRegistry = models.getClass()
let { Instance, InstanceSet, Model } = ModelRegistry
let xhr, requests

before(()=> {
  if(process.env.target === 'node') {
    xhr = global.XMLHttpRequest = sinon.useFakeXMLHttpRequest()
    xhr.onCreate = function (req) { requests.push(req) }
  }
})

beforeEach(()=> { requests = [] })

describe('Clase "Instance"', function() {
  it('Debe considerarse "nueva" una instancia cuyo valor de clave primaria este indefinido', function() {
    let user = new Instance('User', {username: 'user1'})
    expect(user.$isNewRecord()).to.be.true
  })
  describe('Creacion', function() {
    it('Debe generarse un oid para la instancia de no especificar uno', function(){
      expect(new Instance('Property', {_oid: 1})).to.have.property('_oid').that.equal(1)
      expect(new Instance('Property', {})).to.have.property('_oid').which.is.not.empty
    })
    it('Debe establecer los valores por defecto en atributos requeridos', function() {
      //If values is undefined or null set default values
      let user = new Instance('User')
      expect(user.username).to.be.equal('unnamed')
      expect(user.password).to.be.equal('secret' )

      //but if values is an empty plain object do not set default values
      user = new Instance('User', {})
      expect(user.username).to.be.undefined
      expect(user.password).to.be.undefined
    })
  })
  describe('Metodo "set"', function() {
    it('Debe generar error al establecer una asociacion con un valor entero diferente de cero, objeto, Instance, o ' +
       'arreglo que contenga los mencionados tipos de datos', function() {
      let prop = new Instance('Property', {id:1})
      // expect(()=> prop.$set('category', undefined  )).to.throw(Error)
      expect(()=> prop.$set('category', 'string'   )).to.throw(Error)
      expect(()=> prop.$set('category', 0          )).to.throw(Error)
      expect(()=> prop.$set('category', ()=>{}     )).to.throw(Error)
      // expect(()=> prop.$set({ category: undefined })).to.throw(Error)
      expect(()=> prop.$set({ category: ()=>{}    })).to.throw(Error)
      expect(()=> prop.$set({ category: ()=>{}    })).to.throw(Error)
      expect(()=> prop.$set({ category: ()=>{}    })).to.throw(Error)
    })
    it('Debe establecer el valor de un atributo especifico de la instancia', function() {
      let user = new Instance('User', { username: '' })
      user.$set('username', 'user1')
      expect(user.username).to.be.equal('user1')
    })
    it('Debe establecer una asociacion especifica de la instancia', function() {
      // M:1 or 1:1
      let prop = new Instance('Property', {})
      prop.$set('category', { name: 'cat1' }) // It can be a plain object
      expect(prop.category).to.be.an.instanceOf(Instance).and.to.have.a.property('name').that.equal('cat1')

      prop.$set('category', new Instance('PropertyCategory', { name: 'cat2'})) // an Instance
      expect(prop.category).to.be.an.instanceOf(Instance).and.to.have.a.property('name').that.equal('cat2')

      prop.$set('category', 1) // Or an integer
      expect(prop.category).to.be.a('number')

      //M:N
      let user = new Instance('User', {})
      user.$set('properties', [
        { id:1, name: 'prop1' },
        new Instance('Property', { id:2, name: 'prop2' }),
        3
      ])

      let prop1 = user.properties.find(1)
      let prop2 = user.properties.find(2)
      let prop3 = user.properties.find(3)

      expect(prop1).to.be.an.instanceOf(Instance).and.have.property('name').that.equal('prop1')
      expect(prop2).to.be.an.instanceOf(Instance).and.have.property('name').that.equal('prop2')
      expect(prop3).to.be.an('number').and.to.be.equal(3)
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

      let prop1 = user.properties.find(1)

      user.$set({
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
      expect(user.properties).to.be.instanceOf(InstanceSet).and.to.have.lengthOf(4)
      expect( prop1 === user.properties.find(1) ).to.be.ok
      expect( prop1 ).to.be.ok.and.to.have.property('name').that.equal( 'updatedName' )
      expect( prop1 ).to.have.deep.property('UserProperty.value').that.equal(1)
      expect( prop1 ).to.have.property('defaultValue').that.equal( 0 )
      expect( user.properties.where({name: 'newName'})).to.be.ok

      prop1 = new Instance('Property', {
        id: 1,
        name: 'new',
        UserProperty: { value: 1 }
      })

      user.properties = [prop1]

      expect( user.properties ).to.be.instanceOf(InstanceSet).and.to.have.lengthOf(1)
      expect( user.properties.find(1) ).to.be.ok.and.to.have.property('name').that.equal('new')
      expect( user.properties.find(1) ).and.to.have.property('defaultValue').that.equal(0)

    })
    describe('Al establecer undefined o null', function() {
      it('Debe permitir establecer un atributo u asociacion especifico como indefinido', function() {
        let user = new Instance('User', {
          username: 'user1',
          profile: {
            id: 1,
            name: 'profile1'
          },
          properties: [{
            id: 1,
            name: 'prop1',
          }]
        })

        user.$set('username',   undefined)
        user.$set('profile',    undefined)
        user.$set('properties', undefined)

        expect(user).to.have.property('username'   ).that.is.undefined
        expect(user).to.have.property('profile'    ).that.is.undefined
        expect(user).to.have.property('properties' ).that.is.an.instanceOf(InstanceSet).with.lengthOf(0)
      })
      it('Debe permitir establecer un atributo u asociacion especifico como nulo', function() {
        let user = new Instance('User', {
          username: 'user1',
          profile: {
            id: 1,
            name: 'profile1'
          },
          properties: [{
            id: 1,
            name: 'prop1',
          }]
        })

        user.$set('username',   null)
        user.$set('profile',    null)
        user.$set('properties', null)

        expect(user).to.have.property('username'   ).that.is.null
        expect(user).to.have.property('profile'    ).that.is.null
        expect(user).to.have.property('properties' ).that.is.an.instanceOf(InstanceSet).with.lengthOf(0)
      })
      it('Debe ignorar atributos u asociaciones indefinidas al establecer un objeto', function() {
        let user = new Instance('User', {
          username: 'user1',
          profile: {
            id: 1,
            name: 'profile1'
          },
          properties: [{
            id: 1,
            name: 'prop1',
          }]
        })

        user.$set({
          username  : undefined,
          profile   : undefined,
          properties: undefined
        })

        // Ignora atributos o asociaciones undefined
        expect(user).to.have.property('username'   ).that.is.equal('user1')
        expect(user).to.have.property('profile'    ).that.is.an.instanceOf(Instance)
        expect(user).to.have.property('properties' ).that.is.an.instanceOf(InstanceSet).that.is.not.empty
      })
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
      expect(user.properties.toArray()).all.to.be.instanceOf(Instance)
        .with.property('0')
        .that.have.ownPropertyDescriptor('name')
        .that.containSubset(expectedDescriptor).and.include.keys('get', 'set')
    })
    it('Debe interceptar asignaciones a propiedades de la instancia', function() {
      let user = new Instance('User', { username: '', xxx: '' })
      sinon.spy(user, '$set')
      user.username = 'user1'
      user.xxx = '123'

      expect(user.$set).to.have.been.calledTwice
    })
    it('Debe aceptar entero como asociacion (para soportar operacion CRUD "asociar")', function() {
      //1:1 or M:1
      let property = new Instance('Property', {})
      property.$set('category', 1)
      expect(property.category).to.be.a('number').that.equal(1)
      //1:M or M:N
      let user = new Instance('User', {})
      user.$set('properties', [1, 2, 3])
      expect( user.properties ).to.be.instanceOf(InstanceSet)
      expect( user.properties.toArray()).to.have.lengthOf(3).and.to.deep.equal([1, 2, 3])
    })
  })
  describe('Metodo "get"', function() {
    it('Debe interceptar acceso a propiedades de la instancia', function() {
      let user = new Instance('User', { username: 'user1', xxx: 'xxx' })
      sinon.spy(user, '$get')
      user.username
      user.xxx

      expect(user.$get).to.have.been.calledTwice
    })
    it('Debe leer un atributo especifico de la instancia', function() {
      let rawUser = { username: 'user1' }
      let user = new Instance('User', rawUser)
      expect(user.$get('username')).to.be.equal(rawUser.username)
    })
    it('Debe permitir leer una propiedad profunda de la instancia', function(){
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

      expect(user.$get('properties[0]')).to.be.instanceOf(Instance)
      expect(user.$get('properties[0].UserProperty.value')).to.be.equal('val2')
      expect(user.$get('properties[0].category.name')).to.be.equal('cat1')


      // Alternatively dot syntax to access array elements
      expect(user.$get('properties.0')).to.be.instanceOf(Instance)
      expect(user.$get('properties.0.UserProperty.value')).to.be.equal('val2')
      expect(user.$get('properties.0.category.name')).to.be.equal('cat1')
    })
    it('Debe generar un objeto plano de la instancia, sin atributos o asociaciones indefinidos o vacios', function() {
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

      //Por defecto genera todos los atributos (incluso los no definidos en el modelo) y asociaciones,
      //siempre que su valor no sea "undefined"
      expect( user.$get() ).to.eql( rawUser )
      //Si strict = true solo toma en cuenta los atributos definidos en el modelo, ignora los añadidos
      expect( user.$get({strict: true}) ).to.eql( _.omit(rawUser, 'xxx') )
      //Si deep = true procesa recursivamente las asociaciones
      expect( user.$get({strict: false, deep: true}) ).to.eql(rawUser)
    })
    it('Debe aceptar entero como asociacion (para soportar operacion CRUD "asociar")', function() {
      let rawUser = { properties: [1, 2, 3] }
      let user = new Instance('User', rawUser)
      expect( user.$get({deep: true}) ).to.containSubset(rawUser)
    })
  })
  describe('Metodo "modified"', function(){
    it('Debe detectar modificaciones solo en atributos modificados', function() {
      let user = new Instance('User', { username: 'testUser', password: 'xxx' })
      user.username = 'updatedName'
      let modified = user.$modified()
      expect(modified).to.have.property('username').to.be.equal(user.username)
      expect(modified).not.to.have.property('password')
    })
    it('Debe considerar atributos ficticios (no definidos en el modelo), menos _oid', function(){
      let prop = new Instance('Property', {})
      prop.$set('customAttribute', 1)
      let modified = prop.$modified()
      expect(modified).to.be.ok
        .and.to.have.property('customAttribute').that.equal(1)
      expect(modified).not.to.have.property('_oid')
    })
    it('Debe ignorar atributos tipo funcion', function() {
      let user = new Instance('User', {})
      user.$set('someFunction', function(){})
      expect(user.$modified()).not.to.have.property('someFunction')
    })
    it('Debe aceptar entero como asociacion', function(){
      let prop = new Instance('Property', {
        category: {
          id: 1,
          name: 'oldCategory'
        }
      })
      prop.category = 1
      expect(prop.$modified()).to.have.property('category').to.be.equal(1)
    })
    describe('En asociaciones a uno', function() {
      it('Debe detectar modificaciones en asociaciones a uno', function() {
        let prop = new Instance('Property', {
          category: {
            id: 1,
            name: 'category1'
          }
        })
        prop.category = { id: 1, name: 'updatedCategory' }

        expect(prop.$modified()).to.have.deep.property('category.name').that.equal('updatedCategory')

        prop.category = { id: 1, name: 'category1' } //If we set the initial value again
        let modified = prop.$modified()

        expect(prop.$modified()).to.be.empty //Should show no modification
      })
      it('Debe detectar cambios de signo entre dos enteros', function() {
        let prop = new Instance('Property', {
          category: 1
        })

        prop.category = -1
        expect(prop.$modified()).to.be.ok.and.to.have.property('category').that.equal(-1)

        prop.category = 1
        expect(prop.$modified()).to.be.empty
      })
      it('Debe rastrear cambios en elementos aunque no tengan pk', function() {
        let prop = new Instance('Property', {
          category: {
            name: 'category1'
          }
        })
        prop.category = { name: 'updatedCategory' }

        expect(prop.$modified()).to.be.ok
          .and.to.have.deep.property('category.name').that.equal('updatedCategory')
      })
    })
    describe('En asociaciones a Muchos', function() {
      it('Debe detectar nuevos elementos añadidos al conjunto', function() {
        let user = new Instance('User', {
          id: 1,
          properties: [
            { id: 1, name: 'prop1' },
            { name: 'prop2' }
          ]
        })

        user.properties.add(2)
        user.properties.add({id: 3, name: 'prop3'})

        expect(user.$modified()).to.have.property('properties')
          .that.is.an('array').with.lengthOf(2)
          .and.to.containSubset([ 2, {id: 3, name: 'prop3'} ])
      })
      it('Debe considerar eliminado un elemento que se removio del conjunto', function() {
        let user = new Instance('User', {
          id: 1,
          properties: [
            { id: 1, name: 'prop1' },
            { name: 'prop2' }
          ]
        })

        user.properties.remove(1)

        expect(user.$modified()).to.have.property('properties')
          .that.is.an('array').with.lengthOf(1).with.deep.property('[0]').that.eql({id: 1})
      })
      it('Debe detectar modificaciones en elementos segun su pk u oid', function(){
        let user = new Instance('User', {
          id: 1,
          properties: [
            { id: 1, name: 'prop1' },
            { id: 2, name: 'verbatim' }, //This one will not get modified
            { name: 'prop3' }
          ]
        })
        let prop1 = user.properties.add({ id:1, name: 'updatedProp1' })
        let prop3 = user.properties.first({ name: 'prop3' })
        prop3.name = 'updatedProp3'

        expect(user.$modified()).to.have.property('properties')
          .that.is.an('array').with.lengthOf(2)
          .and.to.containSubset([
            { id: 1, name: 'updatedProp1' },
            { name: 'updatedProp3' }
          ])
      })
      it('Debe detectar modificaciones en la instancias de junta', function(){
        let user = new Instance('User', {
          properties:[
            {
              id: 1,
              name: 'prop1',
              UserProperty: { value: 0 }
            }
          ]
        })

        user.properties.find(1).UserProperty.value = 1
        let modified = user.$modified()

        expect(modified.properties).to.be.ok.and.to.be.an('array').with.lengthOf(1)
        expect(modified.properties.get(0)).to.be.ok.and.to.have.deep.property('UserProperty.value').that.equal(1)
      })
    })
    it('Debe retornar solo objetos planos')
  })
  it('Debe considerarse "nueva" una instancia cuyo valor de clave primaria este indefinido', function() {
    let user = new Instance('User', {username: 'user1'})
    expect(user.$isNewRecord()).to.be.true
  })
})
