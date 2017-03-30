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
let { Instance, InstanceSet, Model, Utils } = ModelRegistry

describe('$getPropertyDeep', function() {
  it('Debe extraer la propiedad profunda especificada', function(){
    expect( Utils.$getPropertyDeep(0, 'a.b.c') ).not.to.be.ok
    expect( Utils.$getPropertyDeep({a:{b:{c:0}}}, 'a.b.c') ).to.equal(0)

    let user = models.User.build({
      id: 1,
      properties: [{
        id: 1,
        name: 'prop1',
        UserProperty: {
          userId: 1,
          propertyId: 2,
          value: 0
        }
      }]
    })
    expect( Utils.$getPropertyDeep(user, 'properties') ).to.be.an.instanceOf(InstanceSet)
    expect( Utils.$getPropertyDeep(user, 'properties[0]') ).to.be.an.instanceOf(Instance)
    expect( Utils.$getPropertyDeep(user, 'properties[0].name') ).to.be.equal('prop1')
    expect( Utils.$getPropertyDeep(user, 'properties[0].UserProperty.value') ).to.be.equal(0)
    expect( Utils.$getPropertyDeep(user.properties, '[0].UserProperty.value') ).to.be.equal(0)

    expect( Utils.$getPropertyDeep(user, 'properties') ).to.be.an.instanceOf(InstanceSet)
    expect( Utils.$getPropertyDeep(user, 'properties.0') ).to.be.an.instanceOf(Instance)
    expect( Utils.$getPropertyDeep(user, 'properties.0.name') ).to.be.equal('prop1')
    expect( Utils.$getPropertyDeep(user, 'properties.0.UserProperty.value') ).to.be.equal(0)
    expect( Utils.$getPropertyDeep(user.properties, '0.UserProperty.value') ).to.be.equal(0)

  })
})
