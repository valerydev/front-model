var target = process.env.target || 'web';
process.env.stage = process.env.stage || 'prod'
var isTest = process.env.stage == 'test';
var isProd = process.env.stage == 'prod';

let entrypoint = isTest ? './test/index.js' : './index.js'

var config = {
  entry: [entrypoint],
  output: {
    path: __dirname + "/dist",
    publicPath: "",
    filename: "model.js"
  },
  target: target,
  module: {
    loaders: [
      //Babel
      {
        test: /.*\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: [
            "add-module-exports",
            "transform-class-properties",
            "syntax-async-functions",
            "transform-regenerator"
          ],
          cacheDirectory: true
        }
      },
      {
        test: /\.js$/,
        exclude: /(test|node_modules|bower_components)/,
        loader: 'istanbul-instrumenter-loader',
        enforce: 'post'
      },
      {
        test: /\.js$/,
        loader: "transform-loader?brfs",
        exclude: /(node_modules|bower_components)/,
        enforce: 'post'
      }
    ]
  },

  node: {
    __dirname: true,
    __filename: true,
    global: true
  },

  devtool: 'inline-source-map'
};

module.exports = config;