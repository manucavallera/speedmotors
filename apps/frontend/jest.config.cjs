module.exports = {
  rootDir: 'src',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/../jest.setup.cjs'],
  testRegex: '.*\\.spec\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        target: 'ES2022',
        esModuleInterop: true,
        strict: true,
        jsx: 'react-jsx',
        types: ['jest', 'node'],
      },
    }],
  },
}
