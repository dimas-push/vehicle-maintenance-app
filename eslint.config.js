// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const COLOR_TOKEN_MESSAGE =
  'Raw color literals are banned outside src/theme — use a color token from src/theme instead.';
const SPACING_TOKEN_MESSAGE =
  'Bare spacing/sizing numbers are banned outside src/theme — use a token from src/theme instead.';

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['jest.setup.js', '**/*.test.{ts,tsx,js}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message: COLOR_TOKEN_MESSAGE,
        },
        {
          selector: 'Literal[value=/^rgba?\\(/]',
          message: COLOR_TOKEN_MESSAGE,
        },
        {
          selector:
            'Property[key.name=/^(padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|gap|rowGap|columnGap|borderRadius|fontSize|lineHeight)$/] > Literal',
          message: SPACING_TOKEN_MESSAGE,
        },
      ],
    },
  },
]);
