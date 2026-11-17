export default {
  testEnvironment: 'node',
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Transpile only: `pnpm check` (tsc --noEmit) type-checks the sources and their specs
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.spec.json' }],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!logger-middleware.ts',
    '!main.ts',
  ],
  coverageDirectory: '../coverage',
};
