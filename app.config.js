const appJson = require('./app.json');
const withAdiRegistration = require('./plugins/withAdiRegistration');

module.exports = () => {
  const expoConfig = appJson.expo || {};

  return {
    ...expoConfig,
    plugins: [...(expoConfig.plugins || []), withAdiRegistration],
  };
};
