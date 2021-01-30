'use strict';

const path = require('path');

module.exports = {
    entry: {
        server: './src/server.ts'
    },
    target: 'node',
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.scss'],
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'build'),
        publicPath: '/',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    'babel-loader'
                ]
            }
        ],
    },
};