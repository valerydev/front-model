// lo = require('lodash');
// require('./array_observe')(lo);
// a=[1,2,3,4,5];
// lo.observe( a, 'create', function(it, i) {
//   if(typeof it == 'number') {
//     a[i] = {n: it};
//     console.log('Nuevo Numero')
//   }
// });
// lo.observe( a, 'update', function(it, i) {
//   if(typeof it == 'number') {
//     a[i] = {n: it};
//     console.log('Actualizado Numero')
//   }
// })
// a[2] = 3
// setTimeout(()=>console.log(a), 1000)

//global.Set = void 0
require('collections/set')
let _ = require('lodash')


function createSet(values) {
  let valueSet = new Set.CollectionsSet( values )
  valueSet.contentEquals = (function(self) {
    return function(a,b) {
      let equals = (_.isInteger(a)?a:a.id) === (_.isInteger(b)?b:b.id)
      if(equals) {
        if(_.isPlainObject(a) && _.isPlainObject(b))
          _.merge(a,b)
        else {
          self.delete(a)
          self.add(b)
        }
      }
      return equals
    }
  })(valueSet)

  valueSet.contentHash = function(obj) {
    return (_.isInteger(obj) ? obj : obj.id || obj._oid )+''
  }
  return valueSet.clone()
}

let set1 = createSet([{id: 1, name: 'Raul'}, 2])
let set2 = createSet([{id: 1, name: 'Raul C'}, 3])

console.log(set1.group(set2).toArray())

//console.log(valueSet.add({id:1, name: 'Andrea'}))
//console.log(valueSet.toArray())


