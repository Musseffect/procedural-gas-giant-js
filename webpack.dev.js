const path=require('path');

module.exports = {
    entry:'./src/main.ts',
    devtool: "inline-source-map",
    output:
    {
        filename:'bundle.js',
        path:path.resolve(__dirname,'docs')
    },
    devServer: {
           contentBase: './docs',
           hot: true,
           historyApiFallback: true
    },
    watchOptions: {
        ignored: /node_modules/,
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
    },
};