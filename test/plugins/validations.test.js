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
let models = require('../../index')(schema);
let ModelRegistry = models.getClass()
let { Instance, InstanceSet, Model } = ModelRegistry


describe('Validation Plugin', function() {
  //it('suck', function(){
  //  let t = require('traverse')
  //  let obj = t({a:{b:{c:1}}, d:[2]}).reduce(function(memo, x){
  //    if( this.isLeaf ) {
  //      memo[this.path.join('.').replace(/\.\d+\.(msg|kind)$/,'').replace(/(?:\.?)(\d+)(\.?)/g, function(match,$1,$2) {
  //        return '[' + $1 + ']' + $2||''
  //      })] = x
  //    }
  //    return memo
  //  },{})
  //  console.log(obj)
  //})
  it('Debe generar error de validacion si falta algun atributo requerido', function(){
    let user = models.User.build({
      id: 1,
      username: '',
      password: '123',
      properties: [{
        id: 1,
        name: '',
        UserProperty: {
          id: 1,
          userId: 1,
          propertyId: 1,
          value: ''
        }
      }]
    })
    let validation = user.validate()
    for(let path in validation) console.log(path)
    //console.log(JSON.stringify(validation,null,2))
  })
  it('Debe agregar error de validacion si falta una asociacion requerida', function() {
    let user = models.Property.build({})
  })
  it('Debe validar tambien instancia de junta en asociaciones a muchos')
  it('Debe agregar dos o mas errores de validacion para un solo attributo/asociacion')
  it('Debe permitir obtener los errores en formato plano', function() {
  })
})
