let webpackConfig = require('./webpack.config.js')
webpackConfig.entry = undefined

module.exports = function(config) {
  config.set({
    basePath: '',
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    frameworks: ['mocha','chai'],
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'node_modules/phantomjs-polyfill/bind-polyfill.js',
      'test/index.js'
    ],
    exclude: [
      'test/harness/*.js'
    ],
    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap', 'coverage']
    },
    webpack: webpackConfig,
    webpackMiddleware: { },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: './dist/coverage/',
      reporters: [
        { type: 'html' },
        { type: 'text' },
        { type: 'text-summary' }
      ]
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: false,
    concurrency: Infinity,
    client: {
      mocha: {
        // change Karma's debug.html to the mocha web reporter
        // reporter: 'html',
        // grep: '*.js'
      }
    }
  })
}
