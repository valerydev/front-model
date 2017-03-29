module.exports = function (models) {
  let plugins = [
    //Listar plugins aqui
    require('./validation'),
    require('./authentication')
  ]

  plugins.forEach(function (plugin) {
    plugin(models)
  })
}
