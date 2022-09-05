/**
 * The typescript version of create-react-app is using the babel-loader to
 * transform typescript into javascript. The problem is that the ambire-common
 * npm package needs to be compiled. But the create-react-app webpack only
 * compiles ts|tsx in the `./src` directory (paths.appSrc).
 * One option to modify the webpack is to eject the create-react-app,
 * but another one is to simply modify the webpack config to include
 * the node_modules/ambire-common package as an exception.
 *
 * A bit hackish and might break if (when) react-scripts package gets
 * updated in future. So be aware!
 *
 * Inspired by {@link https://stackoverflow.com/a/63067008/1333836},
 * but modified a bit to do line change instead of line delete.
*/
const fs = require('fs');

function modifyLineFromFile(props) {
  const data = fs.readFileSync(props.path, 'utf-8');
  const array = data.split('\n');
  const value = array[props.lineToModify.index - 1].trim();

  if (value === props.lineToModify.value) {
    array.splice(props.lineToModify.index - 1, 1, props.lineToModify.newValue);
    const newData = array.join('\n');
    fs.writeFileSync(props.path, newData, 'utf-8');
  }
}

modifyLineFromFile({
  path: 'node_modules/react-scripts/config/webpack.config.js',
  lineToModify: {
    index: 406,
    value: 'include: paths.appSrc,',
    newValue: "include: [paths.appSrc, paths.appNodeModules + '/ambire-common'],"
  },
});

// required for WC 2.0
modifyLineFromFile({
  path: 'node_modules/react-scripts/config/webpack.config.js',
  lineToModify: {
    index: 501,
    value: 'inputSourceMap: shouldUseSourceMap,',
    newValue: "inputSourceMap: shouldUseSourceMap, plugins: [ require.resolve('@babel/plugin-proposal-nullish-coalescing-operator')],"
  },
});


console.log('✅ Create React App webpack config modified, in order to compile the ts|tsx code in the ambire-common package. Be aware that this might break if (when) react-scripts package gets updated in future.')
