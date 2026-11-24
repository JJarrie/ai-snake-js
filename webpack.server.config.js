'use strict';

const path = require('path');

module.exports = {
    entry: {
        server: './src/server.ts'
    },
    target: 'node',
    // Optional native addons of ws, required inside try/catch.
    externals: { bufferutil: 'commonjs bufferutil', 'utf-8-validate': 'commonjs utf-8-validate' },
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