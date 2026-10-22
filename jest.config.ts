import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

// Reutiliza os aliases do TypeScript na resolução dos imports dos testes.
const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

// Configura a execução dos testes unitários e de integração e a coleta de cobertura.
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
  ...pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
