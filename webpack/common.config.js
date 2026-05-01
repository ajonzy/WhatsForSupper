// webpack plugins
const SplitChunksPlugin = require('webpack/lib/optimize/SplitChunksPlugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  entry: {
    app: ['./src/bootstrap.js'],
    vendor: './src/vendor.js',
  },

  resolve: {
    extensions: ['.js', '.scss'],

    modules: ['node_modules'],
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },

      {
        type: 'javascript/auto',
        test: /\.(jpg|png|gif|eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
          publicPath: '/',
        },
      },

      {
        test: /\.(mp4|webm)$/,
        loader: 'url?limit=10000',
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        AUTH_USERNAME: JSON.stringify(process.env.AUTH_USERNAME),
        AUTH_PASSWORD: JSON.stringify(process.env.AUTH_PASSWORD),
        CLOUDINARY_NAME: JSON.stringify(process.env.CLOUDINARY_NAME),
        CLOUDINARY_UPLOAD_PRESET: JSON.stringify(process.env.CLOUDINARY_UPLOAD_PRESET),
        API_BASE_URL: JSON.stringify((process.env.API_BASE_URL || '').replace(/\/$/, '')),
      },
    }),
    new SplitChunksPlugin({
      name: ['app', 'vendor'],
      minChunks: Infinity,
    }),
  ],
};
