import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
    { ignores: ['copy.js', 'dist'] },
    { files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], plugins: { js }, extends: ['js/recommended'], languageOptions: { globals: globals.node } },
    tseslint.configs.recommended,
    eslintPluginPrettierRecommended,
    {
        rules: {
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^(_\\w*$)$',
                    varsIgnorePattern: '^(_\\w*$)$',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^(_\\w*$)$',
                    varsIgnorePattern: '^(_\\w*$)$',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            'prettier/prettier': ['error', { printWidth: 180, endOfLine: 'lf', trailingComma: 'none' }],
            'comma-dangle': 'error',
            '@typescript-eslint/no-explicit-any': 'off'
        }
    }
]);
