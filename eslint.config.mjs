import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

/**
 * PHPStan level-10 equivalent for TypeScript.
 * Rules attach to the FlatCompat object that already registers @typescript-eslint
 * (from @react-native/eslint-config) so the plugin is not redefined.
 */
const typescriptStrictRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/require-await': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  '@typescript-eslint/consistent-type-assertions': [
    'error',
    {
      assertionStyle: 'as',
      objectLiteralTypeAssertions: 'allow',
    },
  ],
  '@typescript-eslint/no-unnecessary-condition': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/strict-boolean-expressions': [
    'error',
    {
      allowString: true,
      allowNumber: true,
      allowNullableObject: true,
      allowNullableBoolean: true,
      allowNullableString: true,
      allowNullableNumber: true,
      allowAny: false,
    },
  ],
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  'no-restricted-syntax': [
    'error',
    {
      selector: 'TSEnumDeclaration',
      message: 'Prefer const objects / union types over enums.',
    },
  ],
};

const baseConfigs = fixupConfigRules(
  compat.extends('@react-native', 'prettier')
).map((config) => {
  if (config.plugins?.['@typescript-eslint'] == null) {
    return config;
  }

  return {
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parser: tsParser,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      ...config.rules,
      ...typescriptStrictRules,
    },
  };
});

export default defineConfig([
  {
    ignores: [
      'node_modules/',
      'lib/',
      'plugin/build/',
      '.github/scripts/',
      'example/',
      'coverage/',
    ],
  },
  ...baseConfigs,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { prettier },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-throw-literal': 'error',
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
]);
