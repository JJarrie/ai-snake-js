'use strict';

const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const prettier = require('eslint-plugin-prettier/recommended');

module.exports = [
    { ignores: ['build/**', 'webpack.*.config.js', 'eslint.config.js', '.prettierrc.js'] },
    js.configs.recommended,
    ...tsPlugin.configs['flat/recommended'],
    {
        files: ['src/**/*.{ts,tsx}'],
        ...react.configs.flat.recommended,
        languageOptions: { parser: tsParser, ecmaVersion: 2020, sourceType: 'module' },
        settings: { react: { version: '19.0' } },
    },
    prettier,
];
