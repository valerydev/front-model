module.exports = function (models) {
  var plugins = [
    //Listar plugins aqui
    require('./validation'),
    require('./authentication')
  ]

  plugins.forEach(function (plugin) {
    plugin(models)
  })
}
