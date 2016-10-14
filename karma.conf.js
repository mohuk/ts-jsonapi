var webpackConfig = require('./config/test');

module.exports = function (config) {
  var _config = {
    basePath: '',

    frameworks: ['mocha'],

    files: [
      '*.ts',
      'test/*.ts'
    ],

    preprocessors: {
      '*.ts': ['webpack'],
      'test/*.ts': ['webpack']
    },

    webpack: webpackConfig,

    webpackMiddleware: {
      stats: 'errors-only'
    },

    webpackServer: {
      noInfo: true
    },

    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true
  };

  config.set(_config);
};
