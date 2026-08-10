module.exports = ({ config }) => {
  const expoConfig = config || {};

  return {
    ...expoConfig,
    plugins: [...(expoConfig.plugins || []), './plugins/withAdiRegistration'],
  };
};
