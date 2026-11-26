import { fixupPluginRules } from '@eslint/compat';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import reactNativeCommunity from '@react-native/eslint-plugin';
import { defineConfig } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import jest from 'eslint-plugin-jest';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Rules ported from @react-native/eslint-config (shared.js, 0.84.1).
 * That package still peers on ESLint ^8 || ^9 and crashes under ESLint 10
 * (`scopeManager.addGlobals is not a function`), so the preset is inlined here.
 * Rules removed from ESLint core (valid-jsdoc, no-catch-shadow, no-native-reassign,
 * no-negated-in-lhs, Node.js rules, no-new-object) and the Flow-only rules are dropped.
 */
const reactNativeGlobals = {
  __DEV__: 'writable',
  __fbBatchedBridgeConfig: 'readonly',
  ErrorUtils: 'readonly',
};

const reactNativeRules = {
  'no-cond-assign': 'warn',
  'no-console': 'off',
  'no-const-assign': 'error',
  'no-constant-condition': 'off',
  'no-control-regex': 'warn',
  'no-debugger': 'warn',
  'no-dupe-class-members': 'error',
  'no-dupe-keys': 'error',
  'no-empty': 'off',
  'no-ex-assign': 'warn',
  'no-extra-boolean-cast': 'warn',
  'no-func-assign': 'warn',
  'no-inner-declarations': 'off',
  'no-invalid-regexp': 'warn',
  'no-obj-calls': 'warn',
  'no-regex-spaces': 'warn',
  'no-sparse-arrays': 'warn',
  'no-unreachable': 'error',
  'use-isnan': 'warn',
  'valid-typeof': 'warn',
  'dot-notation': 'warn',
  'no-alert': 'warn',
  'no-caller': 'warn',
  'no-div-regex': 'warn',
  'no-eval': 'error',
  'no-extend-native': 'warn',
  'no-extra-bind': 'warn',
  'no-fallthrough': 'warn',
  'no-implied-eval': 'warn',
  'no-labels': 'warn',
  'no-iterator': 'warn',
  'no-lone-blocks': 'warn',
  'no-new': 'warn',
  'no-new-func': 'error',
  'no-new-wrappers': 'warn',
  'no-octal': 'warn',
  'no-octal-escape': 'warn',
  'no-proto': 'warn',
  'no-redeclare': 'off',
  'no-return-assign': 'warn',
  'no-script-url': 'warn',
  'no-self-compare': 'warn',
  'no-sequences': 'warn',
  'no-unused-expressions': 'off',
  'no-useless-escape': 'warn',
  'no-void': 'warn',
  'no-with': 'warn',
  'radix': 'warn',
  'yoda': 'warn',
  'no-delete-var': 'warn',
  'no-global-assign': 'error',
  'no-label-var': 'warn',
  'no-shadow': 'warn',
  'no-shadow-restricted-names': 'warn',
  'no-undef': 'error',
  'no-undef-init': 'warn',
  'no-unused-vars': [
    'warn',
    { vars: 'all', args: 'none', ignoreRestSiblings: true },
  ],
  'no-use-before-define': 'off',
  'consistent-this': 'warn',
  'no-array-constructor': 'warn',
  'no-empty-character-class': 'warn',
  'no-object-constructor': 'warn',
  'no-bitwise': 'warn',

  '@eslint-community/eslint-comments/no-aggregating-enable': 'warn',
  '@eslint-community/eslint-comments/no-unlimited-disable': 'warn',
  '@eslint-community/eslint-comments/no-unused-disable': 'warn',
  '@eslint-community/eslint-comments/no-unused-enable': 'warn',

  'react/jsx-no-comment-textnodes': 'error',
  'react/jsx-no-duplicate-props': 'error',
  'react/jsx-no-undef': 'error',
  'react/jsx-uses-react': 'warn',
  'react/jsx-uses-vars': 'warn',
  'react/no-did-mount-set-state': 'warn',
  'react/no-did-update-set-state': 'warn',
  'react/no-string-refs': 'error',
  'react/no-unstable-nested-components': 'warn',
  'react/self-closing-comp': 'warn',

  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'error',

  'react-native/no-inline-styles': 'warn',
  '@react-native/no-deep-imports': 'warn',
};

/**
 * PHPStan level-10 equivalent for TypeScript.
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

export default defineConfig([
  {
    ignores: [
      'node_modules/',
      'lib/',
      'plugin/build/',
      '.github/scripts/',
      'example/',
      'example-expo/',
      'coverage/',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@eslint-community/eslint-comments': eslintComments,
      'react': fixupPluginRules(react),
      'react-hooks': reactHooks,
      'react-native': fixupPluginRules(reactNative),
      '@react-native': fixupPluginRules(reactNativeCommunity),
      prettier,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...reactNativeGlobals,
      },
    },
    settings: { react: { version: 'detect' } },
    rules: reactNativeRules,
  },
  {
    // CommonJS entry points and build configs.
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.base],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'warn',
      'no-undef': 'off',
      ...typescriptStrictRules,
    },
  },
  {
    files: [
      '**/*.{spec,test}.{js,ts,tsx}',
      '**/__{mocks,tests}__/**/*.{js,ts,tsx}',
    ],
    plugins: { jest },
    languageOptions: { globals: globals.jest },
    rules: {
      'react-native/no-inline-styles': 'off',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'warn',
      'jest/no-identical-title': 'warn',
      'jest/valid-expect': 'warn',
    },
  },
  prettierConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
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
      // Prefer bracket access for Record<> metrics under noPropertyAccessFromIndexSignature.
      'dot-notation': 'off',
    },
  },
]);
