lo = require('lodash');
require('./array_observe')(lo);
a=[1,2,3,4,5];
lo.observe( a, 'create', function(it, i) {
  if(typeof it == 'number') {
    a[i] = {n: it};
    console.log('Nuevo Numero')
  }
});
lo.observe( a, 'update', function(it, i) {
  if(typeof it == 'number') {
    a[i] = {n: it};
    console.log('Actualizado Numero')
  }
})
a[2] = 3
setTimeout(()=>console.log(a), 1000)