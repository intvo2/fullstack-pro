/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-undef */
/*
👋 Hi! This file was autogenerated by tslint-to-eslint-config.
https://github.com/typescript-eslint/tslint-to-eslint-config

It represents the closest reasonable ESLint configuration to this
project's original TSLint configuration.

We recommend eventually switching this configuration to extend from
the recommended rulesets in typescript-eslint.
https://github.com/typescript-eslint/tslint-to-eslint-config/blob/master/docs/FAQs.md

Happy linting! 💖
*/
module.exports = {
  extends: [
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    createDefaultProgram: true, 
    project: './tsconfig.json',
  },
  rules: {
    'import/prefer-default-export': 'off',
  },
  // 'parser': '@typescript-eslint/parser',
  // 'parserOptions': {
  //     'createDefaultProgram': true,
  //     'project': './tsconfig.json',
  //     'ecmaFeatures': {
  //         'jsx': true,
  //     },
  //     'ecmaVersion': 2018,
  //     'sourceType': 'module',
  // },
  // 'plugins': [
  //     '@typescript-eslint',
  //     'eslint-plugin-jsdoc',
  //     'eslint-plugin-no-null',
  //     'eslint-plugin-react',
  //     'simple-import-sort',
  // ],
  // 'extends': [
  //     'prettier',
  //     'prettier/react',
  //     'eslint:recommended',
  //     'plugin:react/recommended',
  //     'prettier/@typescript-eslint',
  //     'plugin:@typescript-eslint/eslint-recommended',
  //     'plugin:@typescript-eslint/recommended',
  // ],
  // 'rules': {
  //     '@typescript-eslint/explicit-member-accessibility': [
  //         'error',
  //         {
  //             'accessibility': 'explicit',
  //         },
  //     ],
  //     '@typescript-eslint/indent': [
  //         'off',
  //         4,
  //         {
  //             'CallExpression': {
  //                 'arguments': 'first',
  //             },
  //             'FunctionDeclaration': {
  //                 'parameters': 'first',
  //             },
  //             'FunctionExpression': {
  //                 'parameters': 'first',
  //             },
  //         },
  //     ],
  //     '@typescript-eslint/member-delimiter-style': [
  //         'error',
  //         {
  //             'multiline': {
  //                 'delimiter': 'semi',
  //                 'requireLast': true,
  //             },
  //             'singleline': {
  //                 'delimiter': 'semi',
  //                 'requireLast': false,
  //             },
  //         },
  //     ],
  //     '@typescript-eslint/member-ordering': 'error',
  //     '@typescript-eslint/naming-convention': [
  //         'error',
  //         // Allow camelCase variables (23.2), PascalCase variables (23.8), and UPPER_CASE variables (23.10)
  //         {
  //             selector: 'variable',
  //             format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
  //         },
  //         // Allow camelCase functions (23.2), and PascalCase functions (23.8)
  //         {
  //             selector: 'function',
  //             format: ['camelCase', 'PascalCase'],
  //         },
  //         // Airbnb recommends PascalCase for classes (23.3), and although Airbnb does not make TypeScript recommendations, we are assuming this rule would similarly apply to anything "type like", including interfaces, type aliases, and enums
  //         {
  //             selector: 'typeLike',
  //             format: ['PascalCase'],
  //         },
  //     ],
  //     '@typescript-eslint/no-empty-function': 'error',
  //     '@typescript-eslint/no-inferrable-types': 'off',
  //     '@typescript-eslint/no-require-imports': 'off',
  //     '@typescript-eslint/no-shadow': [
  //         'error',
  //         {
  //             'hoist': 'all',
  //         },
  //     ],
  //     '@typescript-eslint/no-unused-expressions': 'error',
  //     '@typescript-eslint/no-unused-vars': 'error',
  //     '@typescript-eslint/no-use-before-define': 'error',
  //     '@typescript-eslint/no-var-requires': 'off',
  //     '@typescript-eslint/prefer-namespace-keyword': 'error',
  //     '@typescript-eslint/quotes': [
  //         'error',
  //         'single',
  //         {
  //             'avoidEscape': true,
  //         },
  //     ],
  //     '@typescript-eslint/semi': [
  //         'error',
  //         'always',
  //     ],
  //     '@typescript-eslint/type-annotation-spacing': 'error',
  //     'brace-style': [
  //         'error',
  //         '1tbs',
  //     ],
  //     'comma-dangle': [
  //         'error',
  //         'always-multiline',
  //     ],
  //     'curly': 'error',
  //     'default-case': 'error',
  //     'eol-last': 'error',
  //     'eqeqeq': [
  //         'error',
  //         'smart',
  //     ],
  //     'guard-for-in': 'error',
  //     'id-blacklist': [
  //         'error',
  //         'any',
  //         'Number',
  //         'number',
  //         'String',
  //         'string',
  //         'Boolean',
  //         'boolean',
  //         'Undefined',
  //         'undefined',
  //     ],
  //     'id-match': 'error',
  //     'jsdoc/check-alignment': 'error',
  //     'jsdoc/check-indentation': 'error',
  //     'jsdoc/newline-after-description': 'error',
  //     'max-len': [
  //         'error',
  //         {
  //             'code': 140,
  //         },
  //     ],
  //     'no-bitwise': 'error',
  //     'no-caller': 'error',
  //     'no-cond-assign': 'error',
  //     'no-console': [
  //         'error',
  //         {
  //             'allow': [
  //                 'warn',
  //                 'dir',
  //                 'timeLog',
  //                 'assert',
  //                 'clear',
  //                 'count',
  //                 'countReset',
  //                 'group',
  //                 'groupEnd',
  //                 'table',
  //                 'dirxml',
  //                 'error',
  //                 'groupCollapsed',
  //                 'Console',
  //                 'profile',
  //                 'profileEnd',
  //                 'timeStamp',
  //                 'context',
  //             ],
  //         },
  //     ],
  //     'no-debugger': 'error',
  //     'no-empty': 'error',
  //     'no-eval': 'error',
  //     'no-fallthrough': 'error',
  //     'no-multiple-empty-lines': 'off',
  //     'no-new-wrappers': 'error',
  //     'no-null/no-null': 'off',
  //     'no-redeclare': 'error',
  //     'no-trailing-spaces': 'error',
  //     'no-underscore-dangle': 'error',
  //     'no-unused-labels': 'error',
  //     'no-var': 'error',
  //     'radix': 'error',
  //     'react/jsx-boolean-value': 'error',
  //     'react/jsx-curly-spacing': [
  //         'error',
  //         {
  //             'when': 'never',
  //         },
  //     ],
  //     'react/jsx-equals-spacing': [
  //         'error',
  //         'never',
  //     ],
  //     'react/jsx-key': 'error',
  //     'react/jsx-no-bind': 'error',
  //     'react/jsx-wrap-multilines': 'error',
  //     'react/self-closing-comp': 'error',
  //     '@typescript-eslint/explicit-function-return-type': 'off',
  //     '@typescript-eslint/no-explicit-any': 'off',
  //     '@typescript-eslint/jsx-no-lambda': 'off',
  //     '@typescript-eslint/prefer-interface': 'off',
  //     '@typescript-eslint/interface-name-prefix': 'off',
  //     '@typescript-eslint/camelcase': 'off',
  //     'simple-import-sort/imports': 'warn',
  //     'sort-keys': 'off',
  //     'sort-imports': 'off',
  // },
  // 'env': {
  //     'browser': true,
  //     'es6': true,
  // },
};
