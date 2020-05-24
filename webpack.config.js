const path=require('path');
const webpack = require('webpack');

module.exports = {
    entry:'./src/main.ts',
    devtool: "inline-source-map",
    output:
    {
        filename:'bundle.js',
        path:path.resolve(__dirname,'docs')
    },
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx",'.js']
    },
    devServer: {
        contentBase: './docs',
        hot: true,
        historyApiFallback: true
    },
    watch: false,
    watchOptions: {
        ignored: /node_modules/,
    },
    plugins:
    [
	    new webpack.HotModuleReplacementPlugin(),
    ],
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
    },
};