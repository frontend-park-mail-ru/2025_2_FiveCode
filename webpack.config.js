import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { config } from "./src/config/project.config.js";
import CopyPlugin from "copy-webpack-plugin";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

export default {
  entry: "./src/app.ts",
  output: {
    filename: isProduction ? "bundle.[contenthash].js" : "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ["babel-loader", "ts-loader"],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : "style-loader",
          "css-loader",
          "postcss-loader",
        ],
      },
      {
        test: /\.ejs$/,
        use: ["html-loader", "template-ejs-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      path: false,
      fs: false,
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify"),
      util: require.resolve("util/"),
      process: require.resolve("process/browser"),
    },
  },
  optimization: {
    minimize: isProduction,
    minimizer: [
      "...",
      new CssMinimizerPlugin(),
    ],
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "dist"),
        publicPath: "/",
      },
      {
        directory: path.join(__dirname, "src/static/service-worker"),
        publicPath: "/",
      },
    ],
    port: config.DEV_SERVER_PORT,
    historyApiFallback: true,
    hot: true,
    allowedHosts: "all",
  },
  mode: isProduction ? "production" : "development",
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    new HtmlWebpackPlugin({
      template: "index.html",
      filename: "index.html",
      minify: isProduction
        ? {
            collapseWhitespace: true,
            removeComments: true,
          }
        : false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/static/service-worker/sw.js"),
          to: path.resolve(__dirname, "dist/sw.js"),
        },
      ],
    }),
    ...(isProduction
      ? [
          new MiniCssExtractPlugin({
            filename: "styles.[contenthash].css",
          }),
        ]
      : []),
  ],
};
