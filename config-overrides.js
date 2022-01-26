//This file is called on npm run start/build, via react-app-rewired (package json script modified)
// "start": "react-app-rewired start",
// "build": "react-app-rewired build",

//We need to use webpack, to webpack separate js file (yes, it is webpack in a webpack process)
const webpack = require('webpack')
const fs = require('fs')
const path = require('path')

//default copy-webpack-plugin does not copy while dev env(at least did not manage to do so) so I did my own
class ForceCopyPlugin {
  constructor(src, dest, transformer) {
    this.src = src
    this.dest = dest
    this.transformer = transformer
  }

  apply(compiler) {
    let content = fs.readFileSync(this.src).toString()
    if (this.transformer) {
      content = this.transformer(content)
    }
    fs.writeFileSync(this.dest, content)
  }
}

//Handle webpack into webpack plugin
class IndependentWebpackPlugin {
  constructor(src, dest, useAsLib, definitions) {
    this.src = src
    this.dest = dest
    this.useAsLib = useAsLib
    this.definitions = definitions
  }

  //Webpack pass
  apply(compiler) {
    const webpackConfig = {
      entry: this.src,
      output: {
        path: path.resolve(__dirname),
        filename: this.dest,
        library: this.useAsLib || undefined, // to export global vars outside of the packed context
        libraryTarget: this.useAsLib ? 'var' : undefined
      },
      plugins: [],
      optimization: {
        minimize: true
      },
    }

    if (this.definitions) {
      //forward definitions from config below(to include env vars)
      webpackConfig.plugins.unshift(new webpack.DefinePlugin(this.definitions))
    }

    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(err)
      }
    })
  }
}

//used by react-app-rewired
module.exports = function override(config, env) {
  if (!config.plugins) {
    config.plugins = []
  }

  //webpack this separately (protocol messaging lib used by injector, iframe and bookmarklet hook)
  config.plugins.push(new IndependentWebpackPlugin(
      './src/lib/bookmarklet/ambexBookmarkletMessenger.js',
      './public/bookmarklet/webpackedAmbexBookmarkletMessenger.js',
      'BML'
    )
  )

  //webpack this separately (bookmarklet injector spawned by the snippet)
  config.plugins.push(new IndependentWebpackPlugin(
      './src/lib/bookmarklet/bookmarkletInjection.js',
      './public/bookmarklet/webpackedBookmarkletInjection.js',
      null,
      {
        'process.env.AMBIRE_URL': JSON.stringify(process.env.AMBIRE_URL),
        'process.env.VERBOSE': JSON.stringify(process.env.VERBOSE)
      }
    )
  )

  //Standard copy transform plugin (replacing env var)
  config.plugins.push(new ForceCopyPlugin(
    path.resolve(__dirname, './src/lib/bookmarklet/bookmarkletSnippet.js'),
    path.resolve(__dirname, './public/bookmarklet/bookmarkletSnippet.js'),
    (content) => {
      return content.replace('{AMBIRE_URL}', process.env.AMBIRE_URL).replace(/(\r\n|\r|\n)/g, '')
    })
  )

  return config
}
