var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: path.join(__dirname, './src/app.js'),
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'js/bundle.js'
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin()
    ],
    resolve: {
        root: [
            path.join(__dirname, '..'),
            path.join(__dirname, 'node_modules')
        ]
    },
    noInfo: false,
    quiet: false,
    resolveLoader: {
        modulesDirectories: [
            path.join(__dirname, 'node_modules'),
            path.join(__dirname, 'web_loaders')
        ],
    },
    module: {
        loaders: [{
            loader: 'babel-loader',
            test: /\.js$/,
            include: /example/,
            exclude: /node_modules/,
            query: {
                presets: 'es2015'
            }
        }, {
            test: /\.html$/,
            loader: 'file?name=[name].html'
        }, {
            test: /\.jst/,
            loader: 'jst'
        }, {
            test: /\.css$/,
            loader: 'style!css'
        }, {
            test: /\.json/,
            loader: 'json'
        }, {
            test: /bootstrap\.js/,
            loader: 'imports?jQuery=jquery'
        }, {
            test: /\.woff[2]?(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=application/font-woff'
        }, {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=application/octet-stream'
        }, {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'file'
        }, {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            loader: 'url?limit=10000&mimetype=image/svg+xml'
        }]
    },
    stats: {
        colors: true
    },
    devtool: 'inline-source-map'
};

