import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import ImageMinimizerPlugin from "image-minimizer-webpack-plugin";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { config } from "./src/config/project.config.js";

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
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ["gifsicle", { interlaced: true }],
              ["mozjpeg", { quality: 75 }],
              ["pngquant", { quality: [0.6, 0.8] }],
              [
                "svgo",
                {
                  plugins: [
                    {
                      name: "preset-default",
                      params: {
                        overrides: {
                          removeViewBox: false,
                          addAttributesToSVGElement: {
                            params: {
                              attributes: [
                                { xmlns: "http://www.w3.org/2000/svg" },
                              ],
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            ],
          },
        },
      }),
    ],
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "public"),
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
    ...(isProduction
      ? [
          new MiniCssExtractPlugin({
            filename: "styles.[contenthash].css",
          }),
        ]
      : []),
  ],
};
