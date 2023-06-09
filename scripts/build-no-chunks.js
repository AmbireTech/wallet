/**
 * Code splitting causes chunks to fail to load after a new deployment.
 *
 * It is happening in the case the user has locally cached files
 * and the same time there's a new deployment of the same files,
 * but the files' names are changed (because of the code splitting technique).
 * For instance, the user is attempting to load `main.00455bcf.js` (because his locally cached file is pointing to that chunk),
 * but this file `main.00455bcf.js` is already renamed by the new deployment to `main.11212age.js`.
 * In that case - we can't load the chunk and the user has to refresh the app.
 *
 * One possible solution is to keep the previous and the new deployment files in the same build folder.
 * But this makes the deployment strategy a bit more complex.
 * Together with that, we need to have a script which will periodically clean/removes the obsoleted build files.
 *
 * In the end, we made performance tests against the wallet code splitting feature,
 * and we've seen that the app size doesn't increase a lot (without code splitting).
 * The same time, the performance wasn't affected at all.
 *
 * Because of this, we simply decide to turn off the code splitting feature,
 * instead of making a complex deployment strategies.
 */

const rewire = require('rewire')
// If you ejected, use this instead: const defaults = rewire('./build.js')
const defaults = rewire('react-scripts/scripts/build.js')
let config = defaults.__get__('config')

config.optimization.splitChunks = {
    cacheGroups: {
        default: false
    }
}

config.optimization.runtimeChunk = false

// Renames main.00455bcf.js to main.js
config.output.filename = 'static/js/[name].js'

// Renames main.b100e6da.css to main.css
config.plugins[4].options.filename = 'static/css/[name].css'
config.plugins[4].options.moduleFilename = () => 'static/css/main.css'