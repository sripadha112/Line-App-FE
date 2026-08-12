const appJson = require('./app.json');
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAdiRegistration = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const tokenFileName = 'adi-registration.properties';
      const tokenSourcePath = path.join(__dirname, 'assets', tokenFileName);
      const tokenContents = fs.readFileSync(tokenSourcePath, 'utf8').trim();
      const assetsDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets');
      const destinationPath = path.join(assetsDir, tokenFileName);

      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(destinationPath, tokenContents + '\n');

      return config;
    },
  ]);
};

module.exports = () => {
  const expoConfig = appJson.expo || {};

  return {
    ...expoConfig,
    plugins: [...(expoConfig.plugins || []), withAdiRegistration],
  };
};
