module.exports = function (api) {
  api.cache(true);
  return {
    // `babel-preset-expo` auto-injects `react-native-worklets/plugin` (the
    // Reanimated 4 / keyboard-controller worklet transform) as the last
    // plugin when it detects `react-native-reanimated`. Don't list it
    // explicitly — running the plugin twice corrupts module resolution
    // and surfaces as `Unable to resolve ./jestUtils` from Reanimated.
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
  };
};
