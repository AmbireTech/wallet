module.exports = {
  extends: ['./node_modules/ambire-common/.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json'
  },
  settings: {
    // So that the eslint is able to resolve relative import paths
    // {@link https://stackoverflow.com/a/63451047/1333836}
    'import/resolver': {
      typescript: {}
    },
  },
  rules: {
    // Since a lot of files contain JSX, but are with .js extension,
    // do not require specifically .jsx extension, since converting all files
    // results huuuuuge diff in git + history gets lost. Blah.
    "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
  }
}
