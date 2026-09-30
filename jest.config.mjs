export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.[jt]s$': 'babel-jest',
  },
  // Source files import siblings with the ".js" extension (NodeNext); map them back to the ".ts" sources.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // uuid and jose ship ESM only, so they have to go through babel as well.
  transformIgnorePatterns: ['/node_modules/(?!(uuid|jose)/)'],
  // Only the layers that run without a database, Redis or SMTP; the rest needs integration tests.
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/application/**/*.ts',
    'src/infrastructure/auth/hasher/**/*.ts',
    'src/infrastructure/auth/jwt/jose-token.service.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
};
