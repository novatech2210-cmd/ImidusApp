module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@/theme': './src/theme',
          '@/components': './src/components',
          '@/assets': './src/assets',
        },
      },
    ],
  ],
};
