module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest-setup.js'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|react-redux|@reduxjs|@react-navigation|@gorhom|react-native-reanimated|react-native-linear-gradient|react-native-safe-area-context|react-native-screens|react-native-svg|redux|immer|react-native-skeleton-placeholder|use-latest-callback))',
  ],
};
