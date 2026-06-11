export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    // strip .js/.jsx suffixes from ESM-style imports so ts-jest can resolve the .ts/.tsx sources
    // (order matters: suffix-stripping variants must come before the generic src/ mapper)
    '^src/(.*)\\.jsx?$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.jsx?$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    // @fullstackcraftllc packages ship ESM-only; transform them so jest (CJS) can load them
    '^.+\\.(js|jsx)$': ['ts-jest', { tsconfig: { allowJs: true } }],
  },
  transformIgnorePatterns: ['/node_modules/(?!@fullstackcraftllc/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
};
