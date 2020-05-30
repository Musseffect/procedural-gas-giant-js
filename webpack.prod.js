const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {app: './src/index.ts'},
  devtool: 'source-map',//'source-map' for production
  optimization: {
    minimize: true
  },
  plugins:
  [
      new webpack.HotModuleReplacementPlugin()
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'docs'),
    publicPath: '/'
  },
  resolve: {
      // Add '.ts' and '.tsx' as resolvable extensions.
      extensions: [".ts", ".tsx",'.js']
  },
  module: {
    rules: [
        {
            test: /\.ts(x?)$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: "ts-loader"
                }
            ]
        },
        // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        {
            enforce: "pre",
            test: /\.js$/,
            loader: "source-map-loader"
        },
        {
          test: /\.frag?$|\.vert$|\.glsl$/,
          exclude: /node_modules/,
          use: 'raw-loader'
        }    
    ]
}
};
