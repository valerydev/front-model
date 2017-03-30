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
let $request = Utils.$request
let xhr, requests

before(()=> {
  xhr = global.XMLHttpRequest = sinon.useFakeXMLHttpRequest()
  xhr.onCreate = function (req) { requests.push(req) }
})

beforeEach(function () { requests = [] })

describe('Protocolo REST de operaciones CRUD', function() {
  describe('GET', function() {
    it('Debe leer todos', async function() {
      // let users = [{
      //   "id": 1,
      //   "password": "123",
      //   "username": "user1",
      //   "email": "user1@cvxven.com"
      // },{
      //   "id": 2,
      //   "password": "456",
      //   "username": "user2",
      //   "email": "user2@cvxven.com"
      // }]
      //
      // let results = models.User.findAll()
      // requests[0].respond(200, {}, JSON.stringify(users))
      // results = await results
      // expect(results).to.be.ok
      // expect(results).to.all.be.instanceOf(models.Instance)
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
