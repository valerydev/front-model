const EventEmitter = require('events')
const MIN_PORT = 40000
const MAX_PORT = 65000

class FakeCRUDService extends EventEmitter {
  constructor(path, defaultPort, app) {
    super()
    if(typeof defaultPort == 'function') {
      app = defaultPort
      defaultPort = undefined
    }
    this._port = defaultPort
    this._path = '/' + path.replace(/^\/|\/$/g, '')
    this._app = app
    this.app.get(this.path + '/:id', (...args)=> this.get(...args))
    this.app.get(this.path, (...args)=> this.get(...args))
    this.app.post(this.path, (...args)=> this.create(...args))
    this.app.put(this.path + '/:id', (...args)=> this.update(...args))
    this.app.delete(this.path + '/:id', (...args)=> this.delete(...args))
  }

  onGet(response){ return handleResponse.call(this, 'get', response) }
  onCreate(response){ return handleResponse.call(this, 'create', response) }
  onUpdate(response){ return handleResponse.call(this, 'update', response) }
  onDelete(response){ return handleResponse.call(this, 'delete', response) }

  get(req, res){ this.emit('get', req, res) }
  create(req, res){ this.emit('create', req, res) }
  update(req, res){ this.emit('update', req, res) }
  delete(req, res){ this.emit('delete', req, res) }

  get app() {
    if(!this._app)
      this._app = createDefaultApp()
    return this._app
  }
  get port() {
    if(typeof this._port != 'number')
      this._port = Math.floor(Math.random()*(MAX_PORT-MIN_PORT+1)+MIN_PORT)
    return this._port
  }
  get path() {
    return this._path
  }
  get endpoint() {
    if(this.listening)
      return `http://127.0.0.1:${this.port}/${this.path.replace(/^\//, '')}`
    else throw new Error('Fake CRUD Service not listening')
  }
  get listening() {
    return (this._server||{}).listening
  }
  listen(port) {
    if(this.listening)
      return Promise.reject(new Error(`Already listening on port ${this.port}`))
    port = typeof port == 'number' ? port : this.port
    return new Promise((resolve, reject)=> {
      this._server = this.app.listen(port, (err)=> {
        if(err) reject(err)
        else resolve()
      })
    })
  }
  stop() {
    return new Promise((resolve, reject)=> {
      if(this.listening) {
        this.removeAllListeners()
        this._server.close((err)=> {
          if(err) reject(err);
          else resolve();
        })
      }
      else reject(new Error('Fake CRUD Service not listening'))
    })
  }
  restore() {
    this.removeAllListeners()
  }
}

function createDefaultApp() {
  let app = require('express')()
  app.set('json spaces', 2)
  app.use(require('cookie-parser')())
  app.use(require('body-parser').json())
  app.use(require('method-override')('X-HTTP-Method-Override'))
  return app
}

function handleResponse(event, response) {
  if(typeof response == 'object' || response === null) {
    response = response || {}
    return new Promise((resolve, reject)=> {
      this.on(event, (req, res)=> {
        if(typeof response == 'object') {
          try {
            if(typeof response.headers == 'object') res.set(response.headers)
            if(typeof response.body == 'object') res.json(response.body).then(()=> resolve()).catch(reject)
            else res.end().then(()=> resolve()).catch(reject)
          }
          catch(err) {
            reject(err)
          }
        }
        else res.end().then(()=> resolve()).catch(reject)
      })
    })
  }
  else if(typeof response == 'function') this.on(event, response)
  else return new Promise((resolve)=> this.on(event, (req, res)=> resolve({req, res})))
}

module.exports = FakeCRUDService