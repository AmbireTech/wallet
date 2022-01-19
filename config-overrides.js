const webpack = require('webpack');
const fs = require('fs');

const path = require("path")

//default copy-webpack-plugin does not copy while dev env?!
class ForceCopyPlugin {
  constructor(src, dest, transformer) {
    this.src = src;
    this.dest = dest;
    this.transformer = transformer;
  }

  apply(compiler) {
    let content = fs.readFileSync(this.src).toString();
    if (this.transformer){
      content = this.transformer(content)
    }
    fs.writeFileSync(this.dest, content);
  }
}


class IndependentWebpackPlugin {
  constructor(src, dest, useAsLib, definitions) {
    this.src = src;
    this.dest = dest;
    this.useAsLib = useAsLib;
    this.definitions = definitions;
  }

  apply(compiler) {
    const webpackConfig = {
      entry: this.src,
      output : {
        path: path.resolve(__dirname),
        filename: this.dest,
        library: this.useAsLib || undefined,
        libraryTarget: this.useAsLib?"var":undefined
      },
      plugins: [
        new webpack.ProvidePlugin({
          'utils': 'utils'
        })
      ],
      optimization: {
        minimize: false
      },
    }

    if (this.definitions) {
      webpackConfig.plugins.unshift(new webpack.DefinePlugin(this.definitions ))
    }

    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(err);
      }
    });
  }
}

module.exports = function override(config, env) {
  if (!config.plugins) {
    config.plugins = [];
  }

  config.plugins.push(new IndependentWebpackPlugin(
      "./src/lib/bookmarklet/ambexBookmarkletMessenger.js",
      "./public/bookmarklet/webpackedAmbexBookmarkletMessenger.js",
      "BML"
    )
  )

  config.plugins.push(new IndependentWebpackPlugin(
      "./src/lib/bookmarklet/bookmarkletInjection.js",
      "./public/bookmarklet/webpackedBookmarkletInjection.js",
      null,
    {"process.env.AMBIRE_URL": JSON.stringify(process.env.AMBIRE_URL)}
    )
  )

  config.plugins.push(new ForceCopyPlugin(
    path.resolve(__dirname, "./src/lib/bookmarklet/bookmarkletSnippet.js"),
    path.resolve(__dirname, "./public/bookmarklet/bookmarkletSnippet.js"),
    (content) => {
      return content.replace('{AMBIRE_URL}',process.env.AMBIRE_URL).replace(/(\r\n|\r|\n)/g, "")
    })
  );

  return config;
}
