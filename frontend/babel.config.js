module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          allowlist: ['API_BASE'],
          safe: false,
          verbose: false,
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
