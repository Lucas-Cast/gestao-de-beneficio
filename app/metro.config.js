const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;

module.exports = withNativeWind(config, {
  input: path.join(projectRoot, 'src/global.css'),
  projectRoot,
  configPath: path.join(projectRoot, 'tailwind.config.js'),
});
