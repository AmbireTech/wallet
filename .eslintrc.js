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
  }
}
