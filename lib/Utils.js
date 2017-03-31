let _  = require('lodash')
let ModelRegistry = require('./ModelRegistry')
let { Instance, InstanceSet } = ModelRegistry

class Utils {
  static $request(endpoint, method, payload, headers) {

    if(/PUT|POST/.test(method) && (!_.isPlainObject(payload) || _.isEmpty(payload))) return Promise.resolve()
    if(payload) headers = _.extend({}, headers, {'Content-Type': 'application/json;charset=UTF-8'})

    let config = { method, endpoint, payload, headers }

    return new Promise(function(resolve, reject) {
      let xhr = new XMLHttpRequest()
      xhr.open('POST', config.endpoint, true)
      xhr.setRequestHeader('X-HTTP-Method-Override', config.method)
      _.each(config.headers, function(value, key){ xhr.setRequestHeader(key, value) })
      xhr.onreadystatechange = function() {
        if(this.readyState == 4) {
          if(this.status == 200) {
            resolve({
              body: this.responseText.length > 0 ? JSON.parse(this.responseText) : null,
              headers: this.getAllResponseHeaders()
            })
          } else {
            reject(new Error(this.url + ': Non 200 response (' + this.status + ' ' + this.statusText + ')'))
          }
        }
      }
      try {
        xhr.send()
      } catch(err) {
        reject(err)
      }
    })
  }
// UUID generator
  static $guid() {
  let s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

  static $normalizePropertyPath(path) {
    return  !_.isEmpty(path) ? path.replace(/(?:\.|^)(\d+)(\.?)/g, (match, $1, $2)=> '[' + $1 + ']' + $2 || '') : path
  }

  static $getPropertyDeep(obj, path) {
    if(!_.isObject(obj) || !_.isString(path) || _.isInteger(path)) return
    if(/[.\[\]]/.test(path)) {
      let curr = obj
      path = Utils.$normalizePropertyPath(path)
      for(let attr of path.split('.')) {
        let r = attr.replace(/\[\d+\]/, '')
        curr = _.isEmpty(r) ? curr : curr[r]
        if(curr instanceof InstanceSet) {
          let match = attr.match(/\[(\d+)\]/)
          if(match) curr = curr.get(parseInt(match[1]))
          else throw new Error('Incorrect property path')
        }
      }
      return curr
    }
    return obj[path]
  }
}

module.exports = Utils

