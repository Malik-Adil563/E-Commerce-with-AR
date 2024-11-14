module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        webpackConfig.resolve.fallback = {
          crypto: require.resolve('crypto-browserify'),
          util: require.resolve('util/'),
          fs: false,  // Optional: Disable fs if you don't need it
          path: require.resolve('path-browserify'),
          stream: require.resolve('stream-browserify'),
        };
        return webpackConfig;
      },
    },
  };
  