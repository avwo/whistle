var path = require('path');
var WorkboxPlugin = require('workbox-webpack-plugin');
var WebpackPwaManifest = require('webpack-pwa-manifest');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var version = require('../../../../package.json').version;

module.exports = {
  entry: {
    index: path.join(__dirname, './js/index'),
  },
  output: {
    path: path.join(__dirname, '../js'),
    filename: `[name]-${version}.js`,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: 'defaults' }]],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
        type: 'asset/resource',
      },
    ],
  },
  mode: 'production',
  plugins: [
    // new webpack.DefinePlugin({
    //   'process.env': {
    //     NODE_ENV: '"production"',
    //   },
    // }),
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false,
    //   },
    // }),
    // new HtmlWebpackPlugin({
    //   template: path.join(__dirname, '../index-template.html'),
    //   filename: path.join(__dirname, '../index.html'),
    //   inject: 'body',
    // }),
    // new WorkboxPlugin.GenerateSW({
    //   // these options encourage the ServiceWorkers to get in there fast
    //   // and not allow any straggling "old" SWs to hang around
    //   clientsClaim: true,
    //   skipWaiting: true,
    // }),
    // new WebpackPwaManifest({
    //   name: 'Whistle PWA',
    //   short_name: 'Whistle',
    //   description: 'HTTP, HTTP2, HTTPS, Websocket debugging proxy',
    //   background_color: '#fff',
    //   crossorigin: 'use-credentials', //can be null, use-credentials or anonymous
    //   publicPath: '/js/',
    //   icons: [
    //     {
    //       src: path.resolve(__dirname, '../img/whistle.png'),
    //       sizes: [192], // multiple sizes
    //     },
    //   ],
    // }),
  ],
};
