// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = withNativeWind(getDefaultConfig(__dirname), { input: './src/app/globals.css' });

// @capacitor-community/native-audio's package "main" is dist/plugin.js, a rollup
// bundle that expects a webpack global named capacitorExports. Metro evaluates
// that file during the static web export and crashes. The ESM build imports
// @capacitor/core directly, which is what the web bundle and the shell need.
const nativeAudioEsm = path.resolve(
  __dirname,
  'node_modules/@capacitor-community/native-audio/dist/esm/index.js'
);
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@capacitor-community/native-audio') {
    return { type: 'sourceFile', filePath: nativeAudioEsm };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
