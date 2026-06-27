module.exports = function (api) {
  api.cache(true);
  return {
    // Tamagui's optimizing compiler is optional; runtime-only is fine for M0.
    presets: ['babel-preset-expo'],
  };
};
