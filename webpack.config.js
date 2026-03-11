const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons']
      }
    },
    argv
  );

  // Add historyApiFallback for SPA routing
  config.devServer = {
    ...config.devServer,
    historyApiFallback: {
      disableDotRule: true,
      index: '/index.html',
      rewrites: [
        { from: /^\/booking/, to: '/index.html' },
        { from: /./, to: '/index.html' }
      ]
    },
    // Ensure proper headers for development
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  };

  return config;
};
