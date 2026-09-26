export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          target: 'ES2020',
          allowJs: true,
          esModuleInterop: false,
          resolveJsonModule: true,
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*(@nestjs|@types|reflect-metadata|rxjs|class-validator|class-transformer))',
  ],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!logger-middleware.ts',
    '!main.ts',
  ],
  coverageDirectory: '../coverage',
};
